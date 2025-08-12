import { create } from 'zustand'
import { AppSettings } from '../types'

interface SettingsStore {
  settings: AppSettings
  isLoading: boolean
  loadSettings: () => Promise<void>
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>
  resetSettings: () => Promise<void>
}

const defaultSettings: AppSettings = {
  globalHotkey: 'Ctrl+Shift+Q',
  theme: 'system',
  fontSize: 14,
  autoHide: true,

  onboardingCompleted: false,
  clipboardReplacement: false,
  windowBounds: {
    width: 320,
    height: 280
  },

  aiSettings: {
    provider: 'gemini',
    openaiApiKey: '',
    geminiApiKey: '',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3.2',
    model: 'gemini-1.5-flash',
    maxTokens: 1000,
    temperature: 0.7
  },
  overlaySettings: {
    position: 'top-left',
    offset: { x: 20, y: 60 },
    followCursor: false,
    stayOnScreen: true,
    alwaysOnTop: true
  }
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true })
    try {
      let finalSettings = defaultSettings
      
      if (window.electronAPI && window.electronAPI.getSettings) {
        const settings = await window.electronAPI.getSettings()
        finalSettings = { ...defaultSettings, ...settings }
      } else {
        // Fallback for development/browser mode
        const localSettings = localStorage.getItem('quillwise_settings')
        if (localSettings) {
          finalSettings = { ...defaultSettings, ...JSON.parse(localSettings) }
        }
      }
      
      // Always sync to localStorage for AI API functions
      localStorage.setItem('quillwise_settings', JSON.stringify(finalSettings))
      
      set({ settings: finalSettings, isLoading: false })
    } catch (error) {
      console.error('Failed to load settings:', error)
      set({ settings: defaultSettings, isLoading: false })
    }
  },

  updateSettings: async (newSettings: Partial<AppSettings>) => {
    const currentSettings = get().settings
    const updatedSettings = { ...currentSettings, ...newSettings }
    
    try {
      if (window.electronAPI && window.electronAPI.saveSettings) {
        await window.electronAPI.saveSettings(updatedSettings)
      }
      
      // Also save to localStorage for AI API functions
      localStorage.setItem('quillwise_settings', JSON.stringify(updatedSettings))
      
      set({ settings: updatedSettings })
    } catch (error) {
      console.error('Failed to update settings:', error)
      throw error
    }
  },

  resetSettings: async () => {
    try {
      if (window.electronAPI && window.electronAPI.saveSettings) {
        await window.electronAPI.saveSettings(defaultSettings)
      }
      
      // Also reset localStorage
      localStorage.setItem('quillwise_settings', JSON.stringify(defaultSettings))
      
      set({ settings: defaultSettings })
    } catch (error) {
      console.error('Failed to reset settings:', error)
      throw error
    }
  }
}))