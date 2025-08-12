import { useState, useEffect, useRef, useCallback } from 'react'
import { X, MessageSquare, Clock, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '../utils'
import { aiService, type SuggestionResponse } from '../utils/aiService'

interface FloatingOverlayProps {
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

function FloatingOverlay({
  isVisible,
  position,
  inputText = '',
  inputPosition = { x: 0, y: 0 },
  onClose,
  onApplySuggestion
}: FloatingOverlayProps) {
  const [activeTab, setActiveTab] = useState<'suggestion' | 'recent'>('suggestion')
  const [suggestions, setSuggestions] = useState<SuggestionResponse[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [recentSuggestions, setRecentSuggestions] = useState<Suggestion[]>([])
  const overlayRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

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
      // Clear previous timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        generateSuggestions(inputText)
      }, 500) // 500ms debounce

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
        window.innerHeight - 410
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
    // Add to recent suggestions if it's from AI
    if (suggestions.some(s => s.suggestion === text)) {
      const newSuggestion: Suggestion = {
        id: Date.now().toString(),
        text: text,
        type: 'ai',
        timestamp: new Date()
      }
      setRecentSuggestions(prev => [newSuggestion, ...prev.slice(0, 4)])
    }
    
    onApplySuggestion(text)
    onClose()
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
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {position === 'bottom-right' ? 'Please select an input box' : 'AI Assistant'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {position === 'bottom-right' ? (
          // Bottom-right overlay content
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click on any text input field to get AI-powered suggestions.
            </p>
            
            {/* Recent suggestions tab */}
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
        ) : (
          // Input overlay content
          <div className="space-y-3">
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded p-1">
              <button
                onClick={() => setActiveTab('suggestion')}
                className={cn(
                  'flex-1 px-2 py-1 text-xs font-medium rounded transition-colors',
                  activeTab === 'suggestion'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                <MessageSquare className="h-3 w-3 inline mr-1" />
                AI Suggestion
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={cn(
                  'flex-1 px-2 py-1 text-xs font-medium rounded transition-colors',
                  activeTab === 'recent'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                <Clock className="h-3 w-3 inline mr-1" />
                Recent
              </button>
            </div>

            {/* Tab content */}
            <div className="min-h-[100px] max-h-[350px] overflow-y-auto">
              {activeTab === 'suggestion' ? (
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
                      Type more text to get AI suggestions
                    </p>
                  )}
                </div>
              ) : (
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FloatingOverlay