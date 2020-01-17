const functions = require('firebase-functions');
const admin = require('firebase-admin');
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