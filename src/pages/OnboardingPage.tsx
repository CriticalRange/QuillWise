import React, { useState } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import { useAppStore } from '../store/useAppStore'
import { Bot, Settings, ArrowRight, ArrowLeft, X, ExternalLink } from 'lucide-react'
import logoIcon from '../assets/icon.png'

const OnboardingPage: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore()
  const { navigateTo } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [aiProvider, setAiProvider] = useState<'openai' | 'gemini' | 'ollama' | null>(null)
  const [apiKey, setApiKey] = useState('')

  // Apply theme to document
  React.useEffect(() => {
    const applyTheme = () => {
      const { theme } = settings
      const root = document.documentElement
      
      // Remove existing theme classes
      root.classList.remove('dark', 'light')
      
      if (theme === 'dark') {
        root.classList.add('dark')
      } else if (theme === 'light') {
        root.classList.add('light')
      } else if (theme === 'system') {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
          root.classList.add('dark')
        } else {
          root.classList.add('light')
        }
      }
    }

    applyTheme()
  }, [settings.theme])

  const steps = [
    {
      title: 'Welcome to QuillWise',
      description: 'Your intelligent AI-powered writing assistant for translation, enhancement, and creative writing.',
      icon: <img src={logoIcon} alt="QuillWise Logo" className="w-16 h-16" />
    },
    {
      title: 'AI Provider Setup',
      description: 'Choose your preferred AI provider to power QuillWise.',
      icon: <Bot className="w-16 h-16 text-green-500" />
    },
    {
      title: 'Setup Complete',
      description: 'You\'re all set! Start using QuillWise for all your writing needs.',
      icon: <Settings className="w-16 h-16 text-purple-500" />
    }
  ]

  const handleAiProviderChoice = (provider: 'openai' | 'gemini' | 'ollama') => {
    setAiProvider(provider)
    setApiKey('')  // Reset API key when changing provider
  }

  const handleNext = async () => {
    if (currentStep === 1 && aiProvider) {
      // Update AI settings
      const aiSettings = {
        provider: aiProvider,
        openaiApiKey: aiProvider === 'openai' ? apiKey : '',
        geminiApiKey: aiProvider === 'gemini' ? apiKey : '',
        ollamaUrl: aiProvider === 'ollama' ? (apiKey || 'http://localhost:11434') : '',
        model: aiProvider === 'gemini' ? 'gemini-1.5-flash' : (aiProvider === 'openai' ? 'gpt-3.5-turbo' : 'llama3.2'),
        maxTokens: 1000,
        temperature: 0.7
      }
      
      await updateSettings({
        ...settings,
        globalHotkey: 'Ctrl+Shift+Q',
        aiSettings,
        onboardingCompleted: currentStep === steps.length - 1
      })
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      await updateSettings({
        ...settings,
        onboardingCompleted: true
      })
      navigateTo('/main')
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    // Close onboarding window (user can reopen and continue later)
    if (window.electronAPI) {
      window.electronAPI.hideWindow()
    }
  }

  const handleExternalLink = (url: string) => {
    if (window.electronAPI) {
      window.electronAPI.openExternal(url)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              {steps[0].icon}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {steps[0].title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
                {steps[0].description}
              </p>
              <p className="text-purple-600 dark:text-purple-400 text-xl font-semibold">
                "Write Smarter, Not Harder"
              </p>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              {steps[1].icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {steps[1].title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
                {steps[1].description}
              </p>
            </div>

            <div className="space-y-4">
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  aiProvider === 'gemini' 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleAiProviderChoice('gemini')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    aiProvider === 'gemini' 
                      ? 'border-purple-500 bg-purple-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`} />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Google Gemini (Recommended)
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Fast, reliable, and cost-effective. Great for most writing tasks.
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  aiProvider === 'openai' 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleAiProviderChoice('openai')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    aiProvider === 'openai' 
                      ? 'border-purple-500 bg-purple-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`} />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      OpenAI GPT
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Industry standard for creative writing and complex tasks.
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  aiProvider === 'ollama' 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleAiProviderChoice('ollama')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    aiProvider === 'ollama' 
                      ? 'border-purple-500 bg-purple-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`} />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Ollama (Local)
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Run AI models locally on your machine. Privacy-focused.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {(aiProvider === 'openai' || aiProvider === 'gemini') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {aiProvider === 'openai' ? 'OpenAI API Key' : 'Gemini API Key'}
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Enter your ${aiProvider === 'openai' ? 'OpenAI' : 'Gemini'} API key...`}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <p className="text-purple-800 dark:text-purple-200 text-sm">
                    Get your API key from{' '}
                    <button
                      onClick={() => handleExternalLink(
                        aiProvider === 'openai' 
                          ? 'https://platform.openai.com/api-keys' 
                          : 'https://makersuite.google.com/app/apikey'
                      )}
                      className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 underline font-medium"
                    >
                      {aiProvider === 'openai' ? 'platform.openai.com' : 'makersuite.google.com'}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </p>
                </div>
              </div>
            )}

            {aiProvider === 'ollama' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ollama Server URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="http://localhost:11434 (default)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <p className="text-purple-800 dark:text-purple-200 text-sm">
                    Make sure Ollama is installed and running on your machine. Visit{' '}
                    <button
                      onClick={() => handleExternalLink('https://ollama.ai')}
                      className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 underline font-medium"
                    >
                      ollama.ai
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    {' '}for setup instructions.
                  </p>
                </div>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              {steps[2].icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {steps[2].title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {steps[2].description}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p className="text-purple-800 dark:text-purple-200 text-sm">
                Press Ctrl+Shift+Q to open QuillWise anytime, or access it from the system tray!
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mt-4">
              <p className="text-purple-800 dark:text-purple-200 text-sm">
                💡 Tip: Copy any text you want to improve, then paste it into QuillWise for AI-powered enhancements!
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-screen bg-white dark:bg-black flex flex-col p-4 overflow-hidden">
      <div className="max-w-2xl w-full mx-auto flex flex-col h-full relative">
        {/* Close Button - Top Right */}
        <button
          onClick={handleClose}
          className="absolute -top-2 -right-2 z-50 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Close window"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Progress Bar */}
        <div className="mb-4 mt-8 flex-shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-black rounded-lg shadow-lg p-6 flex-1 flex flex-col overflow-hidden">

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            {currentStep > 0 ? (
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div></div>
            )}
            
            <button
              onClick={handleNext}
              disabled={currentStep === 1 && (!aiProvider || ((aiProvider === 'openai' || aiProvider === 'gemini') && !apiKey))}
              className="flex items-center space-x-2 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage