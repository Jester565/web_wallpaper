import { app, BrowserWindow, screen, ipcMain } from 'electron'
import {machineId, machineIdSync} from 'node-machine-id'
import os from 'os'

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
    frame: false
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

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
  console.log("Invoked resolution")
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
})

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
