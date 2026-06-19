import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { initializeDatabase } from './server/database'
import { registerAuthHandlers } from './server/apis/auth'
import { registerMenuHandlers } from './server/apis/menu'

import { autoUpdater } from "electron-updater"
import log from 'electron-log'

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

  console.log("is dev:", isDev)
  console.log("renderer:", process.env['ELECTRON_RENDERER_URL'])

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// -------------------- AUTO UPDATER --------------------
function setupAutoUpdater() {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  // logging
  autoUpdater.logger = log
  autoUpdater.logger.transports.file.level = "info"

  console.log("🚀 AutoUpdater initialized")

  function showPopup(title: string, message: string, type: any = "info") {
    if (!mainWindow) return

    dialog.showMessageBox(mainWindow, {
      type,
      title,
      message,
      buttons: ["OK"]
    })
  }

  autoUpdater.on("checking-for-update", () => {
    console.log("🔍 Checking for updates...")
    showPopup("Checking Updates", "Searching for latest version...")
  })

  autoUpdater.on("update-available", (info) => {
    console.log("🟢 Update available:", info.version)

    dialog.showMessageBox(mainWindow!, {
      type: "info",
      title: "Update Available",
      message: `New version ${info.version} is available. Downloading now...`,
      buttons: ["OK"]
    })
  })

  autoUpdater.on("update-not-available", () => {
    console.log("⚪ No update available")

    showPopup(
      "Up to Date",
      "You are already using the latest version."
    )
  })

  autoUpdater.on("error", (err) => {
    console.log("🔴 Update error:", err)

    showPopup(
      "Update Error",
      err?.message || String(err),
      "error"
    )
  })

  autoUpdater.on("download-progress", (progress) => {
    console.log(`⬇ Download: ${progress.percent.toFixed(2)}%`)
  })

  autoUpdater.on("update-downloaded", () => {
    console.log("✅ Update downloaded")

    dialog
      .showMessageBox(mainWindow!, {
        type: "info",
        title: "Update Ready",
        message: "Update downloaded. Restart to install?",
        buttons: ["Restart", "Later"]
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  setTimeout(() => {
    try {
      console.log("🚀 Running update check...")
      showPopup("Checking Updates", "Looking for updates...")
      autoUpdater.checkForUpdates()
    } catch (err) {
      console.log("❌ Update check failed:", err)

      showPopup(
        "Update Failed",
        String(err),
        "error"
      )
    }
  }, 3000)
}

// -------------------- APP READY --------------------
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  initializeDatabase()
  registerAuthHandlers()
  registerMenuHandlers()

  createWindow()
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