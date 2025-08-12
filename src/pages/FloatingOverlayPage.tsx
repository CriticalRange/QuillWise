import React, { useState, useEffect, useRef } from 'react'
import { Copy, Check, Zap, Languages, Sparkles, FileText, GripHorizontal } from 'lucide-react'

interface FloatingOverlayPageProps {}

type ActionType = 'translate' | 'enhance' | 'summarize' | null

const FloatingOverlayPage: React.FC<FloatingOverlayPageProps> = () => {
  const [clipboardText, setClipboardText] = useState<string>('')
  const [processedText, setProcessedText] = useState<string>('')
  const [currentAction, setCurrentAction] = useState<ActionType>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isDark, setIsDark] = useState(false)
  const [aiSettings, setAiSettings] = useState<any>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  // Detect dark theme
  useEffect(() => {
    const detectTheme = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(prefersDark)
    }
    
    detectTheme()
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', detectTheme)
    
    return () => mediaQuery.removeEventListener('change', detectTheme)
  }, [])

  useEffect(() => {
    // Listen for clipboard text from main process
    if (window.electronAPI) {
      const unsubscribe = window.electronAPI.onClipboardText((text: string) => {
        setClipboardText(text)
        setProcessedText('')
        setCurrentAction(null)
      })

      return unsubscribe
    }
  }, [])

  // Load AI settings
  useEffect(() => {
    const loadAISettings = async () => {
      if (window.electronAPI?.getSettings) {
        try {
          const settings = await window.electronAPI.getSettings()
          setAiSettings(settings.aiSettings)
        } catch (error) {
          console.error('Failed to load AI settings:', error)
        }
      }
    }

    loadAISettings()
  }, [])

  useEffect(() => {
    // Listen for global hotkeys
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 't' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        handleAction('translate')
      } else if (event.key.toLowerCase() === 'e' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        handleAction('enhance')
      } else if (event.key.toLowerCase() === 's' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        handleAction('summarize')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [clipboardText])

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX
    const startY = e.clientY
    
    e.preventDefault()
    
    // Initialize drag in main process
    if (window.electronAPI?.startDrag) {
      window.electronAPI.startDrag(startX, startY)
    }
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      
      if (window.electronAPI?.moveWindow) {
        window.electronAPI.moveWindow(deltaX, deltaY)
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleAction = async (action: ActionType) => {
    if (!clipboardText.trim() || isProcessing || !aiSettings) return

    // Check if AI provider is configured
    if (!aiSettings.provider) {
      setProcessedText('Please select an AI provider in settings.')
      return
    }
    
    // Check API keys for specific providers
    if (aiSettings.provider === 'gemini' && !aiSettings.geminiApiKey) {
      setProcessedText('Please add your Gemini API key in settings.')
      return
    }
    
    if (aiSettings.provider === 'openai' && !aiSettings.openaiApiKey) {
      setProcessedText('Please add your OpenAI API key in settings.')
      return
    }

    setIsProcessing(true)
    setCurrentAction(action)
    setAnimationKey(prev => prev + 1)

    try {
      // Import AI service dynamically
      const { aiService } = await import('../utils/aiService')
      
      // Update AI service with current settings
      aiService.updateConfig(aiSettings)
      
      // Map actions to AI service types
      const typeMap = {
        translate: 'improve', // We'll handle translation in the prompt
        enhance: 'improve',
        summarize: 'summarize'
      }
      
      let result = ''
      if (action === 'translate') {
        // Custom translation handling
        const response = await aiService.generateSuggestion({
          text: clipboardText,
          type: 'improve',
          context: 'translation'
        })
        result = response.suggestion
      } else {
        const response = await aiService.generateSuggestion({
          text: clipboardText,
          type: typeMap[action] as 'improve' | 'summarize',
          context: 'general'
        })
        result = response.suggestion
      }
      
      setProcessedText(result)
    } catch (error) {
      console.error('AI processing failed:', error)
      
      // More specific error messages
      let errorMessage = 'Error processing text.'
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = 'Invalid API key. Please check your settings.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection.'
        } else if (error.message.includes('Ollama')) {
          errorMessage = 'Ollama connection failed. Is it running?'
        } else {
          errorMessage = `AI Error: ${error.message}`
        }
      }
      
      setProcessedText(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = async () => {
    if (!processedText) return
    
    try {
      await navigator.clipboard.writeText(processedText)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const getActionIcon = (action: ActionType) => {
    switch (action) {
      case 'translate': return <Languages className="w-4 h-4" />
      case 'enhance': return <Sparkles className="w-4 h-4" />
      case 'summarize': return <FileText className="w-4 h-4" />
      default: return <Zap className="w-4 h-4" />
    }
  }

  const getActionColor = (action: ActionType) => {
    switch (action) {
      case 'translate': return 'text-purple-500'
      case 'enhance': return 'text-purple-600'
      case 'summarize': return 'text-purple-400'
      default: return 'text-purple-500'
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <div className={`w-full max-w-sm ${isDark ? 'bg-black' : 'bg-white'} rounded-xl shadow-2xl border ${isDark ? 'border-gray-800' : 'border-gray-200'} flex flex-col overflow-hidden`}>
      {/* Draggable Header */}
      <div 
        className={`flex items-center justify-between p-2 ${isDark ? 'bg-gradient-to-r from-purple-900/30 to-purple-800/40 border-b border-purple-700/50' : 'bg-gradient-to-r from-purple-500/10 to-purple-600/15 border-b border-purple-200/30'} rounded-t-xl cursor-move`}
        onMouseDown={handleMouseDown}
        ref={dragRef}
      >
        <div className="flex items-center gap-1">
          <GripHorizontal className={`w-3 h-3 ${isDark ? 'text-purple-400' : 'text-purple-400'}`} />
          <span className={`text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>QuillWise</span>
          {aiSettings?.provider && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
              {aiSettings.provider.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => handleAction('translate')}
            disabled={isProcessing || !clipboardText.trim() || !aiSettings?.provider}
            className={`px-2 py-1 text-xs ${isDark ? 'bg-purple-900/60 hover:bg-purple-800/70 text-purple-300' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'} rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-0.5`}
            title="Translate (T)"
          >
            <Languages className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleAction('enhance')}
            disabled={isProcessing || !clipboardText.trim() || !aiSettings?.provider}
            className={`px-2 py-1 text-xs ${isDark ? 'bg-purple-900/60 hover:bg-purple-800/70 text-purple-300' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'} rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-0.5`}
            title="Enhance (E)"
          >
            <Sparkles className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleAction('summarize')}
            disabled={isProcessing || !clipboardText.trim() || !aiSettings?.provider}
            className={`px-2 py-1 text-xs ${isDark ? 'bg-purple-900/60 hover:bg-purple-800/70 text-purple-300' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'} rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-0.5`}
            title="Summarize (S)"
          >
            <FileText className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col">
        {/* Original Text */}
        <div className="mb-2">
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mb-1`}>Clipboard:</div>
          <div className={`${isDark ? 'bg-gray-900/80' : 'bg-gray-50'} rounded-md p-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-700'} max-h-12 overflow-y-auto`}>
            {clipboardText ? clipboardText.substring(0, 80) + (clipboardText.length > 80 ? '...' : '') : 'No text'}
          </div>
        </div>

        {/* Processing Animation */}
        {isProcessing && (
          <div className="flex items-center justify-center py-3">
            <div className={`flex items-center gap-1 ${getActionColor(currentAction)}`}>
              {getActionIcon(currentAction)}
              <div className="flex gap-0.5">
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Result Card */}
        {processedText && !isProcessing && (
          <div 
            key={animationKey}
            className={`flex-1 ${isDark ? 'bg-gradient-to-br from-purple-900/40 to-purple-950/60 border border-purple-800/50' : 'bg-gradient-to-br from-purple-50 to-purple-100/70 border border-purple-200/50'} rounded-md p-2 animate-[fadeInScale_0.5s_ease-out]`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className={`flex items-center gap-1 ${getActionColor(currentAction)}`}>
                {getActionIcon(currentAction)}
                <span className="text-xs font-medium capitalize">{currentAction || 'Result'}</span>
              </div>
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-1 px-1.5 py-0.5 text-xs ${isDark ? 'bg-gray-950/80 hover:bg-purple-900/50' : 'bg-white/80 hover:bg-purple-50'} rounded transition-colors`}
              >
                {isCopied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className={`w-3 h-3 ${isDark ? 'text-purple-300' : 'text-purple-500'}`} />
                )}
              </button>
            </div>
            <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-800'} leading-relaxed max-h-20 overflow-y-auto`}>
              {processedText}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isProcessing && !processedText && (
          <div className="flex-1 flex items-center justify-center text-center py-2">
            {!aiSettings?.provider ? (
              <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="text-xs">Configure AI settings</div>
                <div className="text-xs">in main app first</div>
              </div>
            ) : (
              <div className={`${isDark ? 'text-purple-300' : 'text-purple-500'}`}>
                <div className="text-xs mb-1">Press to transform:</div>
                <div className="flex gap-2 justify-center text-xs">
                  <span><kbd className={`px-1 py-0.5 ${isDark ? 'bg-purple-900/60 text-purple-300' : 'bg-purple-100 text-purple-700'} rounded text-xs`}>T</kbd></span>
                  <span><kbd className={`px-1 py-0.5 ${isDark ? 'bg-purple-900/60 text-purple-300' : 'bg-purple-100 text-purple-700'} rounded text-xs`}>E</kbd></span>
                  <span><kbd className={`px-1 py-0.5 ${isDark ? 'bg-purple-900/60 text-purple-300' : 'bg-purple-100 text-purple-700'} rounded text-xs`}>S</kbd></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

// Add custom styles for floating overlay
const style = document.createElement('style')
style.textContent = `
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    overflow: hidden !important;
  }
  
  @keyframes fadeInScale {
    0% {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`
document.head.appendChild(style)

export default FloatingOverlayPage