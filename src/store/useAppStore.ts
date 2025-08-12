import { create } from 'zustand'

interface AppStore {
  isVisible: boolean
  currentRoute: string
  isInitialized: boolean
  
  // Actions
  setVisible: (visible: boolean) => void
  setCurrentRoute: (route: string) => void

  setInitialized: (initialized: boolean) => void
  
  // Window management
  showWindow: () => Promise<void>
  hideWindow: () => Promise<void>
  
  // Overlay management
  showOverlay: () => void
  
  // Clipboard operations
  copyToClipboard: (text: string) => Promise<void>
  
  // Navigation
  navigateTo: (route: string) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  isVisible: false,
  currentRoute: '/main',
  isInitialized: false,

  setVisible: (visible) => {
    set({ isVisible: visible })
  },

  setCurrentRoute: (route) => {
    set({ currentRoute: route })
  },



  setInitialized: (initialized) => {
    set({ isInitialized: initialized })
  },

  showWindow: async () => {
    try {
      await window.electronAPI.showWindow()
      set({ isVisible: true })
    } catch (error) {
      console.error('Failed to show window:', error)
    }
  },

  hideWindow: async () => {
    try {
      await window.electronAPI.hideWindow()
      set({ isVisible: false })
    } catch (error) {
      console.error('Failed to hide window:', error)
    }
  },

  copyToClipboard: async (text) => {
    try {
      await window.electronAPI.copyToClipboard(text)
      
      // Clear any text selection to prevent visual glitch
      setTimeout(() => {
        if (window.getSelection) {
          const selection = window.getSelection()
          if (selection) {
            selection.removeAllRanges()
          }
        }
      }, 100)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      throw error
    }
  },

  showOverlay: () => {
    try {
      if (window.electronAPI?.showGlobalOverlay) {
        // Use overlay settings from user preferences
        window.electronAPI.showGlobalOverlay({ useSettings: true })
      }
    } catch (error) {
      console.error('Failed to show overlay:', error)
    }
  },

  navigateTo: (route) => {
    set({ currentRoute: route })
  }
}))