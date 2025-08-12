import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import GlobalOverlay from './components/GlobalOverlay'
import './index.css'
import './overlay.css'

// Initialize stores for overlay context
import { useSettingsStore } from './store/useSettingsStore'

function OverlayApp() {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'bottom-right' | 'input-overlay'>('bottom-right')
  const [inputText, setInputText] = useState('')
  const [inputPosition, setInputPosition] = useState<{ x: number; y: number } | null>(null)
  
  // Initialize stores
  const { loadSettings } = useSettingsStore()
  
  // Initialize stores when overlay loads
  useEffect(() => {
    const initStores = async () => {
      try {
        await loadSettings()
      } catch (error) {
        console.error('Failed to initialize overlay stores:', error)
      }
    }
    initStores()
  }, [])

  useEffect(() => {
    console.log('OverlayApp mounted, isVisible:', isVisible)
    
    if (!window.electronAPI) {
      console.log('electronAPI not available')
      return
    }

    const handleDetectTextInput = (data: {
      position: 'bottom-right' | 'input-overlay'
      inputText: string
      inputPosition: { x: number; y: number } | null
    }) => {
      console.log('Text input detected:', data)
      
      setPosition(data.position)
      setInputText(data.inputText)
      setInputPosition(data.inputPosition)
      setIsVisible(true)
    }

    const cleanup = window.electronAPI.onDetectTextInput?.(handleDetectTextInput)
    return cleanup
  }, [])

  const handleClose = () => {
    setIsVisible(false)
  }

  const handleApplySuggestion = (suggestion: string) => {
    console.log('Applied suggestion:', suggestion)
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'transparent',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      <GlobalOverlay
        isVisible={isVisible}
        position={position}
        inputText={inputText}
        inputPosition={inputPosition}
        onClose={handleClose}
        onApplySuggestion={handleApplySuggestion}
      />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('overlay-root')!).render(
  <div style={{ 
    width: '100vw', 
    height: '100vh', 
    background: 'transparent',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
    position: 'fixed',
    top: 0,
    left: 0
  }}>
    <React.StrictMode>
      <OverlayApp />
    </React.StrictMode>
  </div>,
)