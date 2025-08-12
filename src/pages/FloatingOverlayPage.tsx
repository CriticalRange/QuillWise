import React, { useState, useEffect, useRef } from 'react'
import { Copy, Check, Zap, Languages, Sparkles, FileText, GripHorizontal, ChevronDown } from 'lucide-react'

interface FloatingOverlayPageProps {}

type ActionType = 'translate' | 'enhance' | 'summarize' | null
type TabType = 'translate' | 'enhance' | 'summarize'

interface EnhancementOption {
  id: string
  title: string
  description: string
  prompt: string
  color: string
}

interface Language {
  code: string
  name: string
  flag: string
}

const FloatingOverlayPage: React.FC<FloatingOverlayPageProps> = () => {
  const [clipboardText, setClipboardText] = useState<string>('')
  const [processedText, setProcessedText] = useState<string>('')
  const [currentAction, setCurrentAction] = useState<ActionType>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const [isDark, setIsDark] = useState(false)
  const [aiSettings, setAiSettings] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<TabType>('translate')
  const [selectedLanguage, setSelectedLanguage] = useState('tr')
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false)
  const [enhancementResults, setEnhancementResults] = useState<{[key: string]: string}>({})
  const dragRef = useRef<HTMLDivElement>(null)
  const languageDropdownRef = useRef<HTMLDivElement>(null)
  const textDisplayRef = useRef<HTMLDivElement>(null)
  const scrollAnimationRef = useRef<number | null>(null)

  const languages: Language[] = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ]

  const enhancementOptions: EnhancementOption[] = [
    {
      id: 'concise',
      title: 'Concise',
      description: 'Make it brief and to the point',
      prompt: 'Make this text more concise and brief while keeping all key information',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'formal',
      title: 'Formal',
      description: 'Professional and formal tone',
      prompt: 'Rewrite this text in a formal, professional tone suitable for business communication',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'friendly',
      title: 'Friendly',
      description: 'Warm and approachable tone',
      prompt: 'Rewrite this text in a friendly, warm, and approachable tone',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'creative',
      title: 'Creative',
      description: 'Add creativity and flair',
      prompt: 'Rewrite this text in a more creative and engaging way, adding some flair and personality',
      color: 'from-orange-500 to-orange-600'
    }
  ]

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup scroll animation on unmount
  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current)
      }
    }
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
          console.log('FloatingOverlay - Loaded settings:', settings.aiSettings)
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
        setActiveTab('translate')
        handleAction('translate')
      } else if (event.key.toLowerCase() === 'e' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        setActiveTab('enhance')
      } else if (event.key.toLowerCase() === 's' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        setActiveTab('summarize')
        handleAction('summarize')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [clipboardText])

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Get screen coordinates instead of client coordinates
    const startX = e.screenX
    const startY = e.screenY
    
    // Initialize drag in main process
    if (window.electronAPI?.startDrag) {
      window.electronAPI.startDrag(startX, startY)
    }
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.screenX - startX
      const deltaY = moveEvent.screenY - startY
      
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

  // Handle horizontal scrolling based on cursor position using transform
  const handleTextMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const element = textDisplayRef.current
    const container = element?.parentElement
    if (!element || !container) return

    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const containerWidth = rect.width

    // Create a temporary element to measure text width
    const tempElement = document.createElement('div')
    tempElement.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      font-size: 12px;
      font-family: inherit;
      white-space: nowrap;
      visibility: hidden;
    `
    tempElement.textContent = clipboardText || 'No text selected'
    document.body.appendChild(tempElement)
    const textWidth = tempElement.offsetWidth
    document.body.removeChild(tempElement)

    if (textWidth <= containerWidth - 16) return // Account for padding

    const scrollThreshold = 20
    const maxScrollSpeed = 2

    // Stop any existing animation
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current)
      scrollAnimationRef.current = null
    }

    let scrollDirection = 0
    let scrollSpeed = 0

    if (mouseX < scrollThreshold) {
      // Scroll left (move text right)
      scrollDirection = 1
      scrollSpeed = maxScrollSpeed * (1 - mouseX / scrollThreshold)
    } else if (mouseX > containerWidth - scrollThreshold) {
      // Scroll right (move text left)
      scrollDirection = -1
      const distanceFromEdge = mouseX - (containerWidth - scrollThreshold)
      scrollSpeed = maxScrollSpeed * (distanceFromEdge / scrollThreshold)
    }

    if (scrollDirection !== 0) {
      let currentTranslate = 0
      const transformMatch = element.style.transform.match(/translateX\((-?\d+(?:\.\d+)?)px\)/)
      if (transformMatch) {
        currentTranslate = parseFloat(transformMatch[1])
      }

      const animateScroll = () => {
        if (!element || !container) return
        
        const newTranslate = currentTranslate + (scrollDirection * scrollSpeed)
        const maxTranslate = 0
        const minTranslate = -(textWidth - (containerWidth - 16)) // Account for padding
        
        const clampedTranslate = Math.max(minTranslate, Math.min(maxTranslate, newTranslate))
        element.style.transform = `translateX(${clampedTranslate}px)`
        currentTranslate = clampedTranslate
        
        // Continue animation if not at the edge
        if ((scrollDirection > 0 && currentTranslate < maxTranslate) || 
            (scrollDirection < 0 && currentTranslate > minTranslate)) {
          scrollAnimationRef.current = requestAnimationFrame(animateScroll)
        }
      }
      
      scrollAnimationRef.current = requestAnimationFrame(animateScroll)
    }
  }

  const stopScrolling = () => {
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current)
      scrollAnimationRef.current = null
    }
  }

  const handleAction = async (action: ActionType, customPrompt?: string) => {
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
      console.log('FloatingOverlay - Updating AI service with settings:', aiSettings)
      aiService.updateConfig(aiSettings)
      
      let result = ''
      if (action === 'translate') {
        const response = await aiService.generateSuggestion({
          text: clipboardText,
          type: 'improve',
          context: `translation_${selectedLanguage}`
        })
        result = response.suggestion
      } else if (customPrompt) {
        // Custom enhancement prompt
        const response = await aiService.generateSuggestion({
          text: clipboardText,
          type: 'improve',
          context: `custom_${customPrompt}`
        })
        result = response.suggestion
      } else {
        const typeMap = {
          translate: 'improve',
          enhance: 'improve',
          summarize: 'summarize'
        }
        
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

  const handleEnhancementCard = async (option: EnhancementOption) => {
    if (!clipboardText.trim() || isProcessing || !aiSettings) return

    setIsProcessing(true)
    setCurrentAction('enhance')
    setAnimationKey(prev => prev + 1)

    try {
      const { aiService } = await import('../utils/aiService')
      aiService.updateConfig(aiSettings)
      
      const response = await aiService.generateSuggestion({
        text: clipboardText,
        type: 'improve',
        context: `enhancement_${option.id}_${option.prompt}`
      })
      
      const result = response.suggestion
      setEnhancementResults(prev => ({ ...prev, [option.id]: result }))
      
      // Auto copy to clipboard
      await navigator.clipboard.writeText(result)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      
    } catch (error) {
      console.error('Enhancement failed:', error)
      setEnhancementResults(prev => ({ ...prev, [option.id]: 'Error processing text.' }))
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
    <div className="w-full h-full flex items-center justify-center p-2 gap-3">
      {/* External Tab Navigation - Vertical */}
      <div className="flex flex-col gap-1">
        {[
          { id: 'translate', icon: Languages, key: 'T', label: 'Translate' },
          { id: 'enhance', icon: Sparkles, key: 'E', label: 'Enhance' },
          { id: 'summarize', icon: FileText, key: 'S', label: 'Summarize' }
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center justify-center p-2 w-8 h-8 rounded-lg transition-all duration-200 ease-out relative group ${
                isActive 
                  ? isDark 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-purple-600 text-white shadow-md'
                  : isDark 
                    ? 'bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-purple-300 hover:bg-purple-900/20' 
                    : 'bg-white/80 border border-gray-200/50 text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              } ${isActive ? 'transform scale-105' : 'hover:transform hover:scale-102'} backdrop-blur-sm`}
              title={`${tab.label} (${tab.key})`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-200`} />
            </button>
          )
        })}
      </div>

      {/* Main Overlay Content */}
      <div className={`w-full max-w-md max-h-[85vh] ${isDark ? 'bg-black/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'} rounded-xl shadow-2xl border ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} flex flex-col overflow-hidden transform transition-all duration-300 ease-out animate-[slideInUp_0.4s_ease-out]`}>
        {/* Draggable Header with Copied Text Card */}
        <div 
          className={`flex items-center p-2 ${isDark ? 'bg-gradient-to-r from-purple-900/30 to-purple-800/40 border-b border-purple-700/50' : 'bg-gradient-to-r from-purple-500/10 to-purple-600/15 border-b border-purple-200/30'} rounded-t-xl cursor-move relative`}
          onMouseDown={handleMouseDown}
          ref={dragRef}
        >
          <div className="flex items-center gap-2 w-full min-w-0">
            <GripHorizontal className={`w-3 h-3 flex-shrink-0 ${isDark ? 'text-purple-400' : 'text-purple-400'}`} />
            <div 
              className={`flex-1 min-w-0 ${isDark ? 'bg-gray-900/60 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded px-2 py-1 text-scroll-container cursor-default`}
              onMouseMove={handleTextMouseMove}
              onMouseLeave={() => {
                stopScrolling()
                // Reset transform when mouse leaves
                if (textDisplayRef.current) {
                  textDisplayRef.current.style.transform = 'translateX(0px)'
                }
              }}
            >
              <div 
                ref={textDisplayRef}
                className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-nowrap text-scroll-content`}
              >
                {clipboardText || 'No text selected'}
              </div>
            </div>
          </div>
        </div>


        <div className="p-3 flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Tab Content Container with smooth transitions */}
          <div className="relative flex-1 min-h-[400px]">
            {/* Translate Tab */}
            <div className={`absolute inset-0 transition-all duration-300 ease-out ${
              activeTab === 'translate' 
                ? 'opacity-100 transform translate-x-0 visible' 
                : 'opacity-0 transform translate-x-4 invisible'
            }`}>
              {activeTab === 'translate' && (
                <div className="h-full flex flex-col justify-between animate-[fadeInSlide_0.4s_ease-out]">
                  {/* Language Selector - Enhanced */}
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Target Language
                    </label>
                    <div className="relative" ref={languageDropdownRef}>
                      <button
                        onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                          isDark 
                            ? 'bg-gray-900/80 border-gray-700 text-gray-300 hover:border-purple-500 hover:bg-gray-800/90' 
                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-purple-400 hover:bg-gray-100'
                        } ${isLanguageDropdownOpen ? 'ring-2 ring-purple-500/50' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{languages.find(lang => lang.code === selectedLanguage)?.flag}</span>
                          <span className="truncate">{languages.find(lang => lang.code === selectedLanguage)?.name}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isLanguageDropdownOpen && (
                        <div className={`absolute top-full left-0 right-0 mt-2 max-h-40 overflow-y-auto scrollbar-thin rounded-lg border shadow-xl z-50 backdrop-blur-sm animate-[dropIn_0.2s_ease-out] ${
                          isDark ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-300'
                        }`}>
                          {languages.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => {
                                setSelectedLanguage(lang.code)
                                setIsLanguageDropdownOpen(false)
                              }}
                              className={`w-full flex items-center gap-3 p-3 text-sm text-left transition-all duration-150 ${
                                selectedLanguage === lang.code
                                  ? isDark ? 'bg-purple-900/60 text-purple-300' : 'bg-purple-100 text-purple-700'
                                  : isDark ? 'text-gray-300 hover:bg-gray-800/80' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span className="text-lg">{lang.flag}</span>
                              <span className="truncate font-medium">{lang.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAction('translate')}
                    disabled={isProcessing || !clipboardText.trim() || !aiSettings?.provider}
                    className={`w-full py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                      isDark 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl' 
                        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl'
                    } disabled:transform-none disabled:hover:scale-100`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Translating...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Languages className="w-4 h-4" />
                        Translate
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Enhance Tab */}
            <div className={`absolute inset-0 transition-all duration-300 ease-out ${
              activeTab === 'enhance' 
                ? 'opacity-100 transform translate-x-0 visible' 
                : 'opacity-0 transform translate-x-4 invisible'
            }`}>
              {activeTab === 'enhance' && (
                <div className="h-full flex flex-col animate-[fadeInSlide_0.4s_ease-out]">
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Enhancement Options
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3 flex-1 content-start">
                    {enhancementOptions.map((option, index) => (
                      <button
                        key={option.id}
                        onClick={() => handleEnhancementCard(option)}
                        disabled={isProcessing || !clipboardText.trim() || !aiSettings?.provider}
                        className={`p-4 rounded-xl border text-left transition-all duration-200 transform hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 animate-[fadeInUp_${0.2 + index * 0.1}s_ease-out] ${
                          isDark 
                            ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/60 border-gray-700/50 hover:border-purple-500/70 text-gray-300 hover:shadow-lg hover:shadow-purple-500/20'
                            : 'bg-gradient-to-br from-white to-gray-50/80 border-gray-200/50 hover:border-purple-400/70 text-gray-700 hover:shadow-lg hover:shadow-purple-500/20'
                        } backdrop-blur-sm`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className={`text-sm font-semibold mb-2 bg-gradient-to-r ${option.color} bg-clip-text text-transparent`}>
                          {option.title}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed mb-2`}>
                          {option.description.substring(0, 25)}...
                        </div>
                        {enhancementResults[option.id] && (
                          <div className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 ${
                            isDark ? 'bg-green-900/30 text-green-400 border border-green-700/50' : 'bg-green-100 text-green-700 border border-green-200'
                          } animate-[bounceIn_0.3s_ease-out]`}>
                            <Check className="w-3 h-3" />
                            Copied!
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Summarize Tab */}
            <div className={`absolute inset-0 transition-all duration-300 ease-out ${
              activeTab === 'summarize' 
                ? 'opacity-100 transform translate-x-0 visible' 
                : 'opacity-0 transform translate-x-4 invisible'
            }`}>
              {activeTab === 'summarize' && (
                <div className="h-full flex flex-col justify-between animate-[fadeInSlide_0.4s_ease-out]">
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Text Summary
                    </label>
                  </div>
                  
                  <div className="flex-1"></div>
                  
                  <button
                    onClick={() => handleAction('summarize')}
                    disabled={isProcessing || !clipboardText.trim() || !aiSettings?.provider}
                    className={`w-full py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                      isDark 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl' 
                        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl'
                    } disabled:transform-none disabled:hover:scale-100`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Summarizing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" />
                        Summarize
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Processing Animation - Enhanced */}
          {isProcessing && (
            <div className="flex items-center justify-center py-4 animate-[pulse_2s_ease-in-out_infinite]">
              <div className={`flex items-center gap-3 px-4 py-2 rounded-full ${
                isDark ? 'bg-purple-900/40 border border-purple-700/50' : 'bg-purple-100/80 border border-purple-200/50'
              } backdrop-blur-sm`}>
                <div className={`${getActionColor(currentAction)} animate-[spin_1s_linear_infinite]`}>
                  {getActionIcon(currentAction)}
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-[bounce_1.4s_infinite] opacity-70"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-[bounce_1.4s_infinite] opacity-70" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-[bounce_1.4s_infinite] opacity-70" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className={`text-sm font-medium ${getActionColor(currentAction)}`}>
                  Processing...
                </span>
              </div>
            </div>
          )}

          {/* Result Card - Enhanced */}
          {processedText && !isProcessing && activeTab !== 'enhance' && (
            <div 
              key={animationKey}
              className={`mt-4 ${
                isDark 
                  ? 'bg-gradient-to-br from-purple-900/50 to-purple-950/70 border border-purple-700/50 shadow-lg shadow-purple-500/20' 
                  : 'bg-gradient-to-br from-purple-50/90 to-purple-100/80 border border-purple-200/60 shadow-lg shadow-purple-500/20'
              } rounded-xl p-4 backdrop-blur-sm animate-[slideInUp_0.5s_ease-out]`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`flex items-center gap-2 ${getActionColor(currentAction)}`}>
                  <div className="p-1.5 rounded-lg bg-current/20">
                    {getActionIcon(currentAction)}
                  </div>
                  <span className="text-sm font-semibold capitalize">{currentAction} Result</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
                    isDark 
                      ? 'bg-gray-900/80 hover:bg-purple-900/60 border border-gray-700/50 hover:border-purple-600/50 text-gray-300 hover:text-purple-300' 
                      : 'bg-white/90 hover:bg-purple-50 border border-gray-200/50 hover:border-purple-300/50 text-gray-700 hover:text-purple-700'
                  } shadow-sm hover:shadow-md`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-800'} leading-relaxed max-h-32 overflow-y-auto scrollbar-thin p-3 rounded-lg ${
                isDark ? 'bg-gray-900/40 border border-gray-700/30' : 'bg-white/60 border border-gray-200/30'
              }`}>
                {processedText}
              </div>
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
  
  @keyframes slideInUp {
    0% {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes fadeInSlide {
    0% {
      opacity: 0;
      transform: translateX(10px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(15px) scale(0.9);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes dropIn {
    0% {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes expandWidth {
    0% {
      width: 0%;
    }
    100% {
      width: 100%;
    }
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

  /* Custom purple scrollbar styles for overlay */
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: rgba(168, 85, 247, 0.7) rgba(0, 0, 0, 0.1);
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 8px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    margin: 2px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.8), rgba(147, 51, 234, 0.9));
    border-radius: 4px;
    border: 1px solid rgba(168, 85, 247, 0.3);
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(168, 85, 247, 0.2);
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, rgba(168, 85, 247, 1), rgba(147, 51, 234, 1));
    border-color: rgba(168, 85, 247, 0.5);
    box-shadow: 0 2px 6px rgba(168, 85, 247, 0.4);
    transform: scale(1.05);
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb:active {
    background: linear-gradient(135deg, rgba(147, 51, 234, 1), rgba(126, 34, 206, 1));
    box-shadow: 0 1px 3px rgba(168, 85, 247, 0.6);
  }

  /* Dark theme scrollbar adjustments */
  .dark .scrollbar-thin::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .dark .scrollbar-thin::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(147, 51, 234, 1));
    border-color: rgba(168, 85, 247, 0.4);
  }

  /* Text card scrolling animation */
  .text-scroll-container {
    position: relative;
    overflow: hidden;
  }
  
  .text-scroll-content {
    transition: transform 0.1s ease-out;
    will-change: transform;
  }
`
document.head.appendChild(style)

export default FloatingOverlayPage