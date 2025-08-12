import { useCallback } from 'react'

export const useFloatingOverlay = () => {
  // Apply suggestion to clipboard for manual pasting
  const applySuggestion = useCallback(async (text: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.sendTextToActiveWindow(text)
      }
    } catch (error) {
      console.error('Failed to copy text to clipboard:', error)
    }
  }, [])

  return {
    applySuggestion
  }
}