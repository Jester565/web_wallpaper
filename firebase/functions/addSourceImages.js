const _ = require('lodash');
const vision = require('@google-cloud/vision');
const SourceTypeGetImgs = require('./sourceTypes/sourceTypes');
const { getAll } = require('./utils');

const MAX_TEXTS = 5;

const removeUsedImgs = async (imgs, deviceDocs) => {
    let allPrevWallpaperIDs = {};
    for (let deviceDoc of deviceDocs) {
        for (let prevWallpaper of deviceDoc.data().prevWallpapers) {
            allPrevWallpaperIDs[prevWallpaper.id] = true;
        }
    }
    return _.filter(imgs, (img) => (!allPrevWallpaperIDs[img.id]));
}

//Determine if the device is interested in getting the vision data for this image or if we can already discard it
const shouldGetVision = (img, device) => {
    if (!device.minRes.disabled) {
        if (img.meta.width < device.minRes.width || img.meta.height < device.minRes.height) {
            return false;
        }
    }
    if (!device.targetAspectRatio.disabled) {
        let imgAspectRatio = img.meta.width / img.meta.height;
        if ((imgAspectRatio < device.targetAspectRatio.aspectRatio * (device.targetAspectRatio.off / 100.0))
            || (imgAspectRatio > device.targetAspectRatio.aspectRatio * (device.targetAspectRatio.off / 100.0 + 1.0))) {
            return false;
        }
    }
    return true;
}

//Get Google Cloud vision annotations for an image with cropping at provided aspectRatios
const getVisionData = async (img, aspectRatios, visionClient) => {
    let imgData = await img.getData();
    let gPayload = {
        image: { content: imgData }, 
        features: [{type: 'TEXT_DETECTION'}, {type: 'CROP_HINTS'}, {type: 'FACE_DETECTION'}],
        imageContext: {
            cropHintsParams: {
                aspectRatios
            }
        }
    };
    const gRes = await visionClient.batchAnnotateImages({requests: [gPayload]});
    const detections = gRes[0].responses[0];
    console.log("Detections: " + JSON.stringify(detections));
    return detections;
}

const shouldUseImage = (source, device, visionData) => {
    //TODO: Consider a confidence threshold
    if (visionData.hasFaces > 0 && source.noFaces) {
        return false;
    }
    if (visionData.hasText && source.noText) {
        return false;
    }
    //TODO: Account for background color
    return true;
}

//Adds image to images collection, returns ref
const addImg = async (userID, img, aspectRatios, visionClient, db) => {
    let imgRef = db.collection("images").doc(img.id);
    let imgDoc = await imgRef.get();
    if (!imgDoc.exists) { 
        let visionData = await getVisionData(img, aspectRatios, visionClient);
        await db.collection("images")
        .doc(img.id)
        .set({
            userID,
            url: img.url,
            //optional data
            imgLocation: img.meta.imgLocation,
            name: img.meta.name,
            description: img.meta.description,
            visionData: {
                hasFaces: visionData.faceAnnotations.length > 0,
                hasText: visionData.textAnnotations.length > MAX_TEXTS,
                //TODO: Determine if crophints should be removed for similar aspect ratios
                cropHints: _.map(visionData.cropHintsAnnotation.cropHints, (cropHint, i) => {
                    let vertices = cropHint.boundingPoly.vertices;
                    let top = vertices[0].y;
                    let left = vertices[0].x;
                    let width = vertices[2].x - left;
                    let height = vertices[2].y - top;
                    return {
                        aspectRatio: aspectRatios[i],
                        pane: {
                            top, left, width, height
                        }
                    }
                })
            }
        });
        imgDoc = await imgRef.get();
    }
    return imgDoc;
}

//Set images for the source of the devices
exports.addSourceImages = async (userID, sourceID, deviceIDs, db) => {
    let userRef = db.collection("users").doc(userID);
    let userDoc = await userRef.get();
    let userData = userDoc.data();
    let source = userData.sources[sourceID];
    let sourceDeviceDocs = await getAll(_.map(deviceIDs, (deviceID) => {
        return db.collection("devices").doc(deviceID);
    }));
    //id, meta: { width, height }, Promise<String> get() }
    let getImgs = SourceTypeGetImgs[source.type];
    if (getImgs == null) {
        throw `Could not find a source type matching: ${source.type}`;
    }
    let imgs = await getImgs(source.typeConfig);
    //If images were already used as a wallpaper, remove them
    imgs = await removeUsedImgs(imgs, deviceDocs);
    
    //Get all devices interested in the source
    let sourceDeviceDocs = _.filter(deviceDocs, (deviceDoc) => {
        if (source.excludedDevices != null) {
            for (let excludedDevice of source.excludedDevices) {
                if (deviceDoc.id == excludedDevice.id) {
                    return false;
                }
            }
        }
        return true;
    });

    let sourceDeviceAspectRatios = _.map(sourceDeviceDocs, (deviceDoc) => {
        return deviceDoc.targetAspectRatio.aspectRatio;
    });
    //Remove duplicate aspect ratios and sort
    sourceDeviceAspectRatios = _.sortedUniq(sourceDeviceAspectRatios);

    //Foreach device, find a suitable images, use addImgPromises map to avoid duplicate requests
    let visionClient = new vision.ImageAnnotatorClient();
    let addImgPromises = {};
    let getDeviceImgPromises = [];
    for (let devDoc of sourceDeviceDocs) {
        getDeviceImgPromises.push((async (deviceDoc) => {
            for (let img of imgs) {
                if (shouldGetVision(img, deviceDoc.data())) {
                    if (addImgPromises[img.id] == null) {
                        addImgPromises[img.id] = addImg(userID, img, sourceDeviceAspectRatios, visionClient, db);
                    }
                    let addImgPromise = addImgPromises[img.id];
                    let imgDoc = await addImgPromise;
                    if (shouldUseImage(source, deviceDoc.data(), imgDoc.data().visionData)) {
                        return imgDoc.ref;
                    }
                }
            }
        }).bind(this, devDoc));
    }
    
    //Foreach reference
    let devImgRefs = await Promise.all(getDeviceImgPromises);

    for (let i = 0; i < sourceDeviceDocs.length; i++) {
        let deviceDoc = sourceDeviceDocs[i];
        let imgRef = devImgRefs[i];
        let sourceImages = deviceDoc.data().sourceImages[sourceID];
        let newSourceImages = [];
        if (sourceImages != null) {
            newSourceImages = _.filter(sourceImages, (srcImgRef) => {
                return imgRef.id != srcImgRef.id;
            });
        }
        //Add image to beginning of array
        newSourceImages.unshift(imgRef);
        deviceDoc.ref.set({
            sourceImages: {
                [sourceID]: newSourceImages
            }
        }, {
            merge: true
        })
    }
}
