import wallpaper from 'wallpaper'
import Persistent from './persistent.js'
import request from 'request'
import fs from 'fs'
import PathHelper from './pathHelper.js'

const WALLPAPER_FILE = 'wallpaper.'

export default {
    isUsingWallpaper: async () => {
        let activeWallpaperPath = await wallpaper.get();
        let dataDir = PathHelper.getDataDir();
        let appWallpaperPath = `${dataDir}/${WALLPAPER_FILE}`;
        return (activeWallpaperPath.indexOf(appWallpaperPath) == 0);
    },
    setWallpaper: (wallpaperID, wallpaperUrl) => {
        return new Promise((resolve, reject) => {
            try {
                let baseUrl = wallpaperUrl;
                if (wallpaperUrl.indexOf('?') > 0) {
                    baseUrl = wallpaperUrl.substr(0, wallpaperUrl.indexOf('?'));
                }
                let fileType = baseUrl.substr(wallpaperUrl.lastIndexOf('.'));
                let dataDir = PathHelper.getDataDir();
                let wallpaperFile = `${dataDir}/${WALLPAPER_FILE}.${fileType}`
                let fileStream = fs.createWriteStream(wallpaperFile);
                request(wallpaperUrl).pipe(fileStream);
                fileStream.on('close', async () => {
                    await Persistent.setData({
                        wallpaperID,
                        wallpaperUrl,
                        wallpaperDate: Date.now()
                    });
                    await wallpaper.set(wallpaperFile);
                    resolve();
                });
                fileStream.on('error', async (err) => {
                    reject(err);
                });
            } catch (err) {
                console.log("SET WALLPAPER ERR: ", err);
            }
        });
    }
}