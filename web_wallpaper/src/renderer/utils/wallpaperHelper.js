import ipcHelper from './ipcHelper'
import firebase from 'firebase'
import deviceHelper from './deviceHelper'
import _ from 'lodash'

const updateDeviceWallpaper = async (imgDoc) => {
    let userID = firebase.auth().currentUser.uid;
    let deviceID = await deviceHelper.getThisDeviceID(userID);
    let deviceRef = firebase
        .firestore()
        .collection('devices')
        .doc(deviceID);
    let deviceDoc = await deviceRef.get();
    let deviceData = deviceDoc.data();
    let wallpapers = deviceData.wallpapers;
    _.remove(wallpapers, {'id': imgDoc.id});
    let newWallpapers = [imgDoc.ref, ...wallpapers];
    await deviceRef.set({
        wallpapers: newWallpapers
    }, { merge: true });
}

export default {
    setWallpaper: async (imgDoc) => {
        let setPromise = ipcHelper.invoke('set-wallpaper', 'resp-set-wallpaper', { id: imgDoc.id, url: imgDoc.data().url });
        await updateDeviceWallpaper(imgDoc);
        return await setPromise;
    }
}