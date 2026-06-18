import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { initializeDatabase } from './server/database'
import { registerAuthHandlers } from './server/apis/auth'
import { registerMenuHandlers } from './server/apis/menu'

import { autoUpdater } from "electron-updater"

let mainWindow: BrowserWindow | null = null

// -------------------- CREATE WINDOW --------------------
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// -------------------- AUTO UPDATER --------------------
function setupAutoUpdater() {
  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.on("update-available", () => {
    console.log("Update available")
  })

  autoUpdater.on("update-downloaded", () => {
    dialog.showMessageBox({
      type: "info",
      title: "Update Ready",
      message: "New version downloaded. Restart to apply update?",
      buttons: ["Restart", "Later"]
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })
}

// -------------------- APP READY --------------------
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC
  ipcMain.on('ping', () => console.log('pong'))

  // INIT APP LOGIC
  initializeDatabase()
  registerAuthHandlers()
  registerMenuHandlers()

  // CREATE WINDOW (ONLY ONCE)
  createWindow()

  // AUTO UPDATER
  setupAutoUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// -------------------- CLOSE APP --------------------
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})