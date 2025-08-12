import { ArrowLeft, Copy, RefreshCw, FileText, List, AlignLeft, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useAIToolsStore } from '../store/useAIToolsStore'

export default function SummarizePage() {
  const navigate = useNavigate()
  const { copyToClipboard } = useAppStore()
  
  const {
    summarizationTool,
    setSummarizationInput,
    setSummaryType,
    setSummaryLength,
    summarizeText,
    setSummary
  } = useAIToolsStore()
  
  const { inputText, summary, summaryType, summaryLength, isSummarizing } = summarizationTool

  const summaryTypes = [
    { id: 'brief', label: 'Brief Summary', description: 'Concise overview of main points', icon: Zap },
    { id: 'detailed', label: 'Detailed Summary', description: 'Comprehensive summary with context', icon: AlignLeft },
    { id: 'bullet', label: 'Bullet Points', description: 'Key points in bullet format', icon: List }
  ]

  const lengthOptions = [
    { id: 'short', label: 'Short', description: '1-2 sentences' },
    { id: 'medium', label: 'Medium', description: '3-5 sentences' },
    { id: 'long', label: 'Long', description: '6+ sentences' }
  ]

  const handleSummarize = async () => {
    await summarizeText()
  }

  const handleCopy = () => {
    copyToClipboard(summary)
  }

  const handleRefresh = () => {
    setSummary('')
    setSummarizationInput('')
  }

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }



  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-green-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Text Summarization
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Create concise summaries of long texts and documents
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
          <div className="w-1/2 p-6 border-r border-green-200 dark:border-gray-700">
            <div className="h-full flex flex-col">
              {/* Summary Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Summary Type
                </label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {summaryTypes.map((type) => {
                    const IconComponent = type.icon
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSummaryType(type.id as any)}
                        className={`p-3 rounded-lg text-left transition-colors ${
                          summaryType === type.id
                            ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-600'
                            : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-700'
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
                  Summary Length
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {lengthOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSummaryLength(option.id as any)}
                      className={`p-2 rounded-lg text-center transition-colors ${
                        summaryLength === option.id
                          ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-600'
                          : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-700'
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
                    Text to Summarize
                  </label>
                  {inputText && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getWordCount(inputText)} words
                    </span>
                  )}
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setSummarizationInput(e.target.value)}
                  placeholder="Paste your text here...\n\nYou can summarize articles, research papers, reports, or any long-form content."
                  className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
                
                <button
                  onClick={handleSummarize}
                  disabled={!inputText.trim() || isSummarizing}
                  className="mt-4 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSummarizing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Summarizing...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      <span>Generate Summary</span>
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
                  Summary
                </label>
                {summary && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getWordCount(summary)} words
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleRefresh}
                        className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-gray-700 transition-colors"
                        title="Regenerate"
                      >
                        <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </button>
                      <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-gray-700 transition-colors"
                        title="Copy summary"
                      >
                        <Copy className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-1 relative">
                {summary ? (
                  <div className="h-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 overflow-y-auto">
                    <div className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-line">
                      {summary}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Your summary will appear here
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