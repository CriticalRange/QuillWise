import React from 'react'
import { useLocation } from 'react-router-dom'
import Navigation from './Navigation'
import { useAppStore } from '../store/useAppStore'
import { useSettingsStore } from '../store/useSettingsStore'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const { hideWindow } = useAppStore()
  const { settings } = useSettingsStore()

  const handleEscapeKey = React.useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      hideWindow()
    }
  }, [hideWindow])

  // Apply theme and font size to document
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

  // Apply font size to document
  React.useEffect(() => {
    const root = document.documentElement
    root.style.fontSize = `${settings.fontSize}px`
  }, [settings.fontSize])

  React.useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey)
    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [handleEscapeKey])

  return (
    <div className="h-screen bg-white dark:bg-black flex flex-col overflow-hidden transition-colors duration-300">
      {/* Navigation */}
      <Navigation currentPath={location.pathname} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden transition-all duration-300 ease-in-out">
        <div className="h-full p-2 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout