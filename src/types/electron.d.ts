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
  
  // Copy text to clipboard for manual pasting
  sendTextToActiveWindow: (text: string) => Promise<boolean>
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
    electron: any
  }
}