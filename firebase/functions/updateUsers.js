const _ = require('lodash');
const rp = require('request-promise');
const admin = require('firebase-admin');
const functions = require('firebase-functions');

const MAX_USER_PAGINATED = 500;

const invokeAddSourceImages = async (userDoc, sourceID) => {
    let userID = userDoc.id;
    let user = userDoc.data();
    //extract deviceID from reference
    let deviceIDs = _.map(user.devices, 'id');
    let excludedDevices = user.sources[sourceID].excludedDevices;
    if (excludedDevices != null) {
        //Remove excludedDevices
        deviceIDs = _.filter(deviceIDs, (deviceID) => {
            return excludedDevices.indexOf(deviceID) < 0;
        });
    }
    const options = {
        method: 'POST',
        url: `${functions.config().func_url}/addSourceImages`,
        headers: {
            secret: functions.config().secret,
            userID
        },
        data: {
            deviceIDs,
            sourceID
        },
        json: true,
        resolveWithFullResponse: true
    };
    return await rp(options);
}

const invokePickDeviceWallpaper = async (userID, deviceID) => {
    const options = {
        method: 'POST',
        url: `${functions.config().func_url}/pickDeviceWallpaper`,
        headers: {
            secret: functions.config().secret,
            userID
        },
        data: {
            deviceID
        },
        json: true,
        resolveWithFullResponse: true
    };
    return await rp(options);
}

const invokeBatchUpdateUsers = async (startAfterUserID) => {
    const options = {
        method: 'POST',
        url: `${functions.config().func_url}/batchUpdateUsers`,
        headers: {
            secret: functions.config().secret
        },
        data: {
            startAfterUserID
        },
        json: true,
        resolveWithFullResponse: true
    };
    return await rp(options);
}

//First update add images to all sources, then select the best wallpaper for each device
const updateUserWallpapers = async (userDoc) => {
    let user = userDoc.data();
    if (user.sources != null) {
        await Promise.all(_.map(Object.keys(user.sources), async (sourceID) => { await invokeAddSourceImages(userDoc, sourceID) }));
    }
    console.log("After sources");
    if (user.devices != null) {
        await Promise.all(_.map(user.devices, async (deviceRef) => { await invokePickDeviceWallpaper(userDoc.id, deviceRef.id) }));
    }
}

//Update 
exports.batchUpdateUsers = async (startAfterUserID, db) => {
    let userQuery = db.collection("users").orderBy(admin.firestore.FieldPath.documentId()).limit(MAX_USER_PAGINATED);
    if (startAfterUserID != null) {
        userQuery = userQuery.startAfter(startAfterUserID);
    }
    let collectionSnapshot = await userQuery.get();
    await Promise.all(_.map(collectionSnapshot.docs, (userDoc) => {
        return updateUserWallpapers(userDoc);
    }));
    //TODO: Determine if it is better to invoke another function or just leave the current function running
    //only request more if we reached the limit
    if (collectionSnapshot.docs.length == MAX_USER_PAGINATED) {
        await invokeBatchUpdateUsers(collectionSnapshot.docs[collectionSnapshot.docs.length - 1].id);
    }
}