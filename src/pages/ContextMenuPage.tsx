import React, { useState, useEffect } from 'react'
import { Languages, Sparkles, FileText, Copy, Check, X } from 'lucide-react'

interface ContextMenuPageProps {}

const ContextMenuPage: React.FC<ContextMenuPageProps> = () => {
  const [selectedText, setSelectedText] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<string>('')
  const [isCopied, setIsCopied] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [aiSettings, setAiSettings] = useState<any>(null)

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
    // Listen for selected text from main process
    if (window.electronAPI) {
      const unsubscribe = window.electronAPI.onSelectedText((text: string) => {
        setSelectedText(text)
        // Reset states but don't close menu - allow smooth transitions
        setResult('')
        setIsCopied(false)
      })

      return unsubscribe
    }
  }, [])

  // Handle escape key to close menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (window.electronAPI) {
          window.electronAPI.hideWindow()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleAction = async (action: 'translate' | 'enhance' | 'summarize') => {
    if (!selectedText.trim() || isProcessing || !aiSettings) return

    // Check if AI provider is configured
    if (!aiSettings.provider) {
      setResult('Please select an AI provider in settings.')
      return
    }
    
    // Check API keys for specific providers
    if (aiSettings.provider === 'gemini' && !aiSettings.geminiApiKey) {
      setResult('Please add your Gemini API key in settings.')
      return
    }
    
    if (aiSettings.provider === 'openai' && !aiSettings.openaiApiKey) {
      setResult('Please add your OpenAI API key in settings.')
      return
    }

    setIsProcessing(true)
    setResult('')

    try {
      // Import AI service dynamically
      const { aiService } = await import('../utils/aiService')
      
      // Update AI service with current settings
      aiService.updateConfig(aiSettings)
      
      let response
      if (action === 'translate') {
        response = await aiService.generateSuggestion({
          text: selectedText,
          type: 'improve',
          context: 'translation' // Auto-detect and translate
        })
      } else if (action === 'enhance') {
        response = await aiService.generateSuggestion({
          text: selectedText,
          type: 'improve',
          context: 'general'
        })
      } else if (action === 'summarize') {
        response = await aiService.generateSuggestion({
          text: selectedText,
          type: 'summarize',
          context: 'general'
        })
      }
      
      if (response) {
        setResult(response.suggestion)
        
        // Auto-copy to clipboard
        await navigator.clipboard.writeText(response.suggestion)
        setIsCopied(true)
        
        // Auto-close after successful action
        setTimeout(() => {
          if (window.electronAPI) {
            window.electronAPI.hideWindow()
          }
        }, 1500)
      }
      
    } catch (error) {
      console.error('AI processing failed:', error)
      
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
      
      setResult(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const closeMenu = () => {
    if (window.electronAPI) {
      window.electronAPI.hideWindow()
    }
  }

  const menuItems = [
    {
      id: 'translate',
      icon: Languages,
      label: 'Translate',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-400 hover:to-blue-500',
      action: () => handleAction('translate')
    },
    {
      id: 'enhance',
      icon: Sparkles,
      label: 'Enhance',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-400 hover:to-purple-500',
      action: () => handleAction('enhance')
    },
    {
      id: 'summarize',
      icon: FileText,
      label: 'Summarize',
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-400 hover:to-green-500',
      action: () => handleAction('summarize')
    }
  ]

  return (
    <div className={`w-full h-full p-3 ${isDark ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-xl rounded-2xl shadow-2xl border ${isDark ? 'border-gray-700/30' : 'border-gray-200/30'} animate-[contextMenuSlide_0.3s_cubic-bezier(0.34,1.56,0.64,1)] relative overflow-hidden`}>
      {/* Glassmorphism background overlay */}
      <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-gray-800/20 to-gray-900/40' : 'bg-gradient-to-br from-white/40 to-gray-100/60'} backdrop-blur-sm rounded-2xl`} />
      <div className="relative z-10">
      {/* Close button */}
      <div className="flex justify-end mb-1">
        <button
          onClick={closeMenu}
          className={`p-1 rounded-md transition-colors ${
            isDark 
              ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-300' 
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Selected text preview - Enhanced */}
      <div className={`mb-4 p-3 rounded-xl text-sm transition-all duration-300 ${
        isDark ? 'bg-gray-800/40 text-gray-200 border-gray-600/30' : 'bg-gray-50/80 text-gray-700 border-gray-300/40'
      } border backdrop-blur-sm max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent hover:shadow-lg transform hover:scale-[1.02]`}>
        <div className={`${selectedText ? 'animate-[textFadeIn_0.4s_ease-out]' : ''}`}>
          {selectedText || 'No text selected'}
        </div>
      </div>

      {/* Menu items - Enhanced */}
      <div className="grid grid-cols-3 gap-3">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={item.action}
              disabled={isProcessing || !selectedText.trim() || !aiSettings?.provider}
              className={`group p-3 rounded-xl text-center transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 animate-[fadeInUp_${0.15 + index * 0.1}s_cubic-bezier(0.34,1.56,0.64,1)] ${
                isDark 
                  ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border border-gray-600/30 hover:border-gray-500/50 text-gray-200 hover:bg-gradient-to-br hover:from-gray-700/70 hover:via-gray-600/50 hover:to-gray-700/70'
                  : 'bg-gradient-to-br from-white/80 via-gray-50/60 to-white/80 border border-gray-200/40 hover:border-gray-300/60 text-gray-700 hover:bg-gradient-to-br hover:from-white/90 hover:via-gray-50/80 hover:to-white/90'
              } backdrop-blur-md shadow-lg hover:shadow-xl relative overflow-hidden`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Hover glow effect */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r ${item.color} blur-xl`} />
              
              <div className="relative z-10">
                <div className={`mx-auto mb-2 p-2 rounded-xl bg-gradient-to-r ${item.color} text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-sm font-semibold group-hover:text-opacity-90 transition-all duration-300">{item.label}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Processing indicator - Enhanced */}
      {isProcessing && (
        <div className="mt-4 flex items-center justify-center animate-[fadeInUp_0.3s_ease-out]">
          <div className={`flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-md border text-sm ${
            isDark 
              ? 'bg-purple-900/30 border-purple-700/50 text-purple-300'
              : 'bg-purple-50/80 border-purple-200/60 text-purple-700'
          } shadow-lg`}>
            <div className="relative">
              <div className="w-4 h-4 border-2 border-purple-300/30 rounded-full" />
              <div className="absolute inset-0 w-4 h-4 border-2 border-transparent border-t-purple-500 rounded-full animate-spin" />
            </div>
            <span className="font-medium">Processing...</span>
          </div>
        </div>
      )}

      {/* Result indicator - Enhanced */}
      {result && !isProcessing && (
        <div className="mt-4 flex items-center justify-center animate-[fadeInUp_0.4s_ease-out]">
          <div className={`flex items-center gap-3 px-4 py-2 rounded-full text-sm backdrop-blur-md border shadow-lg transition-all duration-300 ${
            isCopied 
              ? isDark
                ? 'bg-green-900/40 text-green-300 border-green-700/50 shadow-green-500/20'
                : 'bg-green-50/90 text-green-700 border-green-200/60 shadow-green-500/20'
              : isDark
                ? 'bg-gray-800/50 text-gray-300 border-gray-600/40'
                : 'bg-gray-50/90 text-gray-600 border-gray-200/50'
          } hover:scale-105 transform`}>
            {isCopied ? (
              <>
                <div className="relative">
                  <Check className="w-4 h-4 animate-[checkmark_0.3s_ease-out]" />
                </div>
                <span className="font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="font-medium">Ready</span>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

// Add custom styles for context menu
const style = document.createElement('style')
style.textContent = `
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    overflow: hidden !important;
  }
  
  /* Enhanced scrollbar styles */
  .scrollbar-thin {
    scrollbar-width: thin;
  }
  
  .scrollbar-thumb-gray-400::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 6px;
  }
  
  .scrollbar-track-transparent::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 4px;
  }
  
  @keyframes contextMenuSlide {
    0% {
      opacity: 0;
      transform: translateY(-15px) scale(0.9);
      filter: blur(4px);
    }
    50% {
      opacity: 0.8;
      transform: translateY(-5px) scale(0.95);
      filter: blur(2px);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
  }

  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(20px) scale(0.8);
      filter: blur(2px);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
  }
  
  @keyframes textFadeIn {
    0% {
      opacity: 0;
      transform: translateX(-10px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes checkmark {
    0% {
      opacity: 0;
      transform: scale(0.5) rotate(-45deg);
    }
    50% {
      opacity: 1;
      transform: scale(1.2) rotate(0deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }
  
  /* Glassmorphism hover effects */
  .group:hover .blur-xl {
    filter: blur(20px);
  }
`
document.head.appendChild(style)

export default ContextMenuPage