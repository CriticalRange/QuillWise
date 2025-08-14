import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Clipboard operations
  copyToClipboard: (text: string) => ipcRenderer.invoke('copy-to-clipboard', text),
  getClipboardText: () => ipcRenderer.invoke('get-clipboard-text'),
  
  // Settings management
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: any) => ipcRenderer.invoke('update-settings', settings),
  
  // Window management
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  showWindow: () => ipcRenderer.invoke('show-window'),
  
  // External links
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // Prompts and categories
  getPrompts: () => ipcRenderer.invoke('get-prompts'),
  savePrompts: (prompts: any[]) => ipcRenderer.invoke('save-prompts', prompts),
  getCategories: () => ipcRenderer.invoke('get-categories'),
  saveCategories: (categories: any[]) => ipcRenderer.invoke('save-categories', categories),
  
  // Event listeners
  onNavigateTo: (callback: (route: string) => void) => {
    ipcRenderer.on('navigate-to', (_, route) => callback(route))
  },
  
  onKeyEvent: (callback: (event: any) => void) => {
    ipcRenderer.on('key-event', (_, event) => callback(event))
  },
  
  onTextDetected: (callback: (text: string, context: any) => void) => {
    ipcRenderer.on('text-detected', (_, text, context) => callback(text, context))
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },

  // Simple text enhancement API
  quickEnhanceText: () => ipcRenderer.invoke('quick-enhance-text'),
  getFocusedControlText: () => ipcRenderer.invoke('get-focused-control-text'),
  enhanceText: (text: string) => ipcRenderer.invoke('enhance-text', text),
  getSelectedText: () => ipcRenderer.invoke('get-selected-text'),
  
  // Enhancement options popup API
  selectEnhancementOption: (text: string) => ipcRenderer.invoke('select-enhancement-option', text),
  hideEnhancementOptions: () => ipcRenderer.invoke('hide-enhancement-options')
})

// Type definitions for the exposed API
export interface ElectronAPI {
  copyToClipboard: (text: string) => Promise<boolean>
  getClipboardText: () => Promise<string>
  getSettings: () => Promise<any>
  updateSettings: (settings: any) => Promise<boolean>
  hideWindow: () => Promise<boolean>
  showWindow: () => Promise<boolean>
  openExternal: (url: string) => Promise<boolean>
  getPrompts: () => Promise<any[]>
  savePrompts: (prompts: any[]) => Promise<boolean>
  getCategories: () => Promise<any[]>
  saveCategories: (categories: any[]) => Promise<boolean>
  onNavigateTo: (callback: (route: string) => void) => void
  onKeyEvent: (callback: (event: any) => void) => void
  onTextDetected: (callback: (text: string, context: any) => void) => void
  removeAllListeners: (channel: string) => void
  quickEnhanceText: () => Promise<{ success: boolean }>
  getFocusedControlText: () => Promise<{ success: boolean; text?: string; error?: string }>
  enhanceText: (text: string) => Promise<{ success: boolean; enhancedText?: string; error?: string }>
  getSelectedText: () => Promise<{ success: boolean; text?: string; error?: string }>
  selectEnhancementOption: (text: string) => Promise<{ success: boolean }>
  hideEnhancementOptions: () => Promise<{ success: boolean }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}