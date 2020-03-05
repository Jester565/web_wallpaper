//Determine the likelihood of the image being selected
const getSourceScore = (source) => {
    return source.rating;
}

exports.pickDeviceWallpaper = async (userID, deviceID, db) => {
    let deviceRef = db.collection('devices').doc(deviceID);
    let deviceDoc = await deviceRef.get();
    let device = deviceDoc.data();
    let userDoc = await db.collection('users').doc(userID).get();
    let userData = userDoc.data();
    let scoreArr = [];
    let curScore = 0;
    for (let sourceID in device.sourceImages) {
        let imgArr = device.sourceImages[sourceID];
        if (imgArr != null && imgArr.length > 0) {
            let source = userData.sources[sourceID];
            if (!source.excludedDevices[deviceID]) {
                let imgRef = imgArr[0];
                let score = getSourceScore(source);
                scoreArr.push({
                    score,
                    imgRef
                });
                curScore += score;
            }
        }
    }
    //Iterating over scores again so reset
    let maxScore = curScore;
    curScore = 0;
    //Get image for source falling at the score
    let wallpaperScore = Math.trunc(Math.random() * maxScore);
    let wallpaperImgRef = null;
    for (let entry of scoreArr) {
        if (wallpaperScore >= curScore && wallpaperScore < curScore + entry.score) {
            wallpaperImgRef = entry.imgRef;
            break;
        }
        curScore += entry.score;
    }
    let newWallpapers = [wallpaperImgRef, ...device.wallpapers];
    await deviceRef.set({
        wallpapers: newWallpapers
    });
}