import { ArrowLeft, Copy, RefreshCw, Sparkles, BookOpen, Wand2, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useAIToolsStore } from '../store/useAIToolsStore'

export default function EnhancePage() {
  const navigate = useNavigate()
  const { copyToClipboard } = useAppStore()
  
  const {
    enhancementTool,
    setEnhancementInput,
    setEnhancementType,
    setTargetTone,
    enhanceText,
    setEnhancedText
  } = useAIToolsStore()
  
  const { inputText, enhancedText, enhancementType, targetTone, isEnhancing } = enhancementTool

  const enhancementTypes = [
    { id: 'grammar', label: 'Grammar & Spelling', description: 'Fix grammatical errors and typos', icon: BookOpen },
    { id: 'style', label: 'Writing Style', description: 'Improve sentence structure and flow', icon: Wand2 },
    { id: 'tone', label: 'Tone Adjustment', description: 'Adjust tone to match your audience', icon: Heart },
    { id: 'clarity', label: 'Clarity & Concision', description: 'Make text clearer and more concise', icon: Sparkles }
  ]

  const toneOptions = [
    { id: 'professional', label: 'Professional', description: 'Business and formal contexts' },
    { id: 'casual', label: 'Casual', description: 'Friendly and conversational' },
    { id: 'academic', label: 'Academic', description: 'Scholarly and research-focused' },
    { id: 'creative', label: 'Creative', description: 'Engaging and imaginative' }
  ]

  const handleEnhance = async () => {
    await enhanceText()
  }

  const handleCopy = () => {
    copyToClipboard(enhancedText)
  }

  const handleRefresh = () => {
    setEnhancedText('')
    setEnhancementInput('')
  }

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }



  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-purple-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Text Enhancement
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Polish and improve your writing with AI-powered suggestions
                </p>
              </div>
            </div>
          </div>
          

        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Input Section */}
          <div className="w-1/2 p-6 border-r border-purple-200 dark:border-gray-700">
            <div className="h-full flex flex-col">
              {/* Enhancement Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enhancement Type
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {enhancementTypes.map((type) => {
                    const IconComponent = type.icon
                    return (
                      <button
                        key={type.id}
                        onClick={() => setEnhancementType(type.id as any)}
                        className={`p-3 rounded-lg text-left transition-colors ${
                          enhancementType === type.id
                            ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-600'
                            : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <IconComponent className="h-4 w-4" />
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {type.label}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {type.description}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Tone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {toneOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setTargetTone(option.id as any)}
                      className={`p-2 rounded-lg text-center transition-colors ${
                        targetTone === option.id
                          ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-600'
                          : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Text to Enhance
                  </label>
                  {inputText && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getWordCount(inputText)} words
                    </span>
                  )}
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setEnhancementInput(e.target.value)}
                  placeholder="Paste your text here...\n\nI can help improve grammar, style, tone, and clarity of your writing."
                  className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                
                <button
                  onClick={handleEnhance}
                  disabled={!inputText.trim() || isEnhancing}
                  className="mt-4 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isEnhancing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Enhancing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Enhance Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="w-1/2 p-6">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enhanced Text
                </label>
                {enhancedText && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getWordCount(enhancedText)} words
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleRefresh}
                        className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
                        title="Regenerate"
                      >
                        <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </button>
                      <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
                        title="Copy enhanced text"
                      >
                        <Copy className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-1 relative">
                {enhancedText ? (
                  <div className="h-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 overflow-y-auto">
                    <div className="text-gray-900 dark:text-white leading-relaxed">
                      {enhancedText}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="text-center">
                      <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Your enhanced text will appear here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}