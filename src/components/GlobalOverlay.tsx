import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Zap, History, Loader2, ArrowRight, Sparkles, Languages, FileText, BookOpen, Wand2, List, AlignLeft, Copy, Volume2, ArrowLeftRight, Code, ScrollText, Layers, Plus } from 'lucide-react'
import { cn } from '../utils'
import { aiService, type SuggestionResponse } from '../utils/aiService'
import { useAIToolsStore } from '../store/useAIToolsStore'
import { useAppStore } from '../store/useAppStore'


interface Suggestion {
  id: string
  text: string
  type: 'ai' | 'manual'
  timestamp: Date
}

interface GlobalOverlayProps {
  isVisible: boolean
  position: 'bottom-right' | 'input-overlay'
  inputText: string
  inputPosition: { x: number; y: number } | null
  onClose: () => void
  onApplySuggestion: (suggestion: string) => void
}

type AITool = 'translate' | 'summarize' | 'enhance' | 'recent'

function GlobalOverlay(props: GlobalOverlayProps) {
  const { isVisible, position, inputText, onClose, onApplySuggestion } = props
  const [suggestions, setSuggestions] = useState<SuggestionResponse[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [recentSuggestions, setRecentSuggestions] = useState<Suggestion[]>([])
  const [activeView, setActiveView] = useState<AITool>(() => {
    try {
      const stored = localStorage.getItem('quillwise-active-view')
      return (stored as AITool) || 'translate'
    } catch {
      return 'translate'
    }
  })

  const overlayRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Drag functionality state
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  
  // AI Tools Store
  const {
    translationTool,
    summarizationTool,
    enhancementTool,
    setTranslationInput,
    setSourceLanguage,
    setTargetLanguage,
    swapLanguages,
    translateText,
    setSummarizationInput,
    setSummaryType,
    setSummaryLength,
    summarizeText,
    setEnhancementInput,
    setEnhancementType,
    setTargetTone,
    enhanceText
  } = useAIToolsStore()
  
  const { copyToClipboard, accumulatedText, clearAccumulatedText } = useAppStore()
  
  // Languages for translation
  const languages = [
    { code: 'auto', name: 'Auto Detect', flag: '🌐' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
  ]

  // Debounced AI suggestion generation
  const generateSuggestions = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 3) {
      setSuggestions([])
      return
    }

    setIsGenerating(true)
    try {
      const newSuggestions = await aiService.getMultipleSuggestions(text)
      setSuggestions(newSuggestions)
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
      setSuggestions([])
    } finally {
      setIsGenerating(false)
    }
  }, [])

  // Debounce effect for input text changes
  useEffect(() => {
    if (position === 'input-overlay' && inputText) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      debounceTimeoutRef.current = setTimeout(() => {
        generateSuggestions(inputText)
      }, 500)

      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }
      }
    } else {
      setSuggestions([])
      setIsGenerating(false)
    }
  }, [inputText, position, generateSuggestions])

  // Load recent suggestions
  useEffect(() => {
    const loadRecentSuggestions = () => {
      try {
        const stored = localStorage.getItem('recentSuggestions')
        if (stored) {
          const parsed = JSON.parse(stored)
          setRecentSuggestions(parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })))
        }
      } catch (error) {
        console.error('Failed to load recent suggestions:', error)
      }
    }

    loadRecentSuggestions()
  }, [])

  // Monitor clipboard changes when overlay is open
  useEffect(() => {
    if (!isVisible) return

    let lastClipboardContent = ''
    
    const checkClipboard = async () => {
      try {
        if (window.electronAPI?.getClipboardText) {
          const currentClipboard = await window.electronAPI.getClipboardText()
          
          // If clipboard changed and contains new text, trigger suggestions
          if (currentClipboard && 
              currentClipboard !== lastClipboardContent && 
              currentClipboard !== inputText &&
              currentClipboard.length < 1000) {
            
            lastClipboardContent = currentClipboard
            
            // Auto-generate suggestions for new clipboard content
            if (position === 'input-overlay') {
              generateSuggestions(currentClipboard)
            }
          }
        }
      } catch (error) {
        console.error('Failed to check clipboard:', error)
      }
    }

    // Check clipboard every 500ms when overlay is open
    const clipboardInterval = setInterval(checkClipboard, 500)
    
    return () => {
      clearInterval(clipboardInterval)
    }
  }, [isVisible, position, inputText, generateSuggestions])

  // Save recent suggestions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('recentSuggestions', JSON.stringify(recentSuggestions))
    } catch (error) {
      console.error('Failed to save recent suggestions:', error)
    }
  }, [recentSuggestions])

  // Save active view to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('quillwise-active-view', activeView)
    } catch (error) {
      console.error('Failed to save active view:', error)
    }
  }, [activeView])

  // Handle ESC key to close overlay
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, onClose])

  // Drag functionality - only for header
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only allow dragging from the header (drag-handle class)
    if (!(e.target as Element).closest('.drag-handle')) {
      return
    }
    
    e.preventDefault()
    setIsDragging(true)
    setLastMousePos({ x: e.screenX, y: e.screenY })
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !window.electronAPI) return
    
    const deltaX = e.screenX - lastMousePos.x
    const deltaY = e.screenY - lastMousePos.y
    
    if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
      window.electronAPI.updateOverlayPosition({ x: deltaX, y: deltaY })
      setLastMousePos({ x: e.screenX, y: e.screenY })
    }
  }, [isDragging, lastMousePos])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Helper functions for AI tools
  const handleClose = async () => {
    try {
      await window.electronAPI.hideGlobalOverlay()
      onClose()
    } catch (error) {
      console.error('Failed to hide overlay:', error)
    }
  }

  const getRecentSuggestions = (): string[] => {
    try {
      const stored = localStorage.getItem('recentSuggestions')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get recent suggestions:', error)
      return []
    }
  }

  const handleApplySuggestion = async (suggestion: string) => {
    try {
      const success = await window.electronAPI.sendTextToActiveWindow(suggestion)
      if (success) {
        const recent = getRecentSuggestions()
        const updated = [suggestion, ...recent.filter(s => s !== suggestion)].slice(0, 10)
        localStorage.setItem('recentSuggestions', JSON.stringify(updated))
        
        const newSuggestion: Suggestion = {
          id: Date.now().toString(),
          text: suggestion,
          type: 'ai',
          timestamp: new Date()
        }
        setRecentSuggestions(prev => [newSuggestion, ...prev.slice(0, 9)])
        
        onApplySuggestion(suggestion)
        await window.electronAPI.hideGlobalOverlay()
      }
    } catch (error) {
      console.error('Failed to apply suggestion:', error)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await copyToClipboard(text)
      await window.electronAPI.sendTextToActiveWindow(text)
      
      // Clear any text selection to prevent visual glitch
      if (window.getSelection) {
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
        }
      }
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }
  
  const handleSpeak = (text: string, lang: string) => {
    if ('speechSynthesis' in window && text) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang === 'auto' ? 'en-US' : `${lang}-${lang.toUpperCase()}`
      speechSynthesis.speak(utterance)
    }
  }
  
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }
  
  // Initialize input text when overlay opens and auto-populate based on active view
  useEffect(() => {
    if (isVisible && inputText && position === 'input-overlay') {
      // Always populate all tools with detected text
      setTranslationInput(inputText)
      setSummarizationInput(inputText)
      setEnhancementInput(inputText)
      
      // Auto-generation removed - users must manually trigger AI tools
    }
  }, [isVisible, inputText, position, activeView, translateText, summarizeText, enhanceText, setTranslationInput, setSummarizationInput, setEnhancementInput])
  
  // Auto-populate inputs when switching tabs (if there's detected text)
  useEffect(() => {
    if (inputText && position === 'input-overlay') {
      // Re-populate the current tool with detected text when tab switches
      if (activeView === 'translate' && !translationTool.inputText) {
        setTranslationInput(inputText)
      } else if (activeView === 'summarize' && !summarizationTool.inputText) {
        setSummarizationInput(inputText)
      } else if (activeView === 'enhance' && !enhancementTool.inputText) {
        setEnhancementInput(inputText)
      }
    }
  }, [activeView, inputText, position, translationTool.inputText, summarizationTool.inputText, enhancementTool.inputText, setTranslationInput, setSummarizationInput, setEnhancementInput])

  const getOverlayContainerStyle = () => {
    return {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 2147483647,
      backgroundColor: 'transparent'
    }
  }

  const getOverlayContentStyle = () => {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // Responsive width and height
    const overlayWidth = Math.min(420, screenWidth - 40) // Max 420px, with 20px margin on each side
    const overlayHeight = Math.min(480, screenHeight - 80) // Max 480px, with 40px margin top/bottom
    
    if (position === 'bottom-right') {
      return {
        position: 'absolute' as const,
        bottom: '20px',
        right: '20px',
        width: `${overlayWidth}px`,
        height: `${overlayHeight}px`
      }
    } else {
      // Always center when input overlay
      return {
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${overlayWidth}px`,
        height: `${overlayHeight}px`
      }
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isVisible) return null

  return (
    <div
      ref={overlayRef}
      className="bg-black/20 backdrop-blur-sm"
      style={getOverlayContainerStyle()}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden transition-all duration-300 ease-out flex flex-col ${isDragging ? 'cursor-grabbing' : 'cursor-auto'}`}
        style={getOverlayContentStyle()}
        onMouseDown={handleMouseDown}
      >
        {/* Context Suggestion Banner */}


        {/* Header with tabs - Only this part is draggable */}
        <div className="p-3 border-b border-gray-700/50 drag-handle cursor-move flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveView('all')}
                className={cn(
                  "w-10 h-10 rounded-lg transition-all flex items-center justify-center",
                  activeView === 'all'
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                )}
                title="All Tools"
              >
                <Layers className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveView('translate')}
                className={cn(
                  "w-10 h-10 rounded-lg transition-all flex items-center justify-center",
                  activeView === 'translate'
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                )}
                title="Translate"
              >
                <Languages className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveView('summarize')}
                className={cn(
                  "w-10 h-10 rounded-lg transition-all flex items-center justify-center",
                  activeView === 'summarize'
                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                )}
                title="Summarize"
              >
                <ScrollText className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveView('enhance')}
                className={cn(
                  "w-10 h-10 rounded-lg transition-all flex items-center justify-center",
                  activeView === 'enhance'
                    ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                )}
                title="Enhance"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
            
            {/* Right side buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('recent')}
                className={cn(
                  "w-8 h-8 rounded-lg transition-all flex items-center justify-center",
                  activeView === 'recent'
                    ? "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"
                )}
                title="Recent"
              >
                <History className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="p-4 flex-1 overflow-y-auto">
          {activeView === 'translate' && (
            <div className="space-y-4">
              {/* Language Selection */}
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={translationTool.sourceLanguage}
                      onChange={(e) => setSourceLanguage(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm bg-gray-800/50 border border-gray-600 rounded text-gray-200 focus:border-blue-500"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                    
                    <button
                      onClick={swapLanguages}
                      disabled={translationTool.sourceLanguage === 'auto'}
                      className="p-2 rounded bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 disabled:opacity-50"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>
                    
                    <select
                      value={translationTool.targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm bg-gray-800/50 border border-gray-600 rounded text-gray-200 focus:border-blue-500"
                    >
                      {languages.filter(lang => lang.code !== 'auto').map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
              {/* Input Text */}
                  <div>
                    <textarea
                      value={translationTool.inputText}
                      onChange={(e) => setTranslationInput(e.target.value)}
                      placeholder="Enter text to translate..."
                      className="w-full h-28 p-3 text-sm bg-gray-800/50 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:border-blue-500 resize-none"
                    />
                    
                    <button
                      onClick={translateText}
                      disabled={!translationTool.inputText.trim() || translationTool.isTranslating}
                      className="w-full mt-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      {translationTool.isTranslating ? (
                        <><Loader2 className="w-3 h-3 inline mr-2 animate-spin" />Translating...</>
                      ) : (
                        <><Languages className="w-3 h-3 inline mr-2" />Translate</>
                      )}
                    </button>
                  </div>
                  
              {/* Translation Result */}
                  {translationTool.translatedText && (
                    <div className="p-3 bg-gray-800/30 border border-gray-600 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Translation:</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSpeak(translationTool.translatedText, translationTool.targetLanguage)}
                            className="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-gray-300"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleCopy(translationTool.translatedText)}
                            className="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-gray-300"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed">
                        {translationTool.translatedText}
                      </p>
                    </div>
                  )}
                </div>
          )}
          
          {activeView === 'summarize' && (
            <div className="space-y-4">
              {/* Summary Options */}
                  <div>
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {[
                        { id: 'brief', label: 'Brief', icon: Zap },
                        { id: 'detailed', label: 'Detailed', icon: AlignLeft },
                        { id: 'bullet', label: 'Bullets', icon: List },
                        { id: 'key-points', label: 'Key Points', icon: FileText }
                      ].map((type) => {
                        const IconComponent = type.icon
                        return (
                          <button
                            key={type.id}
                            onClick={() => setSummaryType(type.id as any)}
                            className={cn(
                              "p-2 text-xs rounded border transition-colors",
                              summarizationTool.summaryType === type.id
                                ? "bg-green-500/20 border-green-500/30 text-green-300"
                                : "bg-gray-800/30 border-gray-600 text-gray-400 hover:border-green-500/30"
                            )}
                          >
                            <IconComponent className="w-3 h-3 inline mr-1" />
                            {type.label}
                          </button>
                        )
                      })}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'short', label: 'Short' },
                        { id: 'medium', label: 'Medium' },
                        { id: 'long', label: 'Long' }
                      ].map((length) => (
                        <button
                          key={length.id}
                          onClick={() => setSummaryLength(length.id as any)}
                          className={cn(
                            "p-1.5 text-xs rounded border transition-colors",
                            summarizationTool.summaryLength === length.id
                              ? "bg-green-500/20 border-green-500/30 text-green-300"
                              : "bg-gray-800/30 border-gray-600 text-gray-400 hover:border-green-500/30"
                          )}
                        >
                          {length.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
              {/* Input Text */}
                  <div>
                    <textarea
                      value={summarizationTool.inputText}
                      onChange={(e) => setSummarizationInput(e.target.value)}
                      placeholder="Paste your text to summarize..."
                      className="w-full h-28 p-3 text-sm bg-gray-800/50 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:border-green-500 resize-none"
                    />
                    
                    <button
                      onClick={summarizeText}
                      disabled={!summarizationTool.inputText.trim() || summarizationTool.isSummarizing}
                      className="w-full mt-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      {summarizationTool.isSummarizing ? (
                        <><Loader2 className="w-3 h-3 inline mr-2 animate-spin" />Summarizing...</>
                      ) : (
                        <><ScrollText className="w-3 h-3 inline mr-2" />Generate Summary</>
                      )}
                    </button>
                  </div>
                  
              {/* Summary Result */}
                  {summarizationTool.summary && (
                    <div className="p-3 bg-gray-800/30 border border-gray-600 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Summary ({getWordCount(summarizationTool.summary)} words):</span>
                        <button
                          onClick={() => handleCopy(summarizationTool.summary)}
                          className="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-gray-300"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                        {summarizationTool.summary}
                      </div>
                    </div>
                  )}
                </div>
          )}
          
          {activeView === 'enhance' && (
            <div className="space-y-4">
              {/* Enhancement Options */}
                  <div>
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {[
                        { id: 'grammar', label: 'Grammar', icon: BookOpen },
                        { id: 'style', label: 'Style', icon: Wand2 },
                        { id: 'tone', label: 'Tone', icon: Sparkles },
                        { id: 'clarity', label: 'Clarity', icon: Zap }
                      ].map((type) => {
                        const IconComponent = type.icon
                        return (
                          <button
                            key={type.id}
                            onClick={() => setEnhancementType(type.id as any)}
                            className={cn(
                              "p-2 text-xs rounded border transition-colors",
                              enhancementTool.enhancementType === type.id
                                ? "bg-orange-500/20 border-orange-500/30 text-orange-300"
                                : "bg-gray-800/30 border-gray-600 text-gray-400 hover:border-orange-500/30"
                            )}
                          >
                            <IconComponent className="w-3 h-3 inline mr-1" />
                            {type.label}
                          </button>
                        )
                      })}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { id: 'professional', label: 'Professional' },
                        { id: 'casual', label: 'Casual' },
                        { id: 'academic', label: 'Academic' },
                        { id: 'creative', label: 'Creative' }
                      ].map((tone) => (
                        <button
                          key={tone.id}
                          onClick={() => setTargetTone(tone.id as any)}
                          className={cn(
                            "p-1.5 text-xs rounded border transition-colors",
                            enhancementTool.targetTone === tone.id
                              ? "bg-orange-500/20 border-orange-500/30 text-orange-300"
                              : "bg-gray-800/30 border-gray-600 text-gray-400 hover:border-orange-500/30"
                          )}
                        >
                          {tone.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
              {/* Input Text */}
                  <div>
                    <textarea
                      value={enhancementTool.inputText}
                      onChange={(e) => setEnhancementInput(e.target.value)}
                      placeholder="Paste your text to enhance..."
                      className="w-full h-28 p-3 text-sm bg-gray-800/50 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:border-orange-500 resize-none"
                    />
                    
                    <button
                      onClick={enhanceText}
                      disabled={!enhancementTool.inputText.trim() || enhancementTool.isEnhancing}
                      className="w-full mt-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 rounded text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      {enhancementTool.isEnhancing ? (
                        <><Loader2 className="w-3 h-3 inline mr-2 animate-spin" />Enhancing...</>
                      ) : (
                        <><Sparkles className="w-3 h-3 inline mr-2" />Enhance Text</>
                      )}
                    </button>
                  </div>
                  
              {/* Enhancement Result */}
                  {enhancementTool.enhancedText && (
                    <div className="p-3 bg-gray-800/30 border border-gray-600 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Enhanced ({getWordCount(enhancementTool.enhancedText)} words):</span>
                        <button
                          onClick={() => handleCopy(enhancementTool.enhancedText)}
                          className="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-gray-300"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-gray-200 text-sm leading-relaxed">
                        {enhancementTool.enhancedText}
                      </div>
                    </div>
                  )}
            </div>
          )}
              
              
              {activeView === 'recent' && (
            <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                  
              {/* Recent AI Suggestions */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-purple-300 mb-2">✨ Quick Suggestions</h4>
                    {recentSuggestions.length > 0 ? (
                      recentSuggestions.slice(0, 3).map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleApplySuggestion(suggestion.text)}
                          className="w-full group p-2 bg-gray-800/30 hover:bg-purple-500/10 rounded-lg border border-gray-700/50 hover:border-purple-500/30 transition-all duration-200"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-1 text-left">
                              <p className="text-gray-200 text-xs truncate">
                                {suggestion.text}
                              </p>
                            </div>
                            <ArrowRight className="w-3 h-3 text-gray-500 group-hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100" />
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-gray-400 text-xs">No recent suggestions</p>
                    )}
                  </div>
                  
              {/* Translation History */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-300 mb-2">🌐 Translations</h4>
                    {translationTool.history.length > 0 ? (
                      translationTool.history.slice(0, 3).map((item, index) => (
                        <div
                          key={index}
                          className="p-2 bg-gray-800/30 rounded-lg border border-gray-700/50"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-blue-400">
                              {item.from} → {item.to}
                            </span>
                            <button
                              onClick={() => handleCopy(item.output)}
                              className="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-blue-300"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-gray-200 text-xs truncate">{item.output}</p>
                          <p className="text-gray-400 text-xs mt-1 truncate">From: {item.input}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-xs">No translation history</p>
                    )}
                  </div>
                  
              {/* Summarization History */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-green-300 mb-2">📄 Summaries</h4>
                    {summarizationTool.history.length > 0 ? (
                      summarizationTool.history.slice(0, 3).map((item, index) => (
                        <div
                          key={index}
                          className="p-2 bg-gray-800/30 rounded-lg border border-gray-700/50"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-green-400 capitalize">
                              {item.type} • {item.length}
                            </span>
                            <button
                              onClick={() => handleCopy(item.output)}
                              className="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-green-300"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-gray-200 text-xs line-clamp-2">{item.output}</p>
                          <p className="text-gray-400 text-xs mt-1 truncate">
                            Original: {item.input.slice(0, 50)}...
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-xs">No summary history</p>
                    )}
                  </div>
                  
              {/* Enhancement History */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-orange-300 mb-2">✨ Enhancements</h4>
                    {enhancementTool.history.length > 0 ? (
                      enhancementTool.history.slice(0, 3).map((item, index) => (
                        <div
                          key={index}
                          className="p-2 bg-gray-800/30 rounded-lg border border-gray-700/50"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-orange-400 capitalize">
                              {item.type} • {item.tone}
                            </span>
                            <button
                              onClick={() => handleCopy(item.output)}
                              className="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-orange-300"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-gray-200 text-xs line-clamp-2">{item.output}</p>
                          <p className="text-gray-400 text-xs mt-1 truncate">
                            Original: {item.input.slice(0, 50)}...
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-xs">No enhancement history</p>
                    )}
                  </div>
                  
              {/* Empty state when no history exists */}
                  {recentSuggestions.length === 0 && 
                   translationTool.history.length === 0 && 
                   summarizationTool.history.length === 0 && 
                   enhancementTool.history.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto bg-gray-800/50 rounded-xl flex items-center justify-center mb-3">
                        <History className="w-6 h-6 text-gray-500" />
                      </div>
                      <p className="text-gray-400 text-sm">
                        No activity yet
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Start using AI tools to see your history here
                      </p>
                    </div>
                  )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GlobalOverlay