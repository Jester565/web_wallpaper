import { app, BrowserWindow, screen, ipcMain } from 'electron'
import {machineId} from 'node-machine-id'
import os from 'os'
import Persistent from '../nativeCommons/persistent'
import WallpaperSetter from "../nativeCommons/wallpaperSetter"
import fs from 'fs'
import { promisify } from 'util'
import ws from 'windows-shortcuts'
import cp from 'child_process'
import path from 'path'
__dirname = path.resolve() + "\\src\\main";

const asyncWriteFile = promisify(fs.writeFile);

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

const init = async () => {
  let dataExists = await Persistent.initData();
  if (dataExists) {
    let persistentData = await Persistent.getData();
    if (persistentData.wallpaperID) {
      let wallpaperInUse = await WallpaperSetter.isUsingWallpaper();
      if (!wallpaperInUse) {
        await Persistent.setData({
          wallpaperID: null
        });
      }
      mainWindow.webContents.send('wallpaper-id' , persistentData.wallpaperID);
    }
    if (!persistentData.startUpScriptInstalled) {
      await installStartupScript();
    }
  } else {
    await installStartupScript();
  }
}

const installStartupScript = async () => {
  let parentDir = __dirname.substr(0, __dirname.lastIndexOf('\\'));
  let scriptPath = parentDir + "\\service\\index.js";
  //Create visual basic script to spawn nodejs background process that polls wallpapers
  let script = `CreateObject("Wscript.Shell").Run "node --experimental-modules ${scriptPath}", 0`;
  let startUpExPath = parentDir.substr(0, parentDir.lastIndexOf('\\')) + "\\startup\\webwall.vbs";
  await asyncWriteFile(startUpExPath, script);
  //Add shortcut to startup folder
  ws.create("%APPDATA%/Microsoft/Windows/Start Menu/Programs/WebWall.lnk", startUpExPath);
  //start background process now
  cp.spawn("wscript", [startUpExPath]);
  await Persistent.setData({
    startUpScriptInstalled: true
  });
}

app.on('ready', async () => {
  createWindow();
  await init();
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
ipcMain.on('set-auth', async (event, authData) => {
  await Persistent.setData({
    idToken: authData.idToken,
    refreshToken: authData.refreshToken
  });
  event.sender.send('set-auth-resp');
});

/*
ipcMain.on('get-auth', async (event) => {
  let data = Persistent.getData();
  event.sender.send('auth', {
    idToken: data.idToken,
    refreshToken: data.refreshToken
  });
});
*/

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
  let data = await Persistent.getData();
  let wallpaperID = data.wallpaperID;
  event.sender.send('resp-wallpaper-id', wallpaperID);
});

ipcMain.on('set-wallpaper', async (event, wallpaperData) => {
  try {
    await WallpaperSetter.setWallpaper(wallpaperData.id, wallpaperData.url);
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
