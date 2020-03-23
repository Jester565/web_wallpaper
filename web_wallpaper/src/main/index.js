import { app, BrowserWindow, screen, ipcMain } from 'electron'
import {machineId, machineIdSync} from 'node-machine-id'
import os from 'os'
import fs from 'fs'
import { promisify } from 'util'
import request from 'request'
import { resolve } from 'dns'
import wallpaper from 'wallpaper'

const asyncWriteFile = promisify(fs.writeFile);
const asyncReadFile = promisify(fs.readFile);
const asyncFileExists = promisify(fs.exists);

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width, height,
    useContentSize: true,
    frame: false,
    webPreferences: {
      webSecurity: false
    }
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const DATA_FILE = 'data.json';
const WALLPAPER_FILE = 'wallpaper.'

let persistentData = {};

const isUsingWallpaper = async () => {
  let activeWallpaperPath = await wallpaper.get();
  let appWallpaperPath = `${__dirname}/${WALLPAPER_FILE}`;
  return (activeWallpaperPath.indexOf(appWallpaperPath) == 0);
}

const initData = async () => {
  let dataPath = `${__dirname}/${DATA_FILE}`;
  if (await asyncFileExists(dataPath)) {
    persistentData = JSON.parse(await asyncReadFile(dataPath));
    if (persistentData.wallpaperID) {
      let wallpaperInUse = await isUsingWallpaper();
      if (!wallpaperInUse) {
        persistentData.wallpaperID = null;
      }
      mainWindow.webContents.send('wallpaper-id' , persistentData.wallpaperID);
    }
  }
}

const setWallpaper = (wallpaperID, wallpaperUrl) => {
  return new Promise((resolve, reject) => {
    try {
      let baseUrl = wallpaperUrl;
      if (wallpaperUrl.indexOf('?') > 0) {
        baseUrl = wallpaperUrl.substr(0, wallpaperUrl.indexOf('?'));
      }
      let fileType = baseUrl.substr(wallpaperUrl.lastIndexOf('.'));
      let wallpaperFile = `${__dirname}/${WALLPAPER_FILE}.${fileType}`
      let fileStream = fs.createWriteStream(wallpaperFile);
      request(wallpaperUrl).pipe(fileStream);
      fileStream.on('close', async () => {
        persistentData.wallpaperID = wallpaperID;
        persistentData.wallpaperUrl = wallpaperUrl;
        await wallpaper.set(wallpaperFile);
        await asyncWriteFile(`${__dirname}/${DATA_FILE}`, JSON.stringify(persistentData));
        mainWindow.webContents.send('wallpaper-id' , wallpaperID);
        resolve();
      });
      fileStream.on('error', async (err) => {
        persistentData.wallpaperID = null;
        persistentData.wallpaperUrl = null;
        await asyncWriteFile(`${__dirname}/${DATA_FILE}`, JSON.stringify(persistentData));
        mainWindow.webContents.send('wallpaper-id' , null);
        reject(err);
      });
    } catch (err) {
      console.log("SET WALLPAPER ERR: ", err);
    }
  });
}

app.on('ready', () => {
  createWindow();
  initData();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

//Handlers for invocations from the renderer

//get the resolution of the display
ipcMain.on('get-resolution', async (event) => {
  let resolution = screen.getPrimaryDisplay().workAreaSize
  event.sender.send('resolution', resolution)
})

//get a unique, persistent id for the device
ipcMain.on('get-machine-id', async (event) => {
  let machineID = await machineId()
  event.sender.send('machine-id', machineID)
})

ipcMain.on('get-hostname', async (event) => {
  let hostname = os.hostname()
  event.sender.send('hostname', hostname)
});

ipcMain.on('get-wallpaper-id', async (event) => {
  let wallpaperID = persistentData.wallpaperID;
  event.sender.send('resp-wallpaper-id', wallpaperID);
});

ipcMain.on('set-wallpaper', async (event, wallpaperData) => {
  console.log("SETTING WALLPAPER");
  try {
    await setWallpaper(wallpaperData.id, wallpaperData.url);
    event.sender.send('resp-set-wallpaper', wallpaperData.id);
  } catch (err) {
    event.sender.send('resp-set-wallpaper', null);
  }
});

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
