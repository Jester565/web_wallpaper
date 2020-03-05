const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { pickDeviceWallpaper } = require('./pickDeviceWallpaper');
const { addSourceImages } = require('./addSourceImages');
const { batchUpdateUsers } = require('./updateUsers');
const { getReqUserID } = require('./utils');
admin.initializeApp();

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
        //Delete all user's source images
        let imageDeletionPromises = [];
        //TODO: Remove device images
        await Promise.all(imageDeletionPromises);

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
                    _.remove(source.excludedDevices, {
                        id: deviceID
                    });
                }
            }
            t.set(userRef, userData);
        });
    } catch (err) {
        console.error(err);
    }
});

exports.addSourceImages = functions.https.onRequest(async (req, res) => {
    try {
        let userID = getReqUserID(req);

        const db = admin.firestore();
        let deviceIDs = req.body.deviceIDs;
        let sourceID = req.body.sourceID;
        
        await addSourceImages(userID, sourceID, deviceIDs, db);
    } catch (err) {
        console.error(err);
    }
});

exports.pickDeviceWallpaper = functions.https.onRequest(async (req, res) => {
    try {
        let userID = getReqUserID(req);
        const db = admin.firestore();
        let deviceID = req.body.deviceID;

        await pickDeviceWallpaper(userID, deviceID, db);
    } catch (err) {
        console.error(err);
    }
});

//execute everyday at 4 am
exports.updateAllUsers = functions.pubsub.schedule('0 4 * * *')
.timeZone('US/Pacific') // Users can choose timezone - default is America/Los_Angeles
.onRun(() => {
    const db = admin.firestore();
    await batchUpdateUsers(null, db);
});

exports.batchUpdateUsers = functions.https.onRequest(async (req, res) => {
    if (req.headers.secret != functions.config().secret) {
        console.error("Invalid secret!");
        return;
    }
    const db = admin.firestore();
    await batchUpdateUsers(req.data.startAfterUserID, db);
});