const functions = require('firebase-functions');
const admin = require('firebase-admin');
const _ = require('lodash');
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
        for (let source of userData.sources) {
            for (let deviceID in source.deviceImages) {
                for (let imageRef of deviceImages[deviceID].images) {
                    imageDeletionPromises.push(deleteUserResource(imageRef, user.uid));
                }
            }
        }
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
            for (let source of userData.sources) {
                //remove device from deviceImages
                _.remove(source.deviceImages, (devImages) => {
                    return (devImages.device.id === deviceID);
                });
                //No longer exclude deleted device
                _.remove(source.excludedDevices, {
                    id: deviceID
                });
            }
            t.set(userRef, userData);
        });
    } catch (err) {
        console.error(err);
    }
});
