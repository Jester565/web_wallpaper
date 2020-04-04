import rp from 'request-promise';
import Persistent from '../nativeCommons/persistent.js';
import Constants from '../constants.js';
import MachineID from 'node-machine-id';
import WallpaperSetter from '../nativeCommons/wallpaperSetter.js';
import moment from 'moment-timezone';

//hour of day to pull wallpaper
const PULL_HOUR = 5;
const EXTRA_SLEEP_DURATION = 10000;

const sleep = (duration) => {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
}

const getIDToken = async () => {
    let data = Persistent.getData();
    if (!data.refreshToken) {
        console.log("No refresh token, aborting");
        throw "No refresh token";
    }
    let authData = await rp({
        method: 'GET',
        url: `${Constants.API_URL}/exchangeRefreshToken`,
        qs: {
            refreshToken: data.refreshToken
        },
        json: true
    });
    await Persistent.setData({
        idToken: authData.id_token,
        refreshToken: authData.refresh_token
    });
    return authData.id_token;
}

const getWallpaper = async (idToken) => {
    let machineID = await MachineID.machineId();
    let image = await rp({
        method: 'GET',
        url: `${Constants.API_URL}/getWallpaper`,
        qs: {
            machineID
        },
        headers: {
            authorization: `Bearer ${idToken}`
        },
        json: true
    });
    return image;
}

const pullWallpaper = async () => {
    console.log("PULL WALLPAPER START");
    let idToken = await getIDToken();
    let imageData = await getWallpaper(idToken);
    await WallpaperSetter.setWallpaper(imageData.id, imageData.url);
    console.log("PULL WALLPAPER COMPLETE");
}

const getLastDtAtHour = (hour) => {
    let dt = moment().tz(Constants.TZ);
    if (dt.hour() < hour) {
        dt = dt.subtract(1, 'day');
    }
    dt = dt.set('hour', hour);
    return dt;
}

const getNextDtAtHour = (hour) => {
    let dt = moment().tz(Constants.TZ);
    if (dt.hour() >= hour) {
        dt = dt.add(1, 'day');
    }
    dt = dt.set('hour', hour);
    return dt;
}

const run = async () => {
    await Persistent.initData();
    let prevRefreshDT = getLastDtAtHour(PULL_HOUR);
    let persistentData = Persistent.getData();
    if (persistentData.wallpaperDate == null || persistentData.wallpaperDate < prevRefreshDT.valueOf()) {
        try {
            await pullWallpaper();
        } catch (err) {
            console.log("PULL WALLPAPER ERR: ", err);
        }
    }
    while (true) {
        let nextRefreshDT = getNextDtAtHour(PULL_HOUR);
        let now = moment().tz(Constants.TZ);
        let sleepDuration = (nextRefreshDT.valueOf() - now.valueOf()) + EXTRA_SLEEP_DURATION;
        await sleep(sleepDuration);
        await Persistent.initData();
        try {
            await pullWallpaper();
        } catch (err) {
            console.log("PULL WALLPAPER ERR: ", err);
        }
    }
}

run().then(() => {
    console.log("Run is an infinite loop, so idk how this would get called");
})
.catch((err) => {
    console.log("ERR: ", err);
});