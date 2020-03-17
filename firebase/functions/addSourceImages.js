
const _ = require('lodash');
const vision = require('@google-cloud/vision');
const SourceTypeGetImgs = require('./sourceTypes/sourceTypes');
const { getAll } = require('./utils');
 
const MIN_CONFIDENCE = 0.6;
const MIN_FACE_AREA_PERCENT = 0.02;  //must be 100 pixels squared to be counted
const MIN_TEXT_AREA_PERCENT = 0.015;
const MIN_TEXTS = 4;
const DEFAULT_IMG_W = 1920;
const DEFAULT_IMG_H = 1080;
 
const removeUsedImgs = async (imgs, deviceDocs) => {
    let allWallpaperIDs = {};
    for (let deviceDoc of deviceDocs) {
        for (let wallpaper of deviceDoc.data().wallpapers) {
            allWallpaperIDs[wallpaper.id] = true;
        }
    }
    return _.filter(imgs, (img) => (!allWallpaperIDs[img.id]));
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

//Ensure that face annotations meet thresholds before counting them
const getNumFaces = (visionData, imgW, imgH) => {
    let numFaces = 0;
    if (imgW == null) {
        imgW = DEFAULT_IMG_W;
    }
    if (imgH == null) {
        imgH = DEFAULT_IMG_H;
    }
    for (let faceAnnotation of visionData.faceAnnotations) {
        if (faceAnnotation.detectionConfidence >= MIN_CONFIDENCE) {
            let vertices = faceAnnotation.boundingPoly.vertices;
            let faceW = vertices[2].x - vertices[0].x;
            let faceH = vertices[2].y - vertices[0].y;
            let faceArea = faceW * faceH;
            let areaThreshold = MIN_FACE_AREA_PERCENT * (imgW * imgH);
            if (faceArea >= areaThreshold) {
                numFaces++;
            }
        }
    }
    return numFaces;
}

//Ensure text annotations meet thresholds before counting them
const getNumTexts = (visionData, imgW, imgH) => {
    let numTexts = 0;
    if (imgW == null) {
        imgW = DEFAULT_IMG_W;
    }
    if (imgH == null) {
        imgH = DEFAULT_IMG_H;
    }
    for (let textAnnotation of visionData.textAnnotations) {
        if (textAnnotation.confidence >= MIN_CONFIDENCE) {
            let vertices = textAnnotation.boundingPoly.vertices;
            let textW = vertices[2].x - vertices[0].x;
            let textH = vertices[2].y - vertices[0].y;
            let textArea = textW * textH;
            let areaThreshold = MIN_TEXT_AREA_PERCENT * (imgW * imgH);
            if (textArea >= areaThreshold) {
                numTexts++;
            }
        }
    }
    return numTexts;
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
            imgLocation: (img.meta.imgLocation)? img.meta.imgLocation: null,
            name: (img.meta.name)? img.meta.name: null,
            description: (img.meta.description)? img.meta.description: null,
            visionData: {
                hasFaces: (getNumFaces(visionData, img.meta.width, img.meta.height) > 0),
                hasText: (getNumTexts(visionData, img.meta.width, img.meta.height) > MIN_TEXTS),
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
        throw new Error(`Could not find a source type matching: ${source.type}`);
    }
    let imgs = await getImgs(source.typeConfig);
    //If images were already used as a wallpaper, remove them
    imgs = await removeUsedImgs(imgs, sourceDeviceDocs);
 
    let sourceDeviceAspectRatios = _.map(sourceDeviceDocs, (deviceDoc) => {
        return deviceDoc.data().targetAspectRatio.aspectRatio;
    });
    //Remove duplicate aspect ratios and sort
    sourceDeviceAspectRatios = _.sortedUniq(sourceDeviceAspectRatios);
 
    //Foreach device, find a suitable images, use addImgPromises map to avoid duplicate requests
    let visionClient = new vision.ImageAnnotatorClient();
    let addImgPromises = {};
    let getDeviceImgPromises = [];
    for (let devDoc of sourceDeviceDocs) {
        getDeviceImgPromises.push(((async (deviceDoc) => {
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
        }).bind(this, devDoc))());
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
        await deviceDoc.ref.set({
            sourceImages: {
                [sourceID]: newSourceImages
            }
        }, {
            merge: true
        })
    }
}
