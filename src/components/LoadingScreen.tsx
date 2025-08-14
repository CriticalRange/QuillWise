import React from 'react'
import { Loader2 } from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'

const LoadingScreen: React.FC = () => {
  const { settings } = useSettingsStore()

  // Apply theme to document
  React.useEffect(() => {
    const applyTheme = () => {
      const { theme } = settings
      const root = document.documentElement
      
      // Remove existing theme classes
      root.classList.remove('dark', 'light')
      
      if (theme === 'dark') {
        root.classList.add('dark')
      } else if (theme === 'light') {
        root.classList.add('light')
      } else if (theme === 'system') {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
          root.classList.add('dark')
        } else {
          root.classList.add('light')
        }
      }
    }

    applyTheme()
  }, [settings.theme])
  return (
    <div className="h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          AI Prompt Creator
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loading your prompts...
        </p>
      </div>
    </div>
  )
}

export default LoadingScreen