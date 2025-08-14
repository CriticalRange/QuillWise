import React, { useState, useEffect } from 'react'
import { Copy, RefreshCw, ArrowLeftRight, Languages, Sparkles, FileText, Wand2 } from 'lucide-react'
import { aiService } from '../utils/aiService'
import { useSettingsStore } from '../store/useSettingsStore'

interface Language {
  code: string
  name: string
  flag: string
}

type ActiveTab = 'translate' | 'enhance' | 'summarize'

const AIToolsPage: React.FC = () => {
  const { settings } = useSettingsStore()
  const [activeTab, setActiveTab] = useState<ActiveTab>('translate')
  const [isDark, setIsDark] = useState(false)
  
  // Translation state
  const [translateInput, setTranslateInput] = useState('')
  const [translateOutput, setTranslateOutput] = useState('')
  const [sourceLanguage, setSourceLanguage] = useState('auto')
  const [targetLanguage, setTargetLanguage] = useState('tr')
  const [isTranslating, setIsTranslating] = useState(false)
  
  // Enhancement state  
  const [enhanceInput, setEnhanceInput] = useState('')
  const [enhanceOutput, setEnhanceOutput] = useState('')
  const [enhanceType, setEnhanceType] = useState('formal')
  const [isEnhancing, setIsEnhancing] = useState(false)
  
  // Summarization state
  const [summarizeInput, setSummarizeInput] = useState('')
  const [summarizeOutput, setSummarizeOutput] = useState('')
  const [summaryLength, setSummaryLength] = useState('medium')
  const [isSummarizing, setIsSummarizing] = useState(false)

  const languages: Language[] = [
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
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' }
  ]

  const enhancementTypes = [
    { id: 'formal', name: 'Formal', description: 'Professional and formal tone' },
    { id: 'casual', name: 'Casual', description: 'Friendly and conversational' },
    { id: 'concise', name: 'Concise', description: 'Brief and to the point' },
    { id: 'creative', name: 'Creative', description: 'Add creativity and flair' }
  ]

  const summaryLengths = [
    { id: 'brief', name: 'Brief', description: 'Very short summary' },
    { id: 'medium', name: 'Medium', description: 'Balanced length' },
    { id: 'detailed', name: 'Detailed', description: 'Comprehensive summary' }
  ]

  // Detect dark theme
  useEffect(() => {
    const detectTheme = () => {
      if (settings.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setIsDark(prefersDark)
      } else {
        setIsDark(settings.theme === 'dark')
      }
    }
    
    detectTheme()
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', detectTheme)
    
    return () => mediaQuery.removeEventListener('change', detectTheme)
  }, [settings.theme])

  // Handle translation
  const handleTranslate = async () => {
    if (!translateInput.trim() || isTranslating || !settings.aiSettings) return
    
    setIsTranslating(true)
    try {
      aiService.updateConfig(settings.aiSettings)
      
      const response = await aiService.generateSuggestion({
        text: translateInput,
        type: 'improve',
        context: `translation_${targetLanguage}`
      })
      
      setTranslateOutput(response.suggestion)
    } catch (error) {
      console.error('Translation failed:', error)
      setTranslateOutput('Translation failed. Please check your AI settings.')
    } finally {
      setIsTranslating(false)
    }
  }

  // Handle enhancement
  const handleEnhance = async () => {
    if (!enhanceInput.trim() || isEnhancing || !settings.aiSettings) return
    
    setIsEnhancing(true)
    try {
      aiService.updateConfig(settings.aiSettings)
      
      const enhancePrompts = {
        formal: 'Rewrite this text in a formal, professional tone suitable for business communication',
        casual: 'Rewrite this text in a friendly, warm, and approachable tone',
        concise: 'Make this text more concise and brief while keeping all key information',
        creative: 'Rewrite this text in a more creative and engaging way, adding some flair and personality'
      }
      
      const response = await aiService.generateSuggestion({
        text: enhanceInput,
        type: 'improve',
        context: `custom_${enhancePrompts[enhanceType as keyof typeof enhancePrompts]}`
      })
      
      setEnhanceOutput(response.suggestion)
    } catch (error) {
      console.error('Enhancement failed:', error)
      setEnhanceOutput('Enhancement failed. Please check your AI settings.')
    } finally {
      setIsEnhancing(false)
    }
  }

  // Handle summarization
  const handleSummarize = async () => {
    if (!summarizeInput.trim() || isSummarizing || !settings.aiSettings) return
    
    setIsSummarizing(true)
    try {
      aiService.updateConfig(settings.aiSettings)
      
      const lengthPrompts = {
        brief: 'Summarize this text in 1-2 sentences, keeping only the most essential points',
        medium: 'Summarize this text concisely while keeping the key points',
        detailed: 'Create a comprehensive summary that covers all important aspects of this text'
      }
      
      const response = await aiService.generateSuggestion({
        text: summarizeInput,
        type: 'summarize',
        context: `custom_${lengthPrompts[summaryLength as keyof typeof lengthPrompts]}`
      })
      
      setSummarizeOutput(response.suggestion)
    } catch (error) {
      console.error('Summarization failed:', error)
      setSummarizeOutput('Summarization failed. Please check your AI settings.')
    } finally {
      setIsSummarizing(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    if (!text) return
    
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Swap languages for translation
  const swapLanguages = () => {
    if (sourceLanguage === 'auto') return
    
    setSourceLanguage(targetLanguage)
    setTargetLanguage(sourceLanguage)
    setTranslateInput(translateOutput)
    setTranslateOutput(translateInput)
  }

  const tabs = [
    { id: 'translate', label: 'Translation', icon: Languages, color: 'blue' },
    { id: 'enhance', label: 'Enhancement', icon: Sparkles, color: 'purple' },
    { id: 'summarize', label: 'Summarization', icon: FileText, color: 'green' }
  ]

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <Wand2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              AI Tools
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Translate, enhance, and summarize text with AI precision
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? `bg-${tab.color}-100 text-${tab.color}-700 dark:bg-${tab.color}-900/30 dark:text-${tab.color}-300`
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Translation Tab */}
        {activeTab === 'translate' && (
          <div className="h-full">
            {/* Language Selection */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center space-x-6">
                <div className="flex-1 max-w-xs">
                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={swapLanguages}
                  disabled={sourceLanguage === 'auto'}
                  className="p-3 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                >
                  <ArrowLeftRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </button>
                
                <div className="flex-1 max-w-xs">
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {languages.filter(lang => lang.code !== 'auto').map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Translation Content */}
            <div className="h-full flex">
              <div className="w-1/2 p-6 border-r border-gray-200 dark:border-gray-700">
                <div className="h-full flex flex-col">
                  <textarea
                    value={translateInput}
                    onChange={(e) => setTranslateInput(e.target.value)}
                    placeholder="Enter text to translate..."
                    className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-4"
                  />
                  
                  <button
                    onClick={handleTranslate}
                    disabled={!translateInput.trim() || isTranslating}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTranslating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Translating...</span>
                      </>
                    ) : (
                      <>
                        <Languages className="h-4 w-4" />
                        <span>Translate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="w-1/2 p-6">
                <div className="h-full flex flex-col">
                  <div className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-4 overflow-y-auto">
                    {translateOutput ? (
                      <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                        {translateOutput}
                      </p>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center">
                        Translation will appear here...
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => copyToClipboard(translateOutput)}
                    disabled={!translateOutput}
                    className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy Translation</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhancement Tab */}
        {activeTab === 'enhance' && (
          <div className="h-full">
            {/* Enhancement Type Selection */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-4 gap-3">
                {enhancementTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setEnhanceType(type.id)}
                    className={`p-3 rounded-lg text-left transition-all ${
                      enhanceType === type.id
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-600'
                        : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    <div className="font-medium text-sm">{type.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Enhancement Content */}
            <div className="h-full flex">
              <div className="w-1/2 p-6 border-r border-gray-200 dark:border-gray-700">
                <div className="h-full flex flex-col">
                  <textarea
                    value={enhanceInput}
                    onChange={(e) => setEnhanceInput(e.target.value)}
                    placeholder="Enter text to enhance..."
                    className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-4"
                  />
                  
                  <button
                    onClick={handleEnhance}
                    disabled={!enhanceInput.trim() || isEnhancing}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEnhancing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Enhancing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Enhance</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="w-1/2 p-6">
                <div className="h-full flex flex-col">
                  <div className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-4 overflow-y-auto">
                    {enhanceOutput ? (
                      <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                        {enhanceOutput}
                      </p>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center">
                        Enhanced text will appear here...
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => copyToClipboard(enhanceOutput)}
                    disabled={!enhanceOutput}
                    className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy Enhanced Text</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summarization Tab */}
        {activeTab === 'summarize' && (
          <div className="h-full">
            {/* Summary Length Selection */}
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-3 gap-4">
                {summaryLengths.map((length) => (
                  <button
                    key={length.id}
                    onClick={() => setSummaryLength(length.id)}
                    className={`p-3 rounded-lg text-left transition-all ${
                      summaryLength === length.id
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-2 border-green-300 dark:border-green-600'
                        : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                  >
                    <div className="font-medium text-sm">{length.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{length.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Summarization Content */}
            <div className="h-full flex">
              <div className="w-1/2 p-6 border-r border-gray-200 dark:border-gray-700">
                <div className="h-full flex flex-col">
                  <textarea
                    value={summarizeInput}
                    onChange={(e) => setSummarizeInput(e.target.value)}
                    placeholder="Enter text to summarize..."
                    className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-4"
                  />
                  
                  <button
                    onClick={handleSummarize}
                    disabled={!summarizeInput.trim() || isSummarizing}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSummarizing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Summarizing...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        <span>Summarize</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="w-1/2 p-6">
                <div className="h-full flex flex-col">
                  <div className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-4 overflow-y-auto">
                    {summarizeOutput ? (
                      <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                        {summarizeOutput}
                      </p>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center">
                        Summary will appear here...
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => copyToClipboard(summarizeOutput)}
                    disabled={!summarizeOutput}
                    className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy Summary</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIToolsPage