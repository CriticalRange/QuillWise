import { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, clipboard, shell, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import * as fs from 'fs'
import * as path from 'path'

// Store current window info for context
let currentWindowInfo: any = null

let contextMenuWindow: BrowserWindow | null = null
let floatingButtonsWindow: BrowserWindow | null = null
let enhancementOptionsWindow: BrowserWindow | null = null

// Store the original window info for paste operation
let originalWindowInfo: { handle: any; text: string } | null = null





// Create context menu window
function createContextMenu(): void {
  if (contextMenuWindow) {
    return
  }

  try {
    contextMenuWindow = new BrowserWindow({
      width: 240,
      height: 120,
      show: false,
      frame: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      closable: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      transparent: true,
      movable: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.cjs'),
        sandbox: false,
        contextIsolation: true,
        enableRemoteModule: false,
        nodeIntegration: false
      }
    })

    // Load the context menu page
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      contextMenuWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/context-menu`)
    } else {
      contextMenuWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: 'context-menu'
      })
    }

    contextMenuWindow.on('closed', () => {
      contextMenuWindow = null
      logToFile('Context menu window closed', 'DEBUG')
    })

    // Auto-hide when losing focus
    contextMenuWindow.on('blur', () => {
      setTimeout(() => {
        if (contextMenuWindow && contextMenuWindow.isVisible() && !contextMenuWindow.isFocused()) {
          contextMenuWindow.hide()
          logToFile('Context menu auto-hidden after losing focus', 'INFO')
        }
      }, 200)
    })

    logToFile('Context menu window created successfully', 'INFO')
  } catch (error) {
    logToFile(`Failed to create context menu: ${error}`, 'ERROR')
  }
}

// Show context menu with smart positioning (DISABLED - using smart toggle instead)
async function showContextMenu(): void {
  if (!contextMenuWindow) {
    createContextMenu()
  }

  if (!contextMenuWindow) {
    logToFile('Failed to create context menu window', 'ERROR')
    return
  }

  if (contextMenuWindow.isVisible()) {
    contextMenuWindow.hide()
    logToFile('Context menu hidden', 'INFO')
    return
  }

  try {
    // Get selected text
    const selectedText = clipboard.readText()
    if (!selectedText || selectedText.trim().length === 0) {
      logToFile('No text selected, context menu not shown', 'INFO')
      return
    }

    // Get cursor position (this is a simplified approach)
    const { screen } = require('electron')
    const point = screen.getCursorScreenPoint()
    const display = screen.getDisplayNearestPoint(point)
    
    // Context menu dimensions
    const menuWidth = 240
    const menuHeight = 120
    const margin = 20
    
    // Calculate smart position
    let x = point.x - menuWidth / 2
    let y = point.y + 30 // Default: below cursor
    
    // Adjust for screen boundaries
    if (x < display.bounds.x + margin) {
      x = display.bounds.x + margin
    } else if (x + menuWidth > display.bounds.x + display.bounds.width - margin) {
      x = display.bounds.x + display.bounds.width - menuWidth - margin
    }
    
    // Check if menu fits below cursor
    if (y + menuHeight > display.bounds.y + display.bounds.height - margin) {
      // Place above cursor
      y = point.y - menuHeight - 10
    }
    
    // Ensure menu is within screen bounds vertically
    if (y < display.bounds.y + margin) {
      y = display.bounds.y + margin
    }
    
    contextMenuWindow.setPosition(Math.round(x), Math.round(y))
    contextMenuWindow.show()
    contextMenuWindow.focus()
    
    // Send selected text to context menu
    contextMenuWindow.webContents.send('selected-text', selectedText)
    
    logToFile(`Context menu shown at position (${x}, ${y}) for text: "${selectedText.substring(0, 50)}..."`, 'INFO')
    
  } catch (error) {
    logToFile(`Failed to show context menu: ${error}`, 'ERROR')
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



// Enhanced active window detection with position and size
async function getActiveWindowInfo(): Promise<{ title: string; processName?: string; x: number; y: number; width: number; height: number } | null> {
  try {
    const { spawn } = require('child_process')
    
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        // Windows'ta PowerShell kullanarak aktif pencere bilgisi al (pozisyon ve boyut dahil)
        const ps = spawn('powershell', [
          '-Command',
          `Add-Type -AssemblyName System.Windows.Forms;
           Add-Type -TypeDefinition '
             using System;
             using System.Runtime.InteropServices;
             public struct RECT {
               public int Left;
               public int Top;
               public int Right;
               public int Bottom;
             }
             public class Win32 {
               [DllImport("user32.dll")]
               public static extern IntPtr GetForegroundWindow();
               [DllImport("user32.dll")]
               public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
               [DllImport("user32.dll")]
               public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
             }
           ';
           $handle = [Win32]::GetForegroundWindow();
           $title = New-Object System.Text.StringBuilder(256);
           [Win32]::GetWindowText($handle, $title, $title.Capacity);
           $rect = New-Object RECT;
           [Win32]::GetWindowRect($handle, [ref]$rect);
           $result = @{
             title = $title.ToString();
             x = $rect.Left;
             y = $rect.Top;
             width = $rect.Right - $rect.Left;
             height = $rect.Bottom - $rect.Top
           };
           $result | ConvertTo-Json`
        ], { windowsHide: true })

        let output = ''
        ps.stdout.on('data', (data) => {
          output += data.toString()
        })

        ps.stderr.on('data', (data) => {
          logToFile(`PowerShell stderr: ${data.toString()}`, 'DEBUG')
        })

        ps.on('close', (code) => {
          if (code === 0 && output.trim()) {
            try {
              // Clean the output - remove any non-JSON content
              const cleanOutput = output.trim()
              logToFile(`Raw PowerShell output: ${cleanOutput}`, 'DEBUG')
              
              // Find JSON content between { and }
              const jsonStart = cleanOutput.indexOf('{')
              const jsonEnd = cleanOutput.lastIndexOf('}') + 1
              
              if (jsonStart !== -1 && jsonEnd > jsonStart) {
                const jsonString = cleanOutput.substring(jsonStart, jsonEnd)
                logToFile(`Extracted JSON: ${jsonString}`, 'DEBUG')
                
                const result = JSON.parse(jsonString)
                if (result.title && result.title !== '') {
                  resolve({
                    title: result.title,
                    processName: 'Unknown',
                    x: result.x || 0,
                    y: result.y || 0,
                    width: result.width || 800,
                    height: result.height || 600
                  })
                } else {
                  resolve({ title: 'Desktop', processName: 'explorer.exe', x: 0, y: 0, width: 1920, height: 1080 })
                }
              } else {
                logToFile('No valid JSON found in PowerShell output', 'DEBUG')
                resolve({ title: 'Desktop', processName: 'explorer.exe', x: 0, y: 0, width: 1920, height: 1080 })
              }
            } catch (parseError) {
              logToFile(`Failed to parse window info: ${parseError}, Output: ${output}`, 'DEBUG')
              resolve({ title: 'Desktop', processName: 'explorer.exe', x: 0, y: 0, width: 1920, height: 1080 })
            }
          } else {
            logToFile(`PowerShell exited with code ${code}, output: ${output}`, 'DEBUG')
            resolve({ title: 'Desktop', processName: 'explorer.exe', x: 0, y: 0, width: 1920, height: 1080 })
          }
        })

        ps.on('error', (error) => {
          logToFile(`PowerShell error: ${error.message}`, 'DEBUG')
          resolve({ title: 'Desktop', processName: 'explorer.exe', x: 0, y: 0, width: 1920, height: 1080 })
        })

        // Timeout after 3 seconds
        setTimeout(() => {
          ps.kill()
          resolve({ title: 'Desktop', processName: 'explorer.exe', x: 0, y: 0, width: 1920, height: 1080 })
        }, 3000)
      } else {
        // Non-Windows platforms - fallback
        resolve({ title: 'Desktop', processName: 'unknown', x: 0, y: 0, width: 1920, height: 1080 })
      }
    })
  } catch (error) {
    logToFile(`Failed to get active window info: ${error}`, 'DEBUG')
    return { title: 'Desktop', processName: 'unknown', x: 0, y: 0, width: 1920, height: 1080 }
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
    
    logToFile('Simple text enhancement system ready', 'INFO')
    
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
    
    // Register unified hotkey (Ctrl+Shift+Q) for quick text enhancement
    const success = globalShortcut.register(hotkey, async () => {
      logToFile('Global hotkey triggered: quick text enhancement', 'INFO')
      await quickEnhanceText()
    })
    
    if (success) {
      currentHotkey = hotkey
      logToFile(`Successfully registered unified hotkey: ${hotkey}`, 'INFO')
    } else {
      logToFile(`Failed to register unified hotkey: ${hotkey}`, 'ERROR')
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
    
    // Register new hotkey for quick text enhancement
    const success = globalShortcut.register(newHotkey, async () => {
      logToFile(`Global hotkey triggered: ${newHotkey}`, 'INFO')
      await quickEnhanceText()
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

async function createFloatingButtonsWindow(): Promise<void> {
  if (floatingButtonsWindow) {
    floatingButtonsWindow.close()
    floatingButtonsWindow = null
  }

  floatingButtonsWindow = new BrowserWindow({
    width: 300,
    height: 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload/index.cjs'),
      webSecurity: false
    }
  })

  // Debug: Log preload path
  const preloadPath = path.join(__dirname, 'preload/index.cjs')
  logToFile(`Floating buttons preload path: ${preloadPath}`, 'INFO')
  
  // Check if preload file exists
  const fs = require('fs')
  if (!fs.existsSync(preloadPath)) {
    logToFile(`Preload file not found at: ${preloadPath}`, 'ERROR')
  } else {
    logToFile(`Preload file found at: ${preloadPath}`, 'INFO')
  }

  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    await floatingButtonsWindow.loadURL('http://localhost:5173/floating-buttons.html')
  } else {
    await floatingButtonsWindow.loadFile(path.join(__dirname, '../dist/floating-buttons.html'))
  }

  floatingButtonsWindow.on('closed', () => {
    floatingButtonsWindow = null
  })
}

// Get focused control text using Windows API
async function getFocusedControlText(): Promise<{ success: boolean; text?: string; error?: string }> {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve({ success: false, error: 'Windows API only supported on Windows' })
      return
    }

    const { spawn } = require('child_process')
    
    logToFile('=== GETTING FOCUSED CONTROL TEXT ===', 'DEBUG')
    
    const psScript = `
      try {
        # Load Windows API
        Add-Type -TypeDefinition '
          using System;
          using System.Runtime.InteropServices;
          using System.Text;
          
          public class Win32API {
            [DllImport("user32.dll")]
            public static extern IntPtr GetForegroundWindow();
            
            [DllImport("user32.dll")]
            public static extern IntPtr GetFocus();
            
            [DllImport("user32.dll")]
            public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int processId);
            
            [DllImport("kernel32.dll")]
            public static extern int GetCurrentThreadId();
            
            [DllImport("user32.dll")]
            public static extern bool AttachThreadInput(int idAttach, int idAttachTo, bool fAttach);
            
            [DllImport("user32.dll", CharSet = CharSet.Unicode)]
            public static extern int SendMessageW(IntPtr hWnd, int Msg, int wParam, IntPtr lParam);
            

            
            public const int WM_GETTEXT = 0x000D;
            public const int WM_GETTEXTLENGTH = 0x000E;
          }
        '
        
        Write-Host "Windows API loaded successfully"
        
        # Get foreground window
        $foregroundWindow = [Win32API]::GetForegroundWindow()
        if ($foregroundWindow -eq [IntPtr]::Zero) {
          throw "No foreground window found"
        }
        
        Write-Host "Foreground window found: $foregroundWindow"
        
        # Get window thread and process ID  
        $processId = 0
        $activeThreadId = [Win32API]::GetWindowThreadProcessId($foregroundWindow, [ref]$processId)
        $currentThreadId = [Win32API]::GetCurrentThreadId()
        
        Write-Host "Active thread ID: $activeThreadId, Current thread ID: $currentThreadId"
        
        # Attach to thread if different
        $attached = $false
        if ($activeThreadId -ne $currentThreadId) {
          $attachResult = [Win32API]::AttachThreadInput($activeThreadId, $currentThreadId, $true)
          $attached = $attachResult
          Write-Host "Thread attachment result: $attachResult"
        }
        
        try {
          # Get focused control
          $focusedControl = [Win32API]::GetFocus()
          if ($focusedControl -eq [IntPtr]::Zero) {
            Write-Host "No focused control found"
            @{ 
              success = $false
              error = "No focused control found"
            } | ConvertTo-Json -Compress
            return
          }
          
          Write-Host "Focused control: $focusedControl"
          
          # Check if focused control is the same as foreground window (window title case)
          if ($focusedControl -eq $foregroundWindow) {
            Write-Host "Focused control is the same as foreground window - this would read window title"
            @{ 
              success = $false
              error = "Focused control is window itself, not a text control"
            } | ConvertTo-Json -Compress
            return
          }
          
          # Get text length first
          $textLength = [Win32API]::SendMessageW($focusedControl, [Win32API]::WM_GETTEXTLENGTH, 0, [IntPtr]::Zero)
          Write-Host "Text length: $textLength"
          
          if ($textLength -gt 0) {
            # Allocate buffer for text
            $buffer = [System.Runtime.InteropServices.Marshal]::AllocHGlobal(($textLength + 1) * 2)
            try {
              # Get the text
              $result = [Win32API]::SendMessageW($focusedControl, [Win32API]::WM_GETTEXT, $textLength + 1, $buffer)
              $text = [System.Runtime.InteropServices.Marshal]::PtrToStringUni($buffer)
              
              Write-Host "Retrieved text length: $result"
              
              $resultObj = @{
                success = $true
                text = if ($text) { $text } else { "" }
                textLength = $result
                windowHandle = $foregroundWindow.ToString()
                controlHandle = $focusedControl.ToString()
                processId = $processId
              }
              
              $resultObj | ConvertTo-Json -Compress
              
            } finally {
              [System.Runtime.InteropServices.Marshal]::FreeHGlobal($buffer)
            }
          } else {
            Write-Host "No text found in focused control"
            @{ 
              success = $false
              error = "No text found in focused control"
            } | ConvertTo-Json -Compress
          }
          
        } finally {
          # Detach thread if we attached
          if ($attached) {
            [Win32API]::AttachThreadInput($activeThreadId, $currentThreadId, $false)
            Write-Host "Thread detached"
          }
        }
        
      } catch {
        Write-Host "Error: $($_.Exception.Message)"
        @{ 
          success = $false
          error = $_.Exception.Message
        } | ConvertTo-Json -Compress
      }
    `
    
    const ps = spawn('powershell', ['-Command', psScript], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    let output = ''
    let errorOutput = ''
    
    ps.stdout.on('data', (data) => {
      const dataStr = data.toString()
      output += dataStr
      logToFile(`Focused Control stdout: ${dataStr}`, 'DEBUG')
    })
    
    ps.stderr.on('data', (data) => {
      const errorStr = data.toString()
      errorOutput += errorStr
      logToFile(`Focused Control stderr: ${errorStr}`, 'DEBUG')
    })
    
    ps.on('close', (code) => {
      logToFile(`Focused Control process closed with code: ${code}`, 'DEBUG')
      
      try {
        if (output.trim()) {
          const lines = output.split('\n')
          let jsonLine = ''
          
          for (const line of lines) {
            const trimmedLine = line.trim()
            if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
              jsonLine = trimmedLine
              break
            }
          }
          
          if (jsonLine) {
            const result = JSON.parse(jsonLine)
            logToFile(`Focused control result: ${JSON.stringify(result)}`, 'INFO')
            resolve(result)
          } else {
            logToFile('No valid JSON found in focused control output', 'DEBUG')
            resolve({ success: false, error: 'No valid JSON output' })
          }
        } else {
          logToFile(`Focused control no output. Error: ${errorOutput}`, 'DEBUG')
          resolve({ success: false, error: 'No output from Windows API script' })
        }
      } catch (parseError) {
        logToFile(`Failed to parse focused control output: ${parseError}`, 'DEBUG')
        resolve({ success: false, error: 'Failed to parse Windows API output' })
      }
    })
    
    ps.on('error', (error) => {
      logToFile(`Focused Control process error: ${error.message}`, 'DEBUG')
      resolve({ success: false, error: error.message })
    })
    
    setTimeout(() => {
      ps.kill()
      logToFile('Focused Control process timed out', 'DEBUG')
      resolve({ success: false, error: 'Windows API timeout' })
    }, 5000)
  })
}

// Simple text enhancement with automatic text detection
async function quickEnhanceText(): Promise<void> {
  try {
    logToFile('Starting quick text enhancement...', 'INFO')
    
    // Get settings first
    const settings = store.get('settings', {}) as AppSettings
    
    // Check if DEV MODE is enabled - if so, just log and return
    if (settings.devMode) {
      logToFile('DEV MODE: Quick enhancement blocked', 'INFO')
      
      // Only get text from focused control, do not fallback to clipboard
      const focusedResult = await getFocusedControlText()
      let selectedText = ''
      
      if (focusedResult.success && focusedResult.text && focusedResult.text.trim().length > 0) {
        selectedText = focusedResult.text.trim()
        logToFile(`Selected text: ${selectedText}`, 'INFO')
        showNotification('QuillWise', `DEV MODE: Text logged to console (${selectedText.length} chars)`)
      } else {
        logToFile('DEV MODE: No text found', 'INFO')
        showNotification('QuillWise', 'DEV MODE: No text found')
      }
      
      return
    }
    
    // First try to get text from focused control and store window info
    const focusedResult = await getFocusedControlText()
    let selectedText = ''
    
    if (focusedResult.success && focusedResult.text && focusedResult.text.trim().length > 0) {
      selectedText = focusedResult.text.trim()
      logToFile(`Got text from focused control: "${selectedText.substring(0, 50)}..."`, 'INFO')
      
      // Store the original window info for later paste operation
      originalWindowInfo = {
        handle: focusedResult.windowHandle,
        text: selectedText
      }
      logToFile(`Stored original window info: handle=${focusedResult.windowHandle}`, 'DEBUG')
      
      // Auto-select all text in the focused control for replacement (if enabled in settings)
      if (settings.autoSelectText) {
        await selectAllTextInFocusedControl()
      }
      
    } else {
      // Check if focus was successful but no text (textLength: 0)
      if (focusedResult.success && focusedResult.textLength === 0) {
        logToFile('Focused control found but no text (textLength: 0)', 'INFO')
        selectedText = ''
      } else {
        // Fallback: try clipboard
        selectedText = clipboard.readText()
        logToFile(`Fallback to clipboard text: "${selectedText.substring(0, 50)}..."`, 'INFO')
      }
      originalWindowInfo = null
    }
    
    if (!selectedText || selectedText.trim().length === 0) {
      logToFile('No text found for enhancement, showing selection prompt', 'INFO')
      // Show popup with "select text" message instead of notification
      await showEnhancementOptions('', { message: ['Select a text to enhance'] })
      return
    }

    if (selectedText.length > 5000) {
      logToFile('Text too long for enhancement', 'INFO')
      showNotification('QuillWise', 'Text is too long. Please select shorter text (max 5000 characters).')
      return
    }

    // Get AI settings
    const aiSettings = settings.aiSettings
    
    if (!aiSettings) {
      showNotification('QuillWise', 'AI settings not configured. Please open settings.')
      return
    }
    
    // Validate AI provider configuration
    if (aiSettings.provider === 'openai' && !aiSettings.openaiApiKey) {
      showNotification('QuillWise', 'OpenAI API key not configured. Please check settings.')
      return
    }
    if (aiSettings.provider === 'gemini' && !aiSettings.geminiApiKey) {
      showNotification('QuillWise', 'Gemini API key not configured. Please check settings.')
      return
    }
    
    showNotification('QuillWise', 'Enhancing text...')
    
    // Enhance text using AI
    const enhancedText = await enhanceTextWithAI(selectedText, aiSettings)
    
    logToFile(`Text enhanced successfully: ${selectedText.length} -> ${enhancedText.length} chars`, 'INFO')
    logToFile(`Original: "${selectedText.substring(0, 100)}..."`, 'INFO')
    logToFile(`Enhanced: "${enhancedText.substring(0, 100)}..."`, 'INFO')
    
    // Try to parse JSON response for multiple options
    let jsonText = enhancedText.trim()
    
    // Remove markdown code block if present
    if (jsonText.startsWith('```json') && jsonText.endsWith('```')) {
      jsonText = jsonText.slice(7, -3).trim()
      logToFile('Extracted JSON from markdown in quickEnhanceText', 'INFO')
    } else if (jsonText.startsWith('```') && jsonText.endsWith('```')) {
      jsonText = jsonText.slice(3, -3).trim()
      logToFile('Extracted content from markdown in quickEnhanceText', 'INFO')
    }
    
    try {
      const jsonResponse = JSON.parse(jsonText)
      if (jsonResponse && typeof jsonResponse === 'object') {
        logToFile(`Parsed JSON response: ${JSON.stringify(jsonResponse)}`, 'INFO')
        logToFile('Attempting to show enhancement options popup', 'INFO')
        await showEnhancementOptions(selectedText, jsonResponse)
        logToFile('showEnhancementOptions completed', 'INFO')
        return
      }
    } catch (parseError) {
      logToFile(`JSON parsing failed: ${parseError}`, 'INFO')
      logToFile('Response is not JSON, using as single enhancement', 'INFO')
    }
    
    // Fallback: Single enhancement - copy to clipboard
    logToFile('Using fallback: copying to clipboard', 'INFO')
    clipboard.writeText(enhancedText)
    showNotification('QuillWise', 'Text enhanced and copied to clipboard!')
    
  } catch (error) {
    logToFile(`Quick text enhancement failed: ${error}`, 'ERROR')
    showNotification('QuillWise', 'Enhancement failed. Please check your AI settings.')
  }
}

// Show enhancement options popup
async function showEnhancementOptions(originalText: string, options: any): Promise<void> {
  try {
    logToFile('=== CREATING ENHANCEMENT OPTIONS POPUP ===', 'DEBUG')
    logToFile(`Original text: "${originalText}"`, 'DEBUG')
    logToFile(`Options: ${JSON.stringify(options)}`, 'DEBUG')
    
    if (enhancementOptionsWindow) {
      logToFile('Closing existing enhancement options window', 'DEBUG')
      enhancementOptionsWindow.close()
      enhancementOptionsWindow = null
    }

    enhancementOptionsWindow = new BrowserWindow({
      width: 400,
      height: 300,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: true,
      focusable: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '../preload/index.cjs'),
        webSecurity: false
      }
    })

    // Position window at center of screen
    const { screen } = require('electron')
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
    const x = Math.round((screenWidth - 400) / 2)
    const y = Math.round((screenHeight - 300) / 2)
    
    enhancementOptionsWindow.setPosition(x, y)

    // Create HTML content for the popup
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: rgba(30, 30, 30, 0.98);
                color: #f8f9fa;
                padding: 16px;
                border-radius: 16px;
                backdrop-filter: blur(20px);
                border: 1px solid rgba(124, 58, 237, 0.3);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            }
            .header { 
                text-align: center; 
                margin-bottom: 12px; 
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .header h3 {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 6px;
                color: #f8f9fa;
            }
            .original { 
                background: rgba(60, 60, 60, 0.8); 
                padding: 8px 12px; 
                border-radius: 8px; 
                font-style: italic;
                font-size: 13px;
                color: #d1d5db;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .category {
                margin: 12px 0;
            }
            .category-title {
                font-weight: 600;
                color: #a855f7;
                margin-bottom: 6px;
                text-transform: uppercase;
                font-size: 11px;
                letter-spacing: 0.5px;
            }
            .option {
                background: rgba(60, 60, 60, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 10px 12px;
                margin: 4px 0;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.15s ease;
                font-size: 13px;
                line-height: 1.4;
                color: #f3f4f6;
            }
            .option:hover {
                background: rgba(124, 58, 237, 0.2);
                border-color: #a855f7;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
            }
            .message {
                background: rgba(60, 60, 60, 0.8);
                border: 2px dashed #a855f7;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                color: #a855f7;
                font-size: 14px;
                font-weight: 500;
                margin: 16px 0;
            }
            .close-btn {
                position: absolute;
                top: 8px;
                right: 12px;
                background: rgba(60, 60, 60, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #f8f9fa;
                font-size: 16px;
                cursor: pointer;
                padding: 4px;
                border-radius: 6px;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s ease;
            }
            .close-btn:hover {
                background: #a855f7;
                border-color: #a855f7;
                transform: scale(1.05);
            }
        </style>
    </head>
    <body>
        <button class="close-btn">×</button>
        <div class="header">
            <h3>${originalText ? 'Choose Enhanced Text' : 'QuillWise Text Enhancement'}</h3>
            ${originalText ? `<div class="original">Original: "${originalText}"</div>` : ''}
        </div>
        
        ${Object.entries(options).map(([category, items]: [string, any]) => {
            if (category === 'message') {
                // Special handling for message category
                return Array.isArray(items) ? items.map((item: string) => `
                    <div class="message">
                        ${item}
                    </div>
                `).join('') : '';
            } else {
                // Regular category with options
                return `
                    <div class="category">
                        <div class="category-title">${category}</div>
                        ${Array.isArray(items) ? items.map((item: string, index: number) => `
                            <div class="option">
                                ${item}
                            </div>
                        `).join('') : ''}
                    </div>
                `;
            }
        }).join('')}
        
        <script>
            console.log('Enhancement options popup loaded');
            console.log('electronAPI available:', !!window.electronAPI);
            console.log('selectEnhancementOption available:', !!window.electronAPI?.selectEnhancementOption);
            console.log('hideEnhancementOptions available:', !!window.electronAPI?.hideEnhancementOptions);
            
            function selectOption(text) {
                console.log('selectOption called with:', text);
                try {
                    if (window.electronAPI && window.electronAPI.selectEnhancementOption) {
                        console.log('Calling selectEnhancementOption...');
                        window.electronAPI.selectEnhancementOption(text)
                            .then(result => {
                                console.log('selectEnhancementOption success:', result);
                            })
                            .catch(error => {
                                console.error('selectEnhancementOption error:', error);
                            });
                    } else {
                        console.error('electronAPI.selectEnhancementOption not available');
                        console.log('Available methods:', Object.keys(window.electronAPI || {}));
                    }
                } catch (error) {
                    console.error('Error in selectOption:', error);
                }
            }
            
            function closePopup() {
                console.log('closePopup called');
                try {
                    if (window.electronAPI && window.electronAPI.hideEnhancementOptions) {
                        console.log('Calling hideEnhancementOptions...');
                        window.electronAPI.hideEnhancementOptions()
                            .then(result => {
                                console.log('hideEnhancementOptions success:', result);
                            })
                            .catch(error => {
                                console.error('hideEnhancementOptions error:', error);
                            });
                    } else {
                        console.error('electronAPI.hideEnhancementOptions not available');
                        window.close(); // Fallback
                    }
                } catch (error) {
                    console.error('Error in closePopup:', error);
                }
            }
            
            // Close on Escape
            document.addEventListener('keydown', (e) => {
                console.log('Key pressed:', e.key);
                if (e.key === 'Escape') {
                    closePopup();
                }
            });
            
            // Add click event listeners after DOM loads
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOM loaded, setting up event listeners');
                
                // Close button
                const closeBtn = document.querySelector('.close-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        console.log('Close button clicked');
                        closePopup();
                    });
                    console.log('Close button event listener added');
                } else {
                    console.error('Close button not found');
                }
                
                // Option buttons
                const options = document.querySelectorAll('.option');
                options.forEach((option, index) => {
                    option.addEventListener('click', (e) => {
                        e.preventDefault();
                        const text = option.textContent.trim();
                        console.log('Option clicked:', index, text);
                        selectOption(text);
                    });
                });
                console.log('Added event listeners to', options.length, 'options');
            });
        </script>
    </body>
    </html>
    `

    // Load HTML content
    enhancementOptionsWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

    enhancementOptionsWindow.on('closed', () => {
      enhancementOptionsWindow = null
    })

    // Auto-hide after 30 seconds
    setTimeout(() => {
      if (enhancementOptionsWindow) {
        enhancementOptionsWindow.close()
      }
    }, 30000)

    logToFile('About to show enhancement options window', 'DEBUG')
    enhancementOptionsWindow.show()
    enhancementOptionsWindow.focus()
    
    logToFile(`Enhancement options popup shown with ${Object.keys(options).length} categories`, 'INFO')
    logToFile('Enhancement options popup should now be visible', 'DEBUG')

  } catch (error) {
    logToFile(`Failed to show enhancement options: ${error}`, 'ERROR')
    // Fallback: copy first available option
    const firstCategory = Object.values(options)[0]
    if (Array.isArray(firstCategory) && firstCategory.length > 0) {
      clipboard.writeText(firstCategory[0])
      showNotification('QuillWise', 'Text enhanced and copied to clipboard!')
    }
  }
}

// Select all text in focused control (Ctrl+A)
async function selectAllTextInFocusedControl(): Promise<void> {
  try {
    if (process.platform !== 'win32') {
      logToFile('Select all command only supported on Windows', 'WARN')
      return
    }

    logToFile('Selecting all text in focused control (Ctrl+A)...', 'DEBUG')
    
    const koffi = require('koffi')
    const user32 = koffi.load('user32.dll')
    
    const keybd_event = user32.func('keybd_event', 'void', ['uint8', 'uint8', 'uint32', 'uintptr'])
    
    const VK_CONTROL = 0x11
    const VK_A = 0x41
    const KEYEVENTF_KEYUP = 0x0002
    
    // Press Ctrl+A to select all text
    keybd_event(VK_CONTROL, 0, 0, 0)
    keybd_event(VK_A, 0, 0, 0)
    await new Promise(resolve => setTimeout(resolve, 50))
    keybd_event(VK_A, 0, KEYEVENTF_KEYUP, 0)
    keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0)
    
    logToFile('Text selected with Ctrl+A', 'DEBUG')
    
  } catch (error) {
    logToFile(`Failed to select all text: ${error}`, 'ERROR')
  }
}

// Send Ctrl+V paste command using native Windows API
async function sendPasteCommand(): Promise<void> {
  try {
    if (process.platform !== 'win32') {
      logToFile('Paste command only supported on Windows', 'WARN')
      return
    }

    logToFile('=== SENDING PASTE COMMAND WITH NATIVE API ===', 'DEBUG')
    
    const koffi = require('koffi')
    
    // Load user32.dll
    const user32 = koffi.load('user32.dll')
    
    // Define Windows API functions
    const GetForegroundWindow = user32.func('GetForegroundWindow', 'pointer', [])
    const SetForegroundWindow = user32.func('SetForegroundWindow', 'bool', ['pointer'])
    const keybd_event = user32.func('keybd_event', 'void', ['uint8', 'uint8', 'uint32', 'uintptr'])
    
    // Virtual key codes
    const VK_CONTROL = 0x11
    const VK_V = 0x56
    const KEYEVENTF_KEYUP = 0x0002
    
    // Use original window if available, otherwise get foreground window
    let targetWindow
    
    if (originalWindowInfo && originalWindowInfo.handle) {
      // Convert string handle to pointer
      targetWindow = koffi.as(parseInt(originalWindowInfo.handle), 'pointer')
      logToFile(`Using stored original window: ${originalWindowInfo.handle}`, 'DEBUG')
    } else {
      // Get the foreground window as fallback
      targetWindow = GetForegroundWindow()
      logToFile(`Using foreground window: ${targetWindow}`, 'DEBUG')
    }
    
    if (targetWindow === 0n) {
      logToFile('No target window found', 'ERROR')
      return
    }
    
    // Ensure the target window is focused
    const focusResult = SetForegroundWindow(targetWindow)
    logToFile(`Set foreground result: ${focusResult}`, 'DEBUG')
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    logToFile('Sending Ctrl+V key combination...', 'DEBUG')
    
    // Press Ctrl down
    keybd_event(VK_CONTROL, 0, 0, 0)
    logToFile('Ctrl key pressed down', 'DEBUG')
    
    // Press V down
    keybd_event(VK_V, 0, 0, 0)
    logToFile('V key pressed down', 'DEBUG')
    
    // Small delay between press and release
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Release V
    keybd_event(VK_V, 0, KEYEVENTF_KEYUP, 0)
    logToFile('V key released', 'DEBUG')
    
    // Release Ctrl
    keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0)
    logToFile('Ctrl key released', 'DEBUG')
    
    logToFile('Paste command sent successfully with native API', 'INFO')
    
  } catch (error) {
    logToFile(`Native paste command failed: ${error}`, 'ERROR')
    logToFile(`Error details: ${error.stack}`, 'ERROR')
    
    // Fallback to PowerShell method
    logToFile('Falling back to PowerShell method...', 'INFO')
    await sendPasteCommandFallback()
  }
}

// Fallback PowerShell paste command
async function sendPasteCommandFallback(): Promise<void> {
  return new Promise((resolve) => {
    const { spawn } = require('child_process')
    
    logToFile('Using PowerShell fallback for paste command', 'DEBUG')
    
    const psScript = `
      try {
        Add-Type -AssemblyName System.Windows.Forms
        Start-Sleep -Milliseconds 100
        [System.Windows.Forms.SendKeys]::SendWait("^v")
        Write-Host "PowerShell paste command sent"
      } catch {
        Write-Host "PowerShell paste failed: $($_.Exception.Message)"
      }
    `
    
    const ps = spawn('powershell', ['-Command', psScript], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    ps.stdout.on('data', (data) => {
      logToFile(`PowerShell paste stdout: ${data.toString()}`, 'DEBUG')
    })
    
    ps.on('close', (code) => {
      logToFile(`PowerShell paste completed with code: ${code}`, 'DEBUG')
      resolve()
    })
    
    setTimeout(() => {
      ps.kill()
      resolve()
    }, 3000)
  })
}

// Show system notification
function showNotification(title: string, message: string): void {
  try {
    const { Notification } = require('electron')
    
    if (Notification.isSupported()) {
      new Notification({
        title: title,
        body: message,
        icon: join(__dirname, '../../resources/icon.png'),
        silent: false,
        timeoutType: 'default'
      }).show()
    } else {
      logToFile(`Notification not supported: ${title} - ${message}`, 'INFO')
    }
  } catch (error) {
    logToFile(`Failed to show notification: ${error}`, 'ERROR')
  }
}

function hideFloatingButtons(): void {
  if (floatingButtonsWindow) {
    floatingButtonsWindow.hide()
    logToFile('Floating buttons hidden', 'INFO')
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
      overlaySettings: {
        position: 'top-left',
        offset: { x: 20, y: 60 },
        followCursor: false,
        stayOnScreen: true,
        alwaysOnTop: true,
        belowTextBoxAlways: false,
        preventFocusSteal: true
      },
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

    // Ensure overlaySettings sub-object is also merged properly
    if (storedSettings.overlaySettings) {
      settings.overlaySettings = { ...defaultSettings.overlaySettings, ...storedSettings.overlaySettings }
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

// AI Enhancement Service - Returns JSON with multiple options
async function enhanceTextWithAI(text: string, aiSettings: any): Promise<string> {
  const prompt = `Provide 5-8 improved versions of this text in different styles. Return ONLY a JSON object with this exact structure:

{
  "formal": ["option1", "option2", "option3"],
  "casual": ["option1", "option2", "option3"], 
  "friendly": ["option1", "option2"]
}

Text to improve: "${text}"

JSON:`
  
  try {
    switch (aiSettings.provider) {
      case 'openai':
        return await enhanceWithOpenAI(prompt, aiSettings)
      case 'gemini':
        return await enhanceWithGemini(prompt, aiSettings)
      case 'ollama':
        return await enhanceWithOllama(prompt, aiSettings)
      default:
        throw new Error(`Unsupported AI provider: ${aiSettings.provider}`)
    }
  } catch (error) {
    logToFile(`AI enhancement failed: ${error}`, 'ERROR')
    throw error
  }
}

async function enhanceWithOpenAI(prompt: string, aiSettings: any): Promise<string> {
  if (!aiSettings.openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aiSettings.openaiApiKey}`
    },
    body: JSON.stringify({
      model: aiSettings.model || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: aiSettings.maxTokens || 1000,
      temperature: aiSettings.temperature || 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'Enhancement failed'
}

async function enhanceWithGemini(prompt: string, aiSettings: any): Promise<string> {
  if (!aiSettings.geminiApiKey) {
    throw new Error('Gemini API key not configured')
  }

  logToFile(`Gemini API Request - Model: ${aiSettings.model || 'gemini-1.5-flash'}`, 'DEBUG')
  logToFile(`Gemini API Request - Prompt: ${prompt.substring(0, 100)}...`, 'DEBUG')

  // Force Gemini 1.5 Flash as it's more stable than 2.5
  const model = aiSettings.model === 'gemini-2.5-flash' ? 'gemini-1.5-flash' : (aiSettings.model || 'gemini-1.5-flash')
  logToFile(`Using stable model: ${model} (original: ${aiSettings.model})`, 'INFO')
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiSettings.geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: Math.min(aiSettings.maxTokens || 200, 200), // Limit to 200 tokens max
        temperature: aiSettings.temperature || 0.7
      }
    })
  })

  logToFile(`Gemini API Response Status: ${response.status} ${response.statusText}`, 'DEBUG')

  if (!response.ok) {
    const errorText = await response.text()
    logToFile(`Gemini API Error Response: ${errorText}`, 'ERROR')
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  logToFile(`Gemini API Response: ${JSON.stringify(data, null, 2)}`, 'DEBUG')
  
  if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
    logToFile(`Gemini API: No candidates found in response`, 'ERROR')
    throw new Error('Gemini API: No candidates found in response')
  }

  const candidate = data.candidates[0]
  
  // Check for different finish reasons
  if (candidate.finishReason === 'MAX_TOKENS') {
    logToFile(`Gemini API: Response truncated due to max tokens`, 'WARN')
  }
  
  if (!candidate.content) {
    logToFile(`Gemini API: No content in candidate`, 'ERROR')
    throw new Error('Gemini API: No content in response')
  }
  
  // Handle different response formats
  let text = ''
  
  if (candidate.content.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
    // Standard format with parts
    text = candidate.content.parts[0]?.text || ''
  } else if (candidate.content.text) {
    // Direct text format
    text = candidate.content.text
  } else if (typeof candidate.content === 'string') {
    // Content is directly a string
    text = candidate.content
  }
  
  if (!text || text.trim().length === 0) {
    logToFile(`Gemini API: No text found in response content`, 'ERROR')
    logToFile(`Gemini API: Content structure: ${JSON.stringify(candidate.content)}`, 'ERROR')
    throw new Error('Gemini API: No text content in response')
  }

  logToFile(`Gemini API Success - Generated ${text.length} characters`, 'INFO')
  
  // Try to extract JSON from markdown code blocks and parse it
  let jsonText = text.trim()
  
  // Remove markdown code block if present
  if (jsonText.startsWith('```json') && jsonText.endsWith('```')) {
    jsonText = jsonText.slice(7, -3).trim() // Remove ```json and ```
    logToFile('Extracted JSON from markdown code block', 'INFO')
  } else if (jsonText.startsWith('```') && jsonText.endsWith('```')) {
    jsonText = jsonText.slice(3, -3).trim() // Remove generic ```
    logToFile('Extracted content from markdown code block', 'INFO')
  }
  
  // Try to parse as JSON
  try {
    const jsonResponse = JSON.parse(jsonText)
    if (jsonResponse && typeof jsonResponse === 'object') {
      logToFile('Successfully parsed Gemini response as JSON', 'INFO')
      return JSON.stringify(jsonResponse)
    }
  } catch (parseError) {
    logToFile(`JSON parsing failed: ${parseError}`, 'WARN')
    logToFile('Response is not valid JSON, returning as text', 'WARN')
  }
  
  return text
}

async function enhanceWithOllama(prompt: string, aiSettings: any): Promise<string> {
  const response = await fetch(`${aiSettings.ollamaUrl || 'http://localhost:11434'}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: aiSettings.ollamaModel || 'llama3.2',
      prompt: prompt,
      stream: false,
      options: {
        temperature: aiSettings.temperature || 0.7,
        num_predict: aiSettings.maxTokens || 1000
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.response || 'Enhancement failed'
}

// Simple text enhancement IPC handlers
ipcMain.handle('quick-enhance-text', async () => {
  await quickEnhanceText()
  return { success: true }
})

ipcMain.handle('get-focused-control-text', async () => {
  try {
    const result = await getFocusedControlText()
    return result
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('select-enhancement-option', async (_, text: string) => {
  try {
    clipboard.writeText(text)
    logToFile(`Enhancement option selected: "${text.substring(0, 50)}..."`, 'INFO')
    
    // Hide the options window first
    if (enhancementOptionsWindow) {
      enhancementOptionsWindow.close()
      enhancementOptionsWindow = null
    }
    
    // Send Ctrl+V to paste the selected text over the original
    await sendPasteCommand()
    
    showNotification('QuillWise', 'Text replaced!')
    return { success: true }
  } catch (error) {
    logToFile(`Failed to select enhancement option: ${error}`, 'ERROR')
    return { success: false, error: error.message }
  }
})

ipcMain.handle('hide-enhancement-options', async () => {
  try {
    if (enhancementOptionsWindow) {
      enhancementOptionsWindow.close()
      enhancementOptionsWindow = null
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('enhance-text', async (_, text: string) => {
  try {
    logToFile('Text enhancement requested', 'INFO')
    
    // Get AI settings
    const settings = store.get('settings', {}) as AppSettings
    const aiSettings = settings.aiSettings
    
    if (!aiSettings) {
      throw new Error('AI settings not configured')
    }
    
    // Validate AI provider configuration
    if (aiSettings.provider === 'openai' && !aiSettings.openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }
    if (aiSettings.provider === 'gemini' && !aiSettings.geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }
    
    // Enhance text using AI
    const enhancedText = await enhanceTextWithAI(text, aiSettings)
    
    logToFile('Text enhancement completed', 'INFO')
    return enhancedText
  } catch (error) {
    logToFile(`Text enhancement failed: ${error}`, 'ERROR')
    throw error
  }
})

ipcMain.handle('show-main-window', async () => {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
  }
  return true
})

// Function to get selected text safely using clipboard (IMPROVED)
async function getSelectedTextFromWindows(): Promise<string> {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve('')
      return
    }

    try {
      // Simply read from clipboard - don't send Ctrl+C
      // This prevents the random '/' character issue
      const selectedText = clipboard.readText()
      logToFile(`Selected text retrieved from clipboard: "${selectedText.substring(0, 50)}..."`, 'DEBUG')
      resolve(selectedText || '')
    } catch (error) {
      logToFile(`Failed to get selected text from clipboard: ${error}`, 'DEBUG')
      resolve('')
    }
  })
}

// This function has been removed - using only UI Automation API now

// Windows UI Automation API integration for reading text box content
async function getTextFromActiveInputWithUIAutomation(): Promise<{ success: boolean; text?: string; error?: string; elementInfo?: any }> {
  return new Promise((resolve) => {
    const { spawn } = require('child_process')
    
    logToFile('=== UI AUTOMATION TEXT READING STARTED ===', 'DEBUG')
    
    const psScript = `
      try {
        # Load required assemblies for UI Automation
        Add-Type -AssemblyName UIAutomationClient
        Add-Type -AssemblyName UIAutomationTypes
        Add-Type -AssemblyName UIAutomationProvider
        
        Write-Host "UI Automation assemblies loaded successfully"
        
        # Create UI Automation object
        $automation = [System.Windows.Automation.AutomationElement]::RootElement
        
        # Get the currently focused element
        $focusedElement = [System.Windows.Automation.AutomationElement]::FocusedElement
        
        if ($focusedElement -eq $null) {
          throw "No focused element found"
        }
        
        Write-Host "Focused element found: $($focusedElement.Current.Name)"
        
        # Get element properties
        $elementName = $focusedElement.Current.Name
        $elementClassName = $focusedElement.Current.ClassName
        $elementControlType = $focusedElement.Current.ControlType.ProgrammaticName
        $elementAutomationId = $focusedElement.Current.AutomationId
        $elementProcessId = $focusedElement.Current.ProcessId
        
        Write-Host "Element details - Name: $elementName, Class: $elementClassName, Type: $elementControlType"
        
        # Check if element supports text patterns
        $textContent = ""
        $valueContent = ""
        $isTextInput = $false
        
        # Try TextPattern for rich text controls
        try {
          $textPattern = $focusedElement.GetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern)
          if ($textPattern -ne $null) {
            $textContent = $textPattern.DocumentRange.GetText(-1)
            $isTextInput = $true
            Write-Host "Text pattern found, content length: $($textContent.Length)"
          }
        } catch {
          Write-Host "TextPattern not supported: $($_.Exception.Message)"
        }
        
        # Try ValuePattern for simple input controls
        try {
          $valuePattern = $focusedElement.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
          if ($valuePattern -ne $null) {
            $valueContent = $valuePattern.Current.Value
            $isTextInput = $true
            Write-Host "Value pattern found, content: $valueContent"
          }
        } catch {
          Write-Host "ValuePattern not supported: $($_.Exception.Message)"
        }
        
        # Try SelectionPattern for selection-based controls
        $selectedText = ""
        try {
          $selectionPattern = $focusedElement.GetCurrentPattern([System.Windows.Automation.SelectionPattern]::Pattern)
          if ($selectionPattern -ne $null) {
            $selection = $selectionPattern.Current.GetSelection()
            if ($selection.Length -gt 0) {
              $selectedText = $selection[0].GetText(-1)
              Write-Host "Selection pattern found, selected text: $selectedText"
            }
          }
        } catch {
          Write-Host "SelectionPattern not supported: $($_.Exception.Message)"
        }
        
        # Get window information
        $windowElement = $focusedElement
        while ($windowElement -ne $null -and $windowElement.Current.ControlType.ProgrammaticName -ne "ControlType.Window") {
          $windowElement = [System.Windows.Automation.TreeWalker]::ControlViewWalker.GetParent($windowElement)
        }
        
        $windowTitle = if ($windowElement -ne $null) { $windowElement.Current.Name } else { "Unknown" }
        
        # Determine the best text content
        $finalText = ""
        if ($selectedText -ne "") {
          $finalText = $selectedText
        } elseif ($textContent -ne "") {
          $finalText = $textContent
        } elseif ($valueContent -ne "") {
          $finalText = $valueContent
        }
        
        $result = @{
          success = $true
          text = $finalText
          elementInfo = @{
            name = $elementName
            className = $elementClassName
            controlType = $elementControlType
            automationId = $elementAutomationId
            processId = $elementProcessId
            windowTitle = $windowTitle
            isTextInput = $isTextInput
            hasTextPattern = ($textContent -ne "")
            hasValuePattern = ($valueContent -ne "")
            hasSelection = ($selectedText -ne "")
            textLength = $finalText.Length
          }
          timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        }
        
        Write-Host "UI Automation completed successfully"
        $result | ConvertTo-Json -Compress
        
      } catch {
        Write-Host "UI Automation error: $($_.Exception.Message)"
        @{ 
          success = $false
          error = $_.Exception.Message
          timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        } | ConvertTo-Json -Compress
      }
    `
    
    const ps = spawn('powershell', ['-Command', psScript], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    let output = ''
    let errorOutput = ''
    
    ps.stdout.on('data', (data) => {
      const dataStr = data.toString()
      output += dataStr
      logToFile(`UI Automation PowerShell stdout: ${dataStr}`, 'DEBUG')
    })
    
    ps.stderr.on('data', (data) => {
      const errorStr = data.toString()
      errorOutput += errorStr
      logToFile(`UI Automation PowerShell stderr: ${errorStr}`, 'DEBUG')
    })
    
    ps.on('close', (code) => {
      logToFile(`UI Automation PowerShell process closed with code: ${code}`, 'DEBUG')
      logToFile(`UI Automation raw output: ${output}`, 'DEBUG')
      
      try {
        if (output.trim()) {
          // Find JSON content in output
          const lines = output.split('\n')
          let jsonLine = ''
          
          for (const line of lines) {
            const trimmedLine = line.trim()
            if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
              jsonLine = trimmedLine
              break
            }
          }
          
          if (jsonLine) {
            const result = JSON.parse(jsonLine)
            logToFile(`UI Automation result: ${JSON.stringify(result)}`, 'DEBUG')
            resolve(result)
          } else {
            logToFile('No valid JSON found in UI Automation output', 'DEBUG')
            resolve({ success: false, error: 'No valid JSON output' })
          }
        } else {
          logToFile(`UI Automation no output. Error: ${errorOutput}`, 'DEBUG')
          resolve({ success: false, error: 'No output from UI Automation script' })
        }
      } catch (parseError) {
        logToFile(`Failed to parse UI Automation output: ${parseError}`, 'DEBUG')
        resolve({ success: false, error: 'Failed to parse UI Automation output' })
      }
    })
    
    ps.on('error', (error) => {
      logToFile(`UI Automation PowerShell error: ${error.message}`, 'DEBUG')
      resolve({ success: false, error: error.message })
    })
    
    // Timeout after 5 seconds
    setTimeout(() => {
      ps.kill()
      logToFile('UI Automation PowerShell process timed out', 'DEBUG')
      resolve({ success: false, error: 'UI Automation timeout' })
    }, 5000)
  })
}

// Removed complex Windows Event Hook system - now using simple clipboard-based enhancement

// IPC handler removed - using only UI Automation API now

// Removed Windows Event Hook IPC handlers - using simple clipboard-based system

// New IPC handler for UI Automation text reading
ipcMain.handle('get-text-with-ui-automation', async () => {
  try {
    logToFile('=== UI AUTOMATION TEXT REQUEST STARTED ===', 'DEBUG')
    const result = await getTextFromActiveInputWithUIAutomation()
    logToFile(`UI Automation text request completed: ${JSON.stringify(result)}`, 'DEBUG')
    return result
  } catch (error) {
    const errorMessage = `Failed to get text with UI Automation: ${error instanceof Error ? error.message : String(error)}`
    logToFile(errorMessage, 'ERROR')
    return { success: false, error: errorMessage }
  }
})

ipcMain.handle('get-selected-text', async () => {
  try {
    // Use clipboard directly - more reliable and no SendKeys issues
    const selectedText = clipboard.readText()
    
    if (!selectedText || selectedText.trim() === '') {
      logToFile('No text found in clipboard', 'DEBUG')
      return { success: true, text: '' }
    }
    
    logToFile(`Selected text retrieved: "${selectedText.substring(0, 50)}..."`, 'DEBUG')
    return { success: true, text: selectedText }
  } catch (error) {
    const errorMessage = `Failed to get selected text: ${error instanceof Error ? error.message : String(error)}`
    logToFile(errorMessage, 'ERROR')
    return { success: false, error: errorMessage }
  }
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