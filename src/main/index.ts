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

  const isDev = !app.isPackaged

  console.log(__dirname)
  console.log("is dev", isDev)
  console.log(process.env['ELECTRON_RENDERER_URL'])

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// -------------------- AUTO UPDATER --------------------
function setupAutoUpdater() {
  // ---------------- CONFIG ----------------
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  // ---------------- LOGGING (VERY IMPORTANT) ----------------
  autoUpdater.logger = log
  autoUpdater.logger.transports.file.level = "info"

  console.log("🚀 AutoUpdater initialized")

  // ---------------- EVENTS ----------------
  autoUpdater.on("checking-for-update", () => {
    console.log("🔍 Checking for updates...")
  })

  autoUpdater.on("update-available", (info) => {
    console.log("🟢 Update available:", info.version)
  })

  autoUpdater.on("update-not-available", () => {
    console.log("⚪ No update available")
  })

  autoUpdater.on("error", (err) => {
    console.log("🔴 Updater error:", err)
  })

  autoUpdater.on("download-progress", (progress) => {
    console.log(`⬇ Download: ${progress.percent.toFixed(2)}%`)
  })

  autoUpdater.on("update-downloaded", () => {
    console.log("✅ Update downloaded")

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

  // ---------------- SAFE CHECK ----------------
  setTimeout(() => {
    try {
      console.log("🚀 Running update check...")
      autoUpdater.checkForUpdates()
    } catch (err) {
      console.log("❌ Update check failed:", err)
    }
  }, 3000)
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

  // CREATE WINDOW
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