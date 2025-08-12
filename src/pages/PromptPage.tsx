import { ArrowLeft, Copy, RefreshCw, MessageSquare, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useAIToolsStore } from '../store/useAIToolsStore'

export default function PromptPage() {
  const navigate = useNavigate()
  const { copyToClipboard } = useAppStore()
  
  const {
    promptTool,
    setPromptInput,
    setPromptType,
    generatePrompt,
    setGeneratedPrompt
  } = useAIToolsStore()
  
  const { inputText, promptType, generatedPrompt, isGenerating } = promptTool

  const promptTypes = [
    { id: 'creative', label: 'Creative Writing', description: 'For storytelling, content creation, and creative tasks' },
    { id: 'analytical', label: 'Data Analysis', description: 'For research, analysis, and logical reasoning' },
    { id: 'conversational', label: 'Conversational', description: 'For chatbots, customer service, and dialogue' },
    { id: 'technical', label: 'Technical', description: 'For coding, documentation, and technical explanations' }
  ]

  const handleGenerate = async () => {
    await generatePrompt()
  }

  const handleCopy = () => {
    copyToClipboard(generatedPrompt)
  }

  const handleRefresh = () => {
    setGeneratedPrompt('')
    setPromptInput('')
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
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  AI Prompt Assistant
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Generate and optimize AI prompts for better results
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prompt Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {promptTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setPromptType(type.id as any)}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        promptType === type.id
                          ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-600'
                          : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {type.label}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Describe what you want the AI to help with
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Enter your topic or idea here..."
                  className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                
                <button
                  onClick={handleGenerate}
                  disabled={!inputText.trim() || isGenerating}
                  className="mt-4 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Prompt</span>
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
                  Generated Prompt
                </label>
                {generatedPrompt && (
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
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex-1 relative">
                {generatedPrompt ? (
                  <div className="h-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 overflow-y-auto">
                    <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-mono leading-relaxed">
                      {generatedPrompt}
                    </pre>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Your optimized prompt will appear here
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