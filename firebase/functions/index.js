const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { pickDeviceWallpaper } = require('./pickDeviceWallpaper');
const { addSourceImages } = require('./addSourceImages');
const { batchUpdateUsers } = require('./updateUsers');
const { getReqUserID } = require('./utils');
const rp = require('request-promise');
admin.initializeApp();

const cors = require('cors')({
    origin: true,
});

/*
    Adds doc to users collection on user creation
*/
exports.addUserDoc = functions.auth.user().onCreate(async (authData) => {
    try {
        console.log(`User created: ${JSON.stringify(authData, null, 4)}`);
        
        const db = admin.firestore();
        //Use displayName for username if exists
        let userName = (authData.displayName)? authData.displayName: authData.email.substr(0, authData.email.indexOf('@'));
        console.log(`Username: ${userName}`);

        let userData = {
            name: userName,
            devices: [],
            sources: []
        };
        
        await db.collection('users').doc(authData.uid).set(userData);
        console.log(`Created user: ${authData.uid}`);
    } catch (err) {
        console.error(err);
    }
});

/*
    Checks that the document referenced contains a userID value that matches the passed in userID before deletion
*/
let deleteUserResource = async(docRef, userID) => {
    let doc = await docRef.get();
    let ownerID = doc.data().userID;
    if (ownerID === userID) {
        await docRef.delete();
    } else {
        console.warn(`User ${userID} attempted to delete ${docRef.path} that belonged to ${ownerID}`);
    }
}

/*
    May fail if dangling image reference!
    Expects all user's images to be listed in user.sources.deviceImages.images
    Expects all user's devices to be listed in user.devices
*/
exports.removeUserDoc = functions.auth.user().onDelete(async (user) => {
    try {
        const db = admin.firestore();
        let userRef = db.collection('users').doc(user.uid);
        let userDoc = await userRef.get();
        let userData = userDoc.data();

        //Delete all user's devices
        let deviceDeletionPromises = [];
        for (let deviceRef of userData.devices) {
            deviceDeletionPromises.push(deleteUserResource(deviceRef, user.uid));
        }
        await Promise.all(deviceDeletionPromises);
        //Delete user
        await userRef.delete();
        console.log(`Deleted user: ${user.uid}`);
    } catch (err) {
        console.error(err);
    }
});

/*
    New devices are added to the user's devices array
*/
exports.deviceCreated = functions.firestore.document('devices/{deviceID}').onCreate(async (device) => {
    try {
        const db = admin.firestore();
        let userID = device.data().userID;

        await db.collection('users').doc(userID).update({
            devices: admin.firestore.FieldValue.arrayUnion(device.ref)
        });
    } catch (err) {
        console.error(err);
    }
});

/*
    Deleted devices are removed from the user's devices array
*/
exports.deviceDeleted = functions.firestore.document('devices/{deviceID}').onDelete(async (device, ctx) => {
    try {
        const db = admin.firestore();
        let userID = device.data().userID;
        let deviceID = ctx.params.deviceID;
        let userRef = db.collection('users').doc(userID);
        console.log(`Removing device (${deviceID}) from user (${userID})`);

        await db.runTransaction(async (t) => {
            let user = await t.get(userRef)
            let userData = user.data();
            //remove device with matching id
            _.remove(userData.devices, {
                id: deviceID
            });
            for (let sourceID in userData.sources) {
                let source = userData.sources[sourceID];
                
                if (source.excludedDevices) {
                    //No longer exclude deleted device
                    delete source.excludedDevices[deviceID];
                }
            }
            t.set(userRef, userData);
        });
    } catch (err) {
        console.log(err);
    }
});

const removeImageFromDevice = async (deviceRef, imageID) => {
    let deviceDoc = await deviceRef.get();
    let newWallpapers = null;
    if (deviceDoc.data().wallpapers != null) {
        let removedElms = _.remove(deviceDoc.data().wallpapers, {
            id: imageID
        });
        if (removedElms.length > 0) {
            newWallpapers = deviceDoc.data().wallpapers;
        }
    }
    let newSourceImages = null;
    if (deviceDoc.data().sourceImages) {
        for (let sourceID in deviceDoc.data().sourceImages) {
            let images = deviceDoc.data().sourceImages[sourceID];
            let removedElms = _.remove(images, {
                id: imageID
            });
            if (removedElms.length > 0) {
                if (newSourceImages == null) {
                    newSourceImages = {};
                }
                newSourceImages[sourceID] = images;
            }
        }
    }
    if (newWallpapers || newSourceImages) {
        let newDevice = {};
        if (newWallpapers) {
            newDevice['wallpapers'] = newWallpapers;
        }
        if (newSourceImages) {
            newDevice['sourceImages'] = newSourceImages;
        }
        await deviceRef.set(newDevice, { merge: true });
    }
}

//Remove image from devices belonging to owner
//WARNING: Possible dangling ref if another user (TODO: Change userIDs to map or make images unique to user)
exports.onImageDeleted = functions.firestore.document('images/{imageID}').onDelete(async (image, ctx) => {
    try {
        const db = admin.firestore();
        let userID = image.data().userID;
        let imageID = ctx.params.imageID;
        let userRef = db.collection('users').doc(userID);
        let userDoc = await userRef.get();
        let devicePromises = _.map(userDoc.devices, async (deviceRef) => {
            return (await removeImageFromDevice(deviceRef, imageID));
        });
        await devicePromises;
    } catch (err) {
        console.log(err);
    }
});

//Delete all images older than x days
const NUM_DAYS_EXPIRATION = 30;
exports.removeExpiredImages = functions.pubsub.schedule('0 4 * * *')
.timeZone('US/Pacific')
.onRun(async () => {
    const db = admin.firestore();
    let expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - NUM_DAYS_EXPIRATION);
    let expirationEpoch = expirationDate.getTime();
    let queryRes = db.collection('images').where('setTime', '<', expirationEpoch);
    let deletePromises = _.map(queryRes.docs, async (docSnap) => {
        return (await docSnap.ref.delete());
    });
    await deletePromises;
});

exports.addSourceImages = functions.https.onRequest(async (req, res) => {
    try {
        const db = admin.firestore();
        let userID = await getReqUserID(req, admin);

        let deviceIDs = req.body.deviceIDs;
        let sourceID = req.body.sourceID;
        
        await addSourceImages(userID, sourceID, deviceIDs, db);
        res.status(200).send("Success");
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

exports.pickDeviceWallpaper = functions.https.onRequest(async (req, res) => {
    try {
        const db = admin.firestore();
        let userID = await getReqUserID(req, admin);
        let deviceID = req.body.deviceID;

        await pickDeviceWallpaper(userID, deviceID, db);
        res.status(200).send("Success");
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

//execute everyday at 4 am
exports.updateAllUsers = functions.pubsub.schedule('0 4 * * *')
.timeZone('US/Pacific') // Users can choose timezone - default is America/Los_Angeles
.onRun(async () => {
    const db = admin.firestore();
    await batchUpdateUsers(null, db);
});

exports.batchUpdateUsers = functions.https.onRequest(async (req, res) => {
    try {
        if (req.headers.secret != functions.config().env.secret) {
            console.error("Invalid secret!");
            res.status(403).send("Invalid secret!");
            return;
        }
        const db = admin.firestore();
        await batchUpdateUsers(req.body.startAfterUserID, db);
        res.status(200).send("Success");
    } catch (err) {
        console.log(err);
        res.status(500).send(JSON.stringify(err));
    }
});

exports.getWallpaper = functions.https.onRequest(async (req, res) => {
    try {
        const db = admin.firestore();
        let userID = await getReqUserID(req, admin);
        let deviceID = userID + req.query.machineID;
        console.log("DEVICE ID: ", deviceID);
        let deviceDoc = await db.collection('devices').doc(deviceID).get();
        if (deviceDoc.data().userID != userID) {
            res.status(403).send("This device does not belong to you");
            console.log("Unauth for device");
            return;
        }
        if (!deviceDoc.data().wallpapers || deviceDoc.data().wallpapers.length == 0) {
            res.status(400).send("No wallpaper yet");
            console.log("No wallpaper");
            return;
        }
        let imageRef = deviceDoc.data().wallpapers[0];
        let imageDoc = await imageRef.get();
        res.status(200).send({
            id: imageDoc.id,
            ...imageDoc.data()
        });
    } catch (err) {
        console.log(err);
        res.status(500).send(JSON.stringify(err));
    }
})

exports.exchangeRefreshToken = functions.https.onRequest(async (req, res) => {
    try {
        let refreshToken = req.query.refreshToken;
        let apiKey = functions.config().env.api_key;
        let tokenResp = await rp({
            method: 'POST',
            url: 'https://securetoken.googleapis.com/v1/token',
            qs: {
                'key': apiKey,
            },
            form: {
                'grant_type': 'refresh_token',
                'refresh_token': refreshToken
            },
            resolveWithFullResponse: true
        });
        let authData = JSON.parse(tokenResp.body);
        console.log("TOKEN RESP: ", JSON.stringify(authData, null, 4));
        res.status(200).send(authData);
    } catch (err) {
        console.log(err);
        res.status(500).send(JSON.stringify(err));
    }
});

exports.addGoogleAuth = functions.https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
        try {
            let userID = await getReqUserID(req, admin);
            let code = req.body.code;
            let tokenResp = await rp({
                method: 'POST',
                url: 'https://oauth2.googleapis.com/token',
                form: {
                    'grant_type': 'authorization_code',
                    'client_id': functions.config().env.client_id,
                    'client_secret': functions.config().env.client_secret,
                    'code': code,
                    'redirect_uri': functions.config().env.redirect_uri
                },
                resolveWithFullResponse: true
            });
            let authData = JSON.parse(tokenResp.body);
            let googleAuth = {
                accessToken: authData.access_token,
                refreshToken: authData.refresh_token,
                expiresAt: authData.expires_in + Date.now()
            };
            await admin.firestore().collection('users').doc(userID)
            .set({
                googleAuth
            }, { merge: true });
            res.send(200);
        } catch (err) {
            console.log(err);
            res.status(500).send(JSON.stringify(err));
        }
    });
});