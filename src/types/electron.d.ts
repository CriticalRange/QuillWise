export interface IElectronAPI {
  copyToClipboard: (text: string) => Promise<void>
  getClipboardText: () => Promise<string>
  getSettings: () => Promise<any>
  saveSettings: (settings: any) => Promise<void>
  hideWindow: () => Promise<void>
  showWindow: () => Promise<void>
  openExternal: (url: string) => Promise<void>
  getPrompts: () => Promise<any[]>
  savePrompts: (prompts: any[]) => Promise<void>
  getCategories: () => Promise<any[]>
  saveCategories: (categories: any[]) => Promise<void>
  onNavigate: (callback: (page: string) => void) => () => void
  

  onClipboardText: (callback: (text: string) => void) => () => void
  
  // Context menu events
  onSelectedText: (callback: (text: string) => void) => () => void
  
  // Window movement for dragging
  startDrag: (startX: number, startY: number) => Promise<void>
  moveWindow: (deltaX: number, deltaY: number) => Promise<void>
  
  // Copy text to clipboard for manual pasting
  sendTextToActiveWindow: (text: string) => Promise<boolean>
  

  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => Promise<boolean>
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
    electron: any
  }
}