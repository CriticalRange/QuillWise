import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import { useSettingsStore } from './store/useSettingsStore'
import { usePromptStore } from './store/usePromptStore'

// Pages
import SettingsPage from './pages/SettingsPage'
import AboutPage from './pages/AboutPage'
import OnboardingPage from './pages/OnboardingPage'

import ContextMenuPage from './pages/ContextMenuPage'
import AIToolsPage from './pages/AIToolsPage'

// Components
import Layout from './components/Layout'
import LoadingScreen from './components/LoadingScreen'

function App() {
  const { setInitialized, navigateTo } = useAppStore()
  const { loadSettings, settings } = useSettingsStore()
  const { loadData } = usePromptStore()
  const [isLoading, setIsLoading] = React.useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load settings and data
        await Promise.all([
          loadSettings(),
          loadData()
        ])
        
        setInitialized(true)
      } catch (error) {
        console.error('Failed to initialize app:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Listen for navigation events from main process
      const unsubscribeNavigate = window.electronAPI.onNavigate((route: string) => {
        navigateTo(route)
      })

      // Text detection and key events removed - app now uses copy/paste only

      // Cleanup listeners on unmount
      return () => {
        unsubscribeNavigate()
      }
    }
  }, [navigateTo])

  if (isLoading) {
    return <LoadingScreen />
  }

  // Show onboarding if not completed
  if (!settings.onboardingCompleted) {
    return <OnboardingPage />
  }

  // Check if we're in context menu mode
  const isContextMenu = window.location.hash === '#/context-menu'

  if (isContextMenu) {
    return <ContextMenuPage />
  }

  return (
    <>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/ai-tools" replace />} />
            <Route path="/ai-tools" element={<AIToolsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </Layout>
      </Router>
    </>
  )
}

export default App