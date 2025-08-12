import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Edit3, Clock, Type, Loader2, Languages, FileText, BookOpen, Wand2, List, AlignLeft, ArrowLeftRight, Send } from 'lucide-react'
import { cn } from '../utils'
import { aiService, type SuggestionResponse } from '../utils/aiService'
import { useAIToolsStore } from '../store/useAIToolsStore'

interface EnhancedFloatingOverlayProps {
  isVisible: boolean
  position: 'bottom-right' | 'input-overlay'
  inputText?: string
  inputPosition?: { x: number; y: number }
  onClose: () => void
  onApplySuggestion: (suggestion: string) => void
}

interface Suggestion {
  id: string
  text: string
  type: 'ai' | 'manual'
  timestamp: Date
}

function EnhancedFloatingOverlay({
  isVisible,
  position,
  inputText = '',
  inputPosition = { x: 0, y: 0 },
  onClose,
  onApplySuggestion
}: EnhancedFloatingOverlayProps) {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'generate' | 'translate' | 'summarize' | 'enhance' | 'recent'>('suggestions')
  const [suggestions, setSuggestions] = useState<SuggestionResponse[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [recentSuggestions, setRecentSuggestions] = useState<Suggestion[]>([])
  const [tempInputText, setTempInputText] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  
  const aiToolsStore = useAIToolsStore()

  // Languages for translation
  const languages = [
    { code: 'auto', name: 'Auto Detect', flag: '🌐' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
  ]

  // Initialize temp input text when input changes
  useEffect(() => {
    if (inputText && activeTab !== 'suggestions') {
      setTempInputText(inputText)
    }
  }, [inputText, activeTab])

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
    if (position === 'input-overlay' && inputText && activeTab === 'suggestions') {
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
    } else if (activeTab === 'suggestions') {
      setSuggestions([])
      setIsGenerating(false)
    }
  }, [inputText, position, generateSuggestions, activeTab])

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

  // Save recent suggestions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('recentSuggestions', JSON.stringify(recentSuggestions))
    } catch (error) {
      console.error('Failed to save recent suggestions:', error)
    }
  }, [recentSuggestions])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  const getOverlayPosition = () => {
    if (position === 'bottom-right') {
      return {
        position: 'fixed' as const,
        bottom: '20px',
        right: '20px',
        zIndex: 2147483647
      }
    } else {
      const safeTop = Math.max(10, Math.min(
        inputPosition.y - 10, 
        window.innerHeight - 420
      ))
      const safeLeft = Math.max(10, Math.min(
        inputPosition.x, 
        window.innerWidth - 330
      ))
      
      return {
        position: 'fixed' as const,
        left: `${safeLeft}px`,
        top: `${safeTop}px`,
        transform: 'translateY(-100%)',
        zIndex: 2147483647
      }
    }
  }

  const handleApplySuggestion = (text: string) => {
    // Add to recent suggestions
    const newSuggestion: Suggestion = {
      id: Date.now().toString(),
      text: text,
      type: 'ai',
      timestamp: new Date()
    }
    setRecentSuggestions(prev => [newSuggestion, ...prev.slice(0, 9)])
    
    onApplySuggestion(text)
    onClose()
  }

  const handleProcessWithAI = async (tool: 'generate' | 'translate' | 'summarize' | 'enhance') => {
    const text = tempInputText || inputText
    if (!text.trim()) return

    switch (tool) {
      case 'generate':
        aiToolsStore.setPromptInput(text)
        await aiToolsStore.generatePrompt()
        if (aiToolsStore.promptTool.generatedPrompt) {
          handleApplySuggestion(aiToolsStore.promptTool.generatedPrompt)
        }
        break
      case 'translate':
        aiToolsStore.setTranslationInput(text)
        await aiToolsStore.translateText()
        if (aiToolsStore.translationTool.translatedText) {
          handleApplySuggestion(aiToolsStore.translationTool.translatedText)
        }
        break
      case 'summarize':
        aiToolsStore.setSummarizationInput(text)
        await aiToolsStore.summarizeText()
        if (aiToolsStore.summarizationTool.summary) {
          handleApplySuggestion(aiToolsStore.summarizationTool.summary)
        }
        break
      case 'enhance':
        aiToolsStore.setEnhancementInput(text)
        await aiToolsStore.enhanceText()
        if (aiToolsStore.enhancementTool.enhancedText) {
          handleApplySuggestion(aiToolsStore.enhancementTool.enhancedText)
        }
        break
    }
  }

  const renderTabContent = () => {
    if (position === 'bottom-right') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click on any text input field to get AI-powered suggestions and tools.
          </p>
          
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Recent Suggestions
            </h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {recentSuggestions.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleApplySuggestion(suggestion.text)}
                  className="w-full text-left p-2 text-xs bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <div className="truncate text-gray-900 dark:text-gray-100">
                    {suggestion.text}
                  </div>
                </button>
              ))}
              {recentSuggestions.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  No recent suggestions
                </p>
              )}
            </div>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case 'suggestions':
        return (
          <div>
            {isGenerating ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Generating...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleApplySuggestion(suggestion.suggestion)}
                    className="w-full text-left p-2 text-xs bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-800 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-gray-900 dark:text-gray-100 flex-1">
                        {suggestion.suggestion}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                      {suggestion.type}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic py-4 text-center">
                Type text to get suggestions
              </p>
            )}
          </div>
        )

      case 'generate':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Content Type
              </label>
              <select
                value={aiToolsStore.promptTool.promptType}
                onChange={(e) => aiToolsStore.setPromptType(e.target.value as any)}
                className="w-full text-xs p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-slate-500"
              >
                <option value="creative">Creative Writing</option>
                <option value="analytical">Analysis</option>
                <option value="conversational">Conversational</option>
                <option value="technical">Technical</option>
              </select>
            </div>
            <div>
              <textarea
                value={tempInputText}
                onChange={(e) => setTempInputText(e.target.value)}
                placeholder="Describe the content you need..."
                className="w-full h-20 p-2 text-xs border border-gray-300 dark:border-gray-600 rounded resize-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
            <button
              onClick={() => handleProcessWithAI('generate')}
              disabled={!tempInputText.trim() || aiToolsStore.promptTool.isGenerating}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs disabled:opacity-50"
            >
              {aiToolsStore.promptTool.isGenerating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        )

      case 'translate':
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <select
                value={aiToolsStore.translationTool.sourceLanguage}
                onChange={(e) => aiToolsStore.setSourceLanguage(e.target.value)}
                className="flex-1 text-xs p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => aiToolsStore.swapLanguages()}
                disabled={aiToolsStore.translationTool.sourceLanguage === 'auto'}
                className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                <ArrowLeftRight className="h-3 w-3" />
              </button>
              <select
                value={aiToolsStore.translationTool.targetLanguage}
                onChange={(e) => aiToolsStore.setTargetLanguage(e.target.value)}
                className="flex-1 text-xs p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500"
              >
                {languages.filter(lang => lang.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={tempInputText}
              onChange={(e) => setTempInputText(e.target.value)}
              placeholder="Enter text to translate..."
              className="w-full h-20 p-2 text-xs border border-gray-300 dark:border-gray-600 rounded resize-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => handleProcessWithAI('translate')}
              disabled={!tempInputText.trim() || aiToolsStore.translationTool.isTranslating}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs disabled:opacity-50"
            >
              {aiToolsStore.translationTool.isTranslating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <Languages className="h-3 w-3" />
                  <span>Translate</span>
                </>
              )}
            </button>
          </div>
        )

      case 'summarize':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'brief', label: 'Brief', icon: Type },
                { id: 'detailed', label: 'Detailed', icon: AlignLeft },
                { id: 'bullet', label: 'Bullets', icon: List }
              ].map((type) => {
                const IconComponent = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => aiToolsStore.setSummaryType(type.id as any)}
                    className={cn(
                      'p-2 text-xs rounded transition-colors',
                      aiToolsStore.summarizationTool.summaryType === type.id
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    <IconComponent className="h-3 w-3 mx-auto mb-1" />
                    {type.label}
                  </button>
                )
              })}
            </div>
            <textarea
              value={tempInputText}
              onChange={(e) => setTempInputText(e.target.value)}
              placeholder="Enter text to summarize..."
              className="w-full h-20 p-2 text-xs border border-gray-300 dark:border-gray-600 rounded resize-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={() => handleProcessWithAI('summarize')}
              disabled={!tempInputText.trim() || aiToolsStore.summarizationTool.isSummarizing}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs disabled:opacity-50"
            >
              {aiToolsStore.summarizationTool.isSummarizing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Summarizing...</span>
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3" />
                  <span>Summarize</span>
                </>
              )}
            </button>
          </div>
        )

      case 'enhance':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-1">
              {[
                { id: 'grammar', label: 'Grammar', icon: BookOpen },
                { id: 'style', label: 'Style', icon: Wand2 },
                { id: 'tone', label: 'Tone', icon: Edit3 },
                { id: 'clarity', label: 'Clarity', icon: Type }
              ].map((type) => {
                const IconComponent = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => aiToolsStore.setEnhancementType(type.id as any)}
                    className={cn(
                      'p-2 text-xs rounded transition-colors',
                      aiToolsStore.enhancementTool.enhancementType === type.id
                        ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    <IconComponent className="h-3 w-3 mx-auto mb-1" />
                    {type.label}
                  </button>
                )
              })}
            </div>
            <textarea
              value={tempInputText}
              onChange={(e) => setTempInputText(e.target.value)}
              placeholder="Enter text to enhance..."
              className="w-full h-20 p-2 text-xs border border-gray-300 dark:border-gray-600 rounded resize-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              onClick={() => handleProcessWithAI('enhance')}
              disabled={!tempInputText.trim() || aiToolsStore.enhancementTool.isEnhancing}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded text-xs disabled:opacity-50"
            >
              {aiToolsStore.enhancementTool.isEnhancing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Enhancing...</span>
                </>
              ) : (
                <>
                  <Edit3 className="h-3 w-3" />
                  <span>Enhance</span>
                </>
              )}
            </button>
          </div>
        )

      case 'recent':
        return (
          <div className="space-y-1">
            {recentSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleApplySuggestion(suggestion.text)}
                className="w-full text-left p-2 text-xs bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
              >
                <div className="truncate text-gray-900 dark:text-gray-100">
                  {suggestion.text}
                </div>
              </button>
            ))}
            {recentSuggestions.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic py-4 text-center">
                No recent suggestions
              </p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div
      ref={overlayRef}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-80 min-h-[200px] max-h-[500px] overflow-hidden"
      style={getOverlayPosition()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Edit3 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {position === 'bottom-right' ? 'QuillWise' : 'Writing Tools'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Tab Navigation - Only for input overlay */}
      {position === 'input-overlay' && (
        <div className="px-3 pt-3">
          <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-700 rounded p-1">
            {[
              { id: 'suggestions', label: 'Suggest', icon: Type },
              { id: 'generate', label: 'Generate', icon: Edit3 },
              { id: 'translate', label: 'Translate', icon: Languages },
              { id: 'summarize', label: 'Summary', icon: FileText },
              { id: 'enhance', label: 'Enhance', icon: Edit3 },
              { id: 'recent', label: 'Recent', icon: Clock }
            ].map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded transition-colors',
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <IconComponent className="h-3 w-3 inline mr-1" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        <div className="min-h-[100px] max-h-[380px] overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default EnhancedFloatingOverlay