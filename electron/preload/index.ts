import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Clipboard operations
  copyToClipboard: (text: string) => ipcRenderer.invoke('copy-to-clipboard', text),
  getClipboardText: () => ipcRenderer.invoke('get-clipboard-text'),
  getSelectedText: () => ipcRenderer.invoke('get-selected-text'),
  
  // Settings management
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  
  // Window management
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  showWindow: () => ipcRenderer.invoke('show-window'),
  
  // External links
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // Data management
  getPrompts: () => ipcRenderer.invoke('get-prompts'),
  savePrompts: (prompts: any[]) => ipcRenderer.invoke('save-prompts', prompts),
  getCategories: () => ipcRenderer.invoke('get-categories'),
  saveCategories: (categories: any[]) => ipcRenderer.invoke('save-categories', categories),
  
  // Event listeners
  onNavigate: (callback: (page: string) => void) => {
    ipcRenderer.on('navigate', (_, page) => callback(page))
    return () => ipcRenderer.removeAllListeners('navigate')
  },
  
  
  onClipboardText: (callback: (text: string) => void) => {
    ipcRenderer.on('clipboard-text', (_, text) => callback(text))
    return () => ipcRenderer.removeAllListeners('clipboard-text')
  },

  // Context menu events
  onSelectedText: (callback: (text: string) => void) => {
    ipcRenderer.on('selected-text', (_, text) => callback(text))
    return () => ipcRenderer.removeAllListeners('selected-text')
  },
  
  // Window movement for dragging
  startDrag: (startX: number, startY: number) => ipcRenderer.invoke('start-drag', startX, startY),
  moveWindow: (deltaX: number, deltaY: number) => ipcRenderer.invoke('move-window', deltaX, deltaY),
  
  // Copy text to clipboard (for manual pasting)
  sendTextToActiveWindow: (text: string) => ipcRenderer.invoke('send-text-to-active-window', text),
  
  // Removed getActiveInputInfo - now using only UI Automation API
  getTextWithUIAutomation: () => ipcRenderer.invoke('get-text-with-ui-automation'),
  
  // Windows Event Hook system
  startWindowsEventHook: () => ipcRenderer.invoke('start-windows-event-hook'),
  stopWindowsEventHook: () => ipcRenderer.invoke('stop-windows-event-hook'),
  getEventHookStatus: () => ipcRenderer.invoke('get-event-hook-status'),
  
  // Event listeners for Windows Event Hook
  onActiveInputFieldInfo: (callback: (event: any, info: any) => void) => {
    ipcRenderer.on('active-input-field-info', callback)
    return () => ipcRenderer.removeAllListeners('active-input-field-info')
  },
  
  onSelectedTextChanged: (callback: (event: any, textInfo: any) => void) => {
    ipcRenderer.on('selected-text-changed', callback)
    return () => ipcRenderer.removeAllListeners('selected-text-changed')
  },
  
  // Floating buttons functionality
  enhanceText: (text: string) => ipcRenderer.invoke('enhance-text', text),
  showMainWindow: () => ipcRenderer.invoke('show-main-window'),
  hideFloatingButtons: () => ipcRenderer.invoke('hide-floating-buttons'),
  
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => 
    ipcRenderer.invoke('set-ignore-mouse-events', ignore, options)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('electronAPI', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.electronAPI = api
}