import { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, clipboard, shell, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import * as fs from 'fs'
import * as path from 'path'

// Store current window info for context
let currentWindowInfo: any = null

let floatingOverlayWindow: BrowserWindow | null = null

// Create floating overlay window
function createFloatingOverlay(): void {
  if (floatingOverlayWindow) {
    return
  }

  try {
    // Load saved position
    const settings = store.get('settings', {}) as AppSettings
    const overlayPosition = settings.overlayPosition || { x: 100, y: 100 }

    floatingOverlayWindow = new BrowserWindow({
      width: 320,
      height: 200,
      x: overlayPosition.x,
      y: overlayPosition.y,
      show: false,
      frame: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      closable: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      transparent: true,
      movable: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.cjs'),
        sandbox: false,
        contextIsolation: true,
        enableRemoteModule: false,
        nodeIntegration: false
      }
    })

    // Load the floating overlay page
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      floatingOverlayWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/floating-overlay`)
    } else {
      floatingOverlayWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: 'floating-overlay'
      })
    }

    floatingOverlayWindow.on('closed', () => {
      floatingOverlayWindow = null
      logToFile('Floating overlay window closed', 'DEBUG')
    })

    // Auto-hide when losing focus
    floatingOverlayWindow.on('blur', () => {
      setTimeout(() => {
        if (floatingOverlayWindow && floatingOverlayWindow.isVisible() && !floatingOverlayWindow.isFocused()) {
          floatingOverlayWindow.hide()
          logToFile('Floating overlay auto-hidden after losing focus', 'INFO')
        }
      }, 300)
    })

    logToFile('Floating overlay window created successfully', 'INFO')
  } catch (error) {
    logToFile(`Failed to create floating overlay: ${error}`, 'ERROR')
  }
}

// Show floating overlay
function showFloatingOverlay(): void {
  if (!floatingOverlayWindow) {
    createFloatingOverlay()
  }

  if (!floatingOverlayWindow) {
    logToFile('Failed to create floating overlay window', 'ERROR')
    return
  }

  if (floatingOverlayWindow.isVisible()) {
    floatingOverlayWindow.hide()
    logToFile('Floating overlay hidden', 'INFO')
    return
  }

  try {
    // Use current position (don't change it)
    const currentPosition = floatingOverlayWindow.getPosition()
    
    floatingOverlayWindow.show()
    floatingOverlayWindow.focus()
    
    // Get clipboard text and send to overlay
    const clipboardText = clipboard.readText()
    floatingOverlayWindow.webContents.send('clipboard-text', clipboardText)
    
    logToFile(`Floating overlay shown at position (${currentPosition[0]}, ${currentPosition[1]})`, 'INFO')
    
  } catch (error) {
    logToFile(`Failed to show floating overlay: ${error}`, 'ERROR')
  }
}

// Initialize electron store
const store = new Store()

// Error logging setup
const LOG_DIR = path.join(app.getPath('userData'), 'logs')
const LOG_FILE = path.join(LOG_DIR, 'app.log')
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log')

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

// Enhanced logging function
function logToFile(message: string, level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' = 'INFO'): void {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [${level}] ${message}\n`
  
  try {
    // Log to console
    console.log(`[${level}] ${message}`)
    
    // Log to file
    const logFile = level === 'ERROR' ? ERROR_LOG_FILE : LOG_FILE
    fs.appendFileSync(logFile, logMessage)
  } catch (error) {
    console.error('Failed to write to log file:', error)
  }
}

// Enhanced global error handling with detailed crash reporting
process.on('uncaughtException', (error) => {
  const errorMessage = `UNCAUGHT EXCEPTION - Application will terminate`
  const errorDetails = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    pid: process.pid,
    platform: process.platform,
    nodeVersion: process.version,
    electronVersion: process.versions.electron
  }
  
  logToFile(errorMessage, 'FATAL')
  logToFile(`Error Details: ${JSON.stringify(errorDetails, null, 2)}`, 'FATAL')
  console.error(errorMessage, error)
  console.error('Full error details:', errorDetails)
  
  // Try to show error dialog if possible
  try {
    const { dialog } = require('electron')
    if (app && !app.isReady()) {
      app.whenReady().then(() => {
        dialog.showErrorBox('Critical Error', `Application crashed: ${error.message}`)
      })
    } else {
      dialog.showErrorBox('Critical Error', `Application crashed: ${error.message}`)
    }
  } catch (dialogError) {
    logToFile(`Failed to show error dialog: ${dialogError}`, 'ERROR')
  }
  
  // Graceful shutdown with cleanup
  setTimeout(() => {
    logToFile('Forcing application exit after uncaught exception', 'FATAL')
    process.exit(1)
  }, 2000)
})

process.on('unhandledRejection', (reason, promise) => {
  const errorMessage = `UNHANDLED PROMISE REJECTION - Potential memory leak detected`
  const rejectionDetails = {
    reason: reason instanceof Error ? {
      message: reason.message,
      stack: reason.stack,
      name: reason.name
    } : String(reason),
    promise: promise.toString(),
    timestamp: new Date().toISOString(),
    pid: process.pid,
    memoryUsage: process.memoryUsage()
  }
  
  logToFile(errorMessage, 'ERROR')
  logToFile(`Rejection Details: ${JSON.stringify(rejectionDetails, null, 2)}`, 'ERROR')
  console.error(errorMessage)
  console.error('Full rejection details:', rejectionDetails)
  
  // Don't exit on unhandled rejection, but log it thoroughly
})

// Additional process monitoring
process.on('warning', (warning) => {
  const warningDetails = {
    name: warning.name,
    message: warning.message,
    stack: warning.stack,
    timestamp: new Date().toISOString()
  }
  
  logToFile(`Process Warning: ${JSON.stringify(warningDetails, null, 2)}`, 'WARN')
  console.warn('Process warning:', warningDetails)
})

process.on('exit', (code) => {
  logToFile(`Process exiting with code: ${code}`, 'INFO')
})

process.on('SIGTERM', () => {
  logToFile('Received SIGTERM, shutting down gracefully', 'INFO')
  app.quit()
})

process.on('SIGINT', () => {
  logToFile('Received SIGINT, shutting down gracefully', 'INFO')
  app.quit()
})

// Enhanced error wrapper for async functions
function safeAsync<T extends any[], R>(fn: (...args: T) => Promise<R>) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args)
    } catch (error) {
      const errorMessage = `Error in ${fn.name}: ${error instanceof Error ? error.message : String(error)}`
      logToFile(errorMessage, 'ERROR')
      console.error(errorMessage, error)
      return null
    }
  }
}

// Enhanced error wrapper for sync functions
function safeSync<T extends any[], R>(fn: (...args: T) => R) {
  return (...args: T): R | null => {
    try {
      return fn(...args)
    } catch (error) {
      const errorMessage = `Error in ${fn.name}: ${error instanceof Error ? error.message : String(error)}`
      logToFile(errorMessage, 'ERROR')
      console.error(errorMessage, error)
      return null
    }
  }
}

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let currentHotkey: string | null = null
let isQuitting = false

// Store interface
interface Prompt {
  id: string
  title: string
  content: string
  categoryId: string
  tags: string[]
  isFavorite: boolean
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

interface Category {
  id: string
  name: string
  color: string
  icon: string
  createdAt: Date
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  autoStart: boolean
  showInTray: boolean
  globalHotkey: string
  onboardingCompleted?: boolean
  clipboardReplacement?: boolean
  windowSize: { width: number; height: number }
  windowPosition: { x: number; y: number }
  overlayPosition?: { x: number; y: number }
  aiSettings?: {
    provider: 'openai' | 'gemini' | 'ollama'
    openaiApiKey?: string
    geminiApiKey?: string
    model?: string
    maxTokens?: number
    temperature?: number
    ollamaUrl?: string
    ollamaModel?: string
    useLocalForSensitive?: boolean
    sensitiveContentDetection?: boolean
  }
}



// Enhanced active window detection
async function getActiveWindowInfo(): Promise<{ title: string; processName?: string } | null> {
  try {
    const { spawn } = require('child_process')
    
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        // Windows'ta PowerShell kullanarak aktif pencere bilgisi al
        const ps = spawn('powershell', [
          '-Command',
          'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SystemInformation]::ComputerName; $w = Add-Type -MemberDefinition \'[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow(); [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);\' -Name "Win32" -PassThru; $handle = $w::GetForegroundWindow(); $title = New-Object System.Text.StringBuilder(256); $w::GetWindowText($handle, $title, $title.Capacity); $title.ToString()'
        ], { windowsHide: true })

        let output = ''
        ps.stdout.on('data', (data) => {
          output += data.toString()
        })

        ps.on('close', (code) => {
          if (code === 0 && output.trim()) {
            const lines = output.trim().split('\n')
            const title = lines[lines.length - 1]?.trim()
            if (title && title !== '') {
              resolve({ title, processName: 'Unknown' })
            } else {
              resolve({ title: 'Desktop', processName: 'explorer.exe' })
            }
          } else {
            resolve({ title: 'Desktop', processName: 'explorer.exe' })
          }
        })

        ps.on('error', (error) => {
          logToFile(`PowerShell error: ${error.message}`, 'DEBUG')
          resolve({ title: 'Desktop', processName: 'explorer.exe' })
        })

        // Timeout after 2 seconds
        setTimeout(() => {
          ps.kill()
          resolve({ title: 'Desktop', processName: 'explorer.exe' })
        }, 2000)
      } else {
        // Non-Windows platforms - fallback
        resolve({ title: 'Desktop', processName: 'unknown' })
      }
    })
  } catch (error) {
    logToFile(`Failed to get active window info: ${error}`, 'DEBUG')
    return { title: 'Desktop', processName: 'unknown' }
  }
}





function createWindow(): void {
  logToFile('Creating main window...', 'DEBUG')
  
  try {
    const defaultSettings: AppSettings = {
      theme: 'system',
      autoStart: false,
      showInTray: true,
      globalHotkey: 'Ctrl+Shift+Q',
      onboardingCompleted: false,
      clipboardReplacement: false,
      windowSize: { width: 420, height: 580 },
      windowPosition: { x: 100, y: 100 },
      overlayPosition: { x: 100, y: 100 }
    }
    
    const settings = store.get('settings', defaultSettings) as AppSettings
    
    // Ensure windowSize and windowPosition exist
    if (!settings.windowSize) {
      settings.windowSize = defaultSettings.windowSize
    }
    if (!settings.windowPosition) {
      settings.windowPosition = defaultSettings.windowPosition
    }
    
    // Ensure reasonable window dimensions for overlay-like experience
    if (settings.windowSize.width > 500) {
      settings.windowSize.width = 420
      logToFile('Window width was too large, constraining to 420px', 'DEBUG')
    }
    if (settings.windowSize.height > 700) {
      settings.windowSize.height = 580
      logToFile('Window height was too large, constraining to 580px', 'DEBUG')
    }

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: settings.windowSize.width,
    height: settings.windowSize.height,
    x: settings.windowPosition.x,
    y: settings.windowPosition.y,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    alwaysOnTop: false, // Don't always stay on top initially
    skipTaskbar: false, // Show in taskbar for better UX
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: false,
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  })

    logToFile('Main window created successfully', 'INFO')

    mainWindow.on('ready-to-show', () => {
      logToFile('Main window ready to show', 'DEBUG')
      
      // Check if this is the first time the app is being launched
      const settings = store.get('settings', {}) as AppSettings
      const isFirstLaunch = !settings.onboardingCompleted
      
      if (isFirstLaunch) {
        // Show window on first launch, positioned above system tray
        if (mainWindow && tray) {
          // Position window above tray like other tray interactions
          const trayBounds = tray.getBounds()
          const windowBounds = mainWindow.getBounds()
          const screen = require('electron').screen
          const primaryDisplay = screen.getPrimaryDisplay()
          const screenBounds = primaryDisplay.workAreaSize
          
          // Calculate position directly above tray
          let x = trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
          let y = trayBounds.y - windowBounds.height - 5
          
          // Ensure window stays on screen
          x = Math.max(5, Math.min(x, screenBounds.width - windowBounds.width - 5))
          y = Math.max(5, y)
          
          mainWindow.setPosition(Math.round(x), Math.round(y))
          mainWindow.show()
          mainWindow.focus()
          if (is.dev) {
            mainWindow.webContents.openDevTools()
          }
          logToFile('First launch - showing main window above system tray', 'INFO')
        } else if (mainWindow) {
          // Fallback if tray not ready yet
          mainWindow.show()
          mainWindow.focus()
          logToFile('First launch - showing main window (tray not ready)', 'INFO')
        }
      } else {
        // Keep hidden in system tray on subsequent launches
        logToFile('Subsequent launch - keeping window hidden in system tray', 'INFO')
      }
    })

    // Add comprehensive window event handlers
    mainWindow.on('crashed', (event) => {
      const errorMessage = 'Main window renderer process crashed'
      logToFile(errorMessage, 'ERROR')
      console.error(errorMessage, event)
      
      // Try to reload the window
      try {
        if (mainWindow && !mainWindow.isDestroyed()) {
          logToFile('Attempting to reload crashed main window', 'INFO')
          mainWindow.reload()
        }
      } catch (reloadError) {
        logToFile(`Failed to reload crashed window: ${reloadError}`, 'ERROR')
      }
    })
    
    mainWindow.on('unresponsive', () => {
      const errorMessage = 'Main window became unresponsive'
      logToFile(errorMessage, 'WARN')
      console.warn(errorMessage)
    })
    
    mainWindow.on('responsive', () => {
      logToFile('Main window became responsive again', 'INFO')
    })
    
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      const errorMessage = `Main window failed to load: ${errorDescription} (${errorCode}) - URL: ${validatedURL}`
      logToFile(errorMessage, 'ERROR')
      console.error(errorMessage)
    })
    
    mainWindow.webContents.on('render-process-gone', (event, details) => {
      const errorMessage = `Main window render process gone: ${details.reason} (exit code: ${details.exitCode})`
      logToFile(errorMessage, 'ERROR')
      console.error(errorMessage, details)
    })
    
    mainWindow.webContents.on('did-fail-provisional-load', (event, errorCode, errorDescription, validatedURL) => {
      const errorMessage = `Main window provisional load failed: ${errorDescription} (${errorCode}) - URL: ${validatedURL}`
      logToFile(errorMessage, 'ERROR')
      console.error(errorMessage)
    })

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      if (mainWindow) {
        mainWindow.hide()
      }
    }
  })

    mainWindow.on('closed', () => {
      logToFile('Main window closed', 'DEBUG')
      mainWindow = null
    })
    
    // Error handling for main window
    mainWindow.webContents.on('crashed', (event, killed) => {
      logToFile(`Main window crashed. Killed: ${killed}`, 'ERROR')
      if (mainWindow) {
        mainWindow.reload()
      }
    })
    
    mainWindow.webContents.on('unresponsive', () => {
      logToFile('Main window became unresponsive', 'WARN')
    })
    
    mainWindow.webContents.on('responsive', () => {
      logToFile('Main window became responsive again', 'INFO')
    })
    
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      logToFile(`Main window failed to load: ${errorCode} - ${errorDescription}`, 'ERROR')
    })
    
    logToFile('Main window created successfully', 'INFO')

  // Save window state
  mainWindow.on('resize', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      const settings = store.get('settings', {}) as AppSettings
      settings.windowSize = { width: bounds.width, height: bounds.height }
      store.set('settings', settings)
    }
  })

  mainWindow.on('move', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      const settings = store.get('settings', {}) as AppSettings
      settings.windowPosition = { x: bounds.x, y: bounds.y }
      store.set('settings', settings)
    }
  })

    // Load the app
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      logToFile(`Loading dev URL: ${process.env['ELECTRON_RENDERER_URL']}`, 'DEBUG')
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      const htmlPath = join(__dirname, '../renderer/index.html')
      logToFile(`Loading HTML file: ${htmlPath}`, 'DEBUG')
      mainWindow.loadFile(htmlPath)
    }
    
    logToFile('Main window initialization completed', 'INFO')
  } catch (error) {
    const errorMessage = `Failed to create main window: ${error instanceof Error ? error.message : String(error)}`
    logToFile(errorMessage, 'ERROR')
    console.error(errorMessage, error)
    
    // Try to show error dialog
    try {
      const { dialog } = require('electron')
      dialog.showErrorBox('Window Creation Error', `Failed to create main window:\n\n${errorMessage}`)
    } catch (dialogError) {
      logToFile(`Failed to show window creation error dialog: ${dialogError}`, 'ERROR')
    }
  }
}

function createTray(): void {
  logToFile('Creating system tray...', 'DEBUG')
  
  try {
    const iconPath = join(__dirname, '../../resources/icon.png')
    logToFile(`Loading tray icon from: ${iconPath}`, 'DEBUG')
    let icon = nativeImage.createFromPath(iconPath)
  
    // Fallback to empty icon if file not found
    if (icon.isEmpty()) {
      logToFile('Tray icon file not found, using empty icon', 'WARN')
      icon = nativeImage.createEmpty()
    } else {
      logToFile('Tray icon loaded successfully', 'DEBUG')
    }
  
    // Safe resize with error handling
    let resizedIcon = icon
    try {
      if (!icon.isEmpty()) {
        resizedIcon = icon.resize({ width: 16, height: 16 })
        logToFile('Tray icon resized successfully', 'DEBUG')
      }
    } catch (error) {
      logToFile(`Failed to resize tray icon: ${error}`, 'WARN')
      resizedIcon = nativeImage.createEmpty()
    }
  
    tray = new Tray(resizedIcon)
    logToFile('System tray created successfully', 'INFO')
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Overlay',
      click: () => {
        showFloatingOverlay()
      }
    },
    {
      label: 'Hide Window',
      click: () => {
        if (mainWindow) {
          mainWindow.hide()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        if (mainWindow) {
          // Position window precisely on tray surface
          const trayBounds = tray.getBounds()
          const windowBounds = mainWindow.getBounds()
          const screen = require('electron').screen
          const primaryDisplay = screen.getPrimaryDisplay()
          const screenBounds = primaryDisplay.workAreaSize
          
          // Calculate position directly above tray (touching the tray)
          let x = trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
          let y = trayBounds.y - windowBounds.height - 5  // Just 5px gap from tray
          
          // Ensure window stays on screen
          x = Math.max(5, Math.min(x, screenBounds.width - windowBounds.width - 5))
          y = Math.max(5, y)
          
          mainWindow.setPosition(Math.round(x), Math.round(y))
          mainWindow.show()
          mainWindow.focus()
          mainWindow.webContents.send('navigate', 'settings')
        }
      }
    },
    {
      label: 'About',
      click: () => {
        if (mainWindow) {
          // Position window precisely on tray surface
          const trayBounds = tray.getBounds()
          const windowBounds = mainWindow.getBounds()
          const screen = require('electron').screen
          const primaryDisplay = screen.getPrimaryDisplay()
          const screenBounds = primaryDisplay.workAreaSize
          
          // Calculate position directly above tray (touching the tray)
          let x = trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
          let y = trayBounds.y - windowBounds.height - 5  // Just 5px gap from tray
          
          // Ensure window stays on screen
          x = Math.max(5, Math.min(x, screenBounds.width - windowBounds.width - 5))
          y = Math.max(5, y)
          
          mainWindow.setPosition(Math.round(x), Math.round(y))
          mainWindow.show()
          mainWindow.focus()
          mainWindow.webContents.send('navigate', 'about')
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])
  
  tray.setToolTip('QuillWise - AI Writing Assistant')
  tray.setContextMenu(contextMenu)
  
    tray.on('click', () => {
      logToFile('Tray icon clicked', 'DEBUG')
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide()
          logToFile('Main window hidden via tray click', 'DEBUG')
        } else {
          // Position window precisely on tray surface
          const trayBounds = tray.getBounds()
          const windowBounds = mainWindow.getBounds()
          const screen = require('electron').screen
          const primaryDisplay = screen.getPrimaryDisplay()
          const screenBounds = primaryDisplay.workAreaSize
          
          // Calculate position directly above tray (touching the tray)
          let x = trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
          let y = trayBounds.y - windowBounds.height - 5  // Just 5px gap from tray
          
          // Ensure window stays on screen
          x = Math.max(5, Math.min(x, screenBounds.width - windowBounds.width - 5))
          y = Math.max(5, y)
          
          mainWindow.setPosition(Math.round(x), Math.round(y))
          mainWindow.show()
          mainWindow.focus()
          logToFile('Main window shown above tray', 'DEBUG')
        }
      }
    })
  } catch (error) {
    const errorMessage = `Failed to create system tray: ${error instanceof Error ? error.message : String(error)}`
    logToFile(errorMessage, 'ERROR')
    console.error(errorMessage, error)
  }
}

function registerGlobalShortcuts(): void {
  logToFile('Registering global shortcuts...', 'DEBUG')
  
  try {
    // Unregister all existing shortcuts
    globalShortcut.unregisterAll()
    logToFile('All existing shortcuts unregistered', 'DEBUG')
    
    // Get settings for hotkey
    const settings = store.get('settings', {}) as AppSettings
    const hotkey = settings.globalHotkey || 'Ctrl+Shift+Q'
    
    // Register hotkey for floating overlay
    const success = globalShortcut.register(hotkey, () => {
      logToFile('Global hotkey triggered: showing/hiding floating overlay', 'INFO')
      showFloatingOverlay()
    })
    
    if (success) {
      currentHotkey = hotkey
      logToFile(`Successfully registered hotkey: ${hotkey}`, 'INFO')
    } else {
      logToFile(`Failed to register hotkey: ${hotkey}`, 'ERROR')
    }
    
    logToFile('Global shortcuts registration completed', 'INFO')
  } catch (error) {
    const errorMessage = `Failed to register global shortcuts: ${error instanceof Error ? error.message : String(error)}`
    logToFile(errorMessage, 'ERROR')
    console.error(errorMessage, error)
  }
}

function updateGlobalHotkey(newHotkey: string): void {
  try {
    // Unregister current hotkey if exists
    if (currentHotkey) {
      globalShortcut.unregister(currentHotkey)
      logToFile(`Unregistered old hotkey: ${currentHotkey}`, 'DEBUG')
    }
    
    // Register new hotkey for floating overlay
    const success = globalShortcut.register(newHotkey, () => {
      logToFile(`Global hotkey triggered: ${newHotkey}`, 'INFO')
      showFloatingOverlay()
    })
    
    if (success) {
      currentHotkey = newHotkey
      logToFile(`Successfully registered new hotkey: ${newHotkey}`, 'INFO')
    } else {
      logToFile(`Failed to register new hotkey: ${newHotkey}`, 'ERROR')
    }
  } catch (error) {
    logToFile(`Failed to update global hotkey: ${error}`, 'ERROR')
  }
}







// IPC Handlers
ipcMain.handle('copy-to-clipboard', async (_, text: string) => {
  clipboard.writeText(text)
  return true
})

ipcMain.handle('get-clipboard-text', async () => {
  try {
    return clipboard.readText()
  } catch (error) {
    console.error('Failed to read clipboard:', error)
    return ''
  }
})

ipcMain.handle('get-settings', async () => {
  try {
    const defaultSettings: AppSettings = {
      theme: 'system',
      autoStart: false,
      showInTray: true,
      globalHotkey: 'Ctrl+Shift+Q',
      onboardingCompleted: false,
      clipboardReplacement: false,
      windowSize: { width: 380, height: 700 },
      windowPosition: { x: 100, y: 100 },
      overlayPosition: { x: 100, y: 100 },
      aiSettings: {
        provider: 'gemini',
        openaiApiKey: '',
        geminiApiKey: '',
        model: 'gemini-1.5-flash',
        maxTokens: 1000,
        temperature: 0.7,
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2',
        useLocalForSensitive: false,
        sensitiveContentDetection: true
      }
    }
    
    const storedSettings = (store.get('settings') || {}) as Partial<AppSettings>
    const settings = { ...defaultSettings, ...storedSettings }
    
    // Ensure aiSettings sub-object is also merged properly
    if (storedSettings.aiSettings) {
      settings.aiSettings = { ...defaultSettings.aiSettings, ...storedSettings.aiSettings }
    }
    
    return settings
  } catch (error) {
    logToFile(`Failed to get settings: ${error instanceof Error ? error.message : String(error)}`, 'ERROR')
    return {}
  }
})

ipcMain.handle('save-settings', async (_, settings: AppSettings) => {
  try {
    store.set('settings', settings)
    logToFile('Settings saved successfully', 'INFO')

    // Update hotkey
    if (settings.globalHotkey) {
      updateGlobalHotkey(settings.globalHotkey)
    }

    return { success: true }
  } catch (error) {
    const errorMessage = `Failed to save settings: ${error instanceof Error ? error.message : String(error)}`
    logToFile(errorMessage, 'ERROR')
    console.error(errorMessage, error)
    return { success: false, error: errorMessage }
  }
})

ipcMain.handle('hide-window', async () => {
  if (mainWindow) {
    mainWindow.hide()
  }
  return true
})

ipcMain.handle('show-window', async () => {
  if (mainWindow && tray) {
    // Position window above tray
    const trayBounds = tray.getBounds()
    const windowBounds = mainWindow.getBounds()
    const screen = require('electron').screen
    const primaryDisplay = screen.getPrimaryDisplay()
    const screenBounds = primaryDisplay.workAreaSize
    
    // Calculate position above tray with some padding
    let x = trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
    let y = trayBounds.y - windowBounds.height - 10
    
    // Keep window on screen
    x = Math.max(0, Math.min(x, screenBounds.width - windowBounds.width))
    y = Math.max(0, y)
    
    mainWindow.setPosition(Math.round(x), Math.round(y))
    mainWindow.show()
    mainWindow.focus()
  }
  return true
})

ipcMain.handle('open-external', async (_, url: string) => {
  shell.openExternal(url)
  return true
})

ipcMain.handle('get-prompts', async () => {
  return store.get('prompts', [])
})

ipcMain.handle('save-prompts', async (_, prompts: Prompt[]) => {
  store.set('prompts', prompts)
  return true
})

ipcMain.handle('get-categories', async () => {
  return store.get('categories', [])
})

ipcMain.handle('save-categories', async (_, categories: Category[]) => {
  store.set('categories', categories)
  return true
})




















ipcMain.handle('send-text-to-active-window', async (_, text: string) => {
  // Copy text to clipboard for manual pasting
  try {
    clipboard.writeText(text)
    logToFile(`Text copied to clipboard: "${text.substring(0, 50)}..."`, 'INFO')
    return true
  } catch (error) {
    logToFile(`Failed to copy text to clipboard: ${error}`, 'ERROR')
    return false
  }
})

let lastDragPosition = { x: 0, y: 0 }

ipcMain.handle('start-drag', async (_, startX: number, startY: number) => {
  try {
    if (floatingOverlayWindow) {
      const currentBounds = floatingOverlayWindow.getBounds()
      lastDragPosition = { x: currentBounds.x, y: currentBounds.y }
      logToFile(`Drag started at (${startX}, ${startY})`, 'DEBUG')
      return true
    }
    return false
  } catch (error) {
    logToFile(`Failed to start drag: ${error}`, 'ERROR')
    return false
  }
})

ipcMain.handle('move-window', async (_, deltaX: number, deltaY: number) => {
  try {
    if (floatingOverlayWindow) {
      const newX = lastDragPosition.x + deltaX
      const newY = lastDragPosition.y + deltaY
      
      floatingOverlayWindow.setPosition(Math.round(newX), Math.round(newY))
      
      // Save new position to settings
      const settings = store.get('settings', {}) as AppSettings
      settings.overlayPosition = { x: newX, y: newY }
      store.set('settings', settings)
      
      logToFile(`Floating overlay moved to (${newX}, ${newY})`, 'DEBUG')
      return true
    }
    return false
  } catch (error) {
    logToFile(`Failed to move floating overlay: ${error}`, 'ERROR')
    return false
  }
})

// App event handlers
// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  logToFile('Another instance is already running. Quitting this instance...', 'INFO')
  app.quit()
} else {
  // Handle second instance attempt
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    logToFile('Second instance detected. Focusing existing window...', 'INFO')
    
    // If we have a window, restore and focus it
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
      mainWindow.focus()
      
      // Also bring the window to the foreground on Windows
      if (process.platform === 'win32') {
        mainWindow.setAlwaysOnTop(true)
        mainWindow.setAlwaysOnTop(false)
      }
      
      logToFile('Existing window focused successfully', 'INFO')
    } else {
      logToFile('Main window not available, creating new window...', 'WARN')
      createWindow()
    }
  })

app.whenReady().then(() => {
  logToFile('Electron app is ready, starting initialization...', 'INFO')
  
  try {
    // Set app user model id for windows
    logToFile('Setting app user model ID...', 'DEBUG')
    electronApp.setAppUserModelId('com.electron.ai-prompt-creator')
    logToFile('App user model ID set successfully', 'DEBUG')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    app.on('browser-window-created', (_, window) => {
      logToFile('New browser window created, setting up shortcuts...', 'DEBUG')
      optimizer.watchWindowShortcuts(window)
    })

    logToFile('Creating application windows and components...', 'DEBUG')
    createWindow()
    createTray()
    registerGlobalShortcuts()
    
    logToFile('Application initialization completed successfully', 'INFO')

    app.on('activate', function () {
      logToFile('App activated', 'DEBUG')
      if (BrowserWindow.getAllWindows().length === 0) {
        logToFile('No windows found, creating new window...', 'DEBUG')
        createWindow()
      }
    })
  } catch (error) {
    const errorMessage = `Failed during app initialization: ${error instanceof Error ? error.message : String(error)}`
    logToFile(errorMessage, 'ERROR')
    console.error(errorMessage, error)
  }
})

app.on('window-all-closed', () => {
  logToFile('All windows closed', 'DEBUG')
  if (process.platform !== 'darwin') {
    logToFile('Quitting application (non-macOS platform)', 'INFO')
    app.quit()
  }
})

app.on('before-quit', () => {
  logToFile('Application is about to quit', 'INFO')
  isQuitting = true
})

app.on('will-quit', () => {
  logToFile('Application will quit, cleaning up...', 'INFO')
  
  try {
    // Unregister all shortcuts
    logToFile('Unregistering all global shortcuts...', 'DEBUG')
    globalShortcut.unregisterAll()
    logToFile('Cleanup completed successfully', 'INFO')
  } catch (error) {
    const errorMessage = `Failed during cleanup: ${error instanceof Error ? error.message : String(error)}`
    logToFile(errorMessage, 'ERROR')
    console.error(errorMessage, error)
  }
})

} // End of single instance lock check

// Security: Prevent new