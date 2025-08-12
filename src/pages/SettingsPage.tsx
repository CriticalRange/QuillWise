import React from 'react'
import { Save, Palette, Bell, Bot, Key, Move, RefreshCw, CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight, Crosshair, MousePointer, Keyboard, Eye, EyeOff, HelpCircle } from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'
import { AppSettings } from '../types'
import HotkeyInput from '../components/HotkeyInput'
import OpenAIIcon from '../assets/openai-icon.svg'
import GeminiIcon from '../assets/gemini-icon.svg'
import OllamaIcon from '../assets/ollama-icon.svg'

// Tooltip component
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [isVisible, setIsVisible] = React.useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg whitespace-nowrap z-50">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
        </div>
      )}
    </div>
  )
}

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore()
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings)
  const [hasChanges, setHasChanges] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [showApiKeys, setShowApiKeys] = React.useState(false)
  const [ollamaModels, setOllamaModels] = React.useState<string[]>([])
  const [isLoadingModels, setIsLoadingModels] = React.useState(false)

  React.useEffect(() => {
    setLocalSettings(settings)
    setHasChanges(false)
  }, [settings])

  React.useEffect(() => {
    if (localSettings.aiSettings?.provider === 'ollama' && localSettings.aiSettings?.ollamaUrl) {
      fetchOllamaModels()
    }
  }, [localSettings.aiSettings?.provider, localSettings.aiSettings?.ollamaUrl])

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    setHasChanges(true)
  }

  const handleAISettingChange = (key: string, value: any) => {
    const newAISettings = { 
      provider: 'gemini' as const,
      openaiApiKey: '',
      geminiApiKey: '',
      model: 'gemini-1.5-flash',
      maxTokens: 1000,
      temperature: 0.7,
      ...localSettings.aiSettings, 
      [key]: value 
    }
    const newSettings = { 
      ...localSettings, 
      aiSettings: newAISettings 
    }
    setLocalSettings(newSettings)
    setHasChanges(true)
  }

  const handleOverlaySettingChange = (key: string, value: any) => {
    const newOverlaySettings = { 
      position: 'top-left' as const,
      offset: { x: 20, y: 60 },
      followCursor: false,
      stayOnScreen: true,
      alwaysOnTop: true,
      ...localSettings.overlaySettings, 
      [key]: value 
    }
    const newSettings = { 
      ...localSettings, 
      overlaySettings: newOverlaySettings 
    }
    setLocalSettings(newSettings)
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSettings(localSettings)
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }


  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' }
  ]

  const fontSizeOptions = [
    { value: 12, label: 'Small (12px)' },
    { value: 14, label: 'Medium (14px)' },
    { value: 16, label: 'Large (16px)' },
    { value: 18, label: 'Extra Large (18px)' }
  ]

  const fetchOllamaModels = async () => {
    setIsLoadingModels(true)
    try {
      const ollamaUrl = localSettings.aiSettings?.ollamaUrl || 'http://localhost:11434'
      const response = await fetch(`${ollamaUrl}/api/tags`)
      if (response.ok) {
        const data = await response.json()
        const modelNames = data.models.map((model: any) => model.name)
        setOllamaModels(modelNames)
      } else {
        console.error('Failed to fetch Ollama models')
        setOllamaModels([])
      }
    } catch (error) {
      console.error('Error fetching Ollama models:', error)
      setOllamaModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }

  const handleExternalLink = (url: string) => {
    if (window.electronAPI) {
      window.electronAPI.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-sm mx-auto space-y-3">
        {/* Header */}
        {/* Save Changes button moved to sticky position at bottom right */}

        {/* Pro Tip */}
        <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Bell className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-purple-900 dark:text-purple-100">Pro Tip:</span>
          </div>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Click on any text input field first, then press your hotkey. QuillWise will automatically detect your selected text and provide contextual suggestions!
          </p>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="card p-3">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Keyboard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure global hotkeys and shortcuts
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Global Hotkey
              </label>
              <div className="space-y-2">
                <HotkeyInput
                  value={localSettings.globalHotkey}
                  onChange={(hotkey) => handleSettingChange('globalHotkey', hotkey)}
                  placeholder="Click to set hotkey"
                  className="flex-1"
                />
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Press to show/hide window</span>
                  <span>ESC to cancel</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use Super (Windows key), Ctrl, Alt, Shift + any key
              </p>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card p-3">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Appearance
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Customize the look and feel
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Theme
                </label>
                <Tooltip text="Choose color scheme">
                  <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                </Tooltip>
              </div>
              <select
                value={localSettings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value as 'light' | 'dark' | 'system')}
                className="input"
              >
                {themeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Font Size
                </label>
                <Tooltip text="Adjust font size for readability">
                  <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                </Tooltip>
              </div>
              <select
                value={localSettings.fontSize}
                onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                className="input"
              >
                {fontSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Behavior */}
        <div className="card p-3">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Behavior
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure app behavior and notifications
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto-hide after copying
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically hide window after copying a prompt
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.autoHide}
                  onChange={(e) => handleSettingChange('autoHide', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>


          </div>
        </div>



        {/* AI API Settings */}
        <div className="card p-3">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI API Settings
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure your AI service provider and API keys
              </p>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-6">
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => handleAISettingChange('provider', 'gemini')}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    localSettings.aiSettings?.provider === 'gemini'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-600'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                      <img src={GeminiIcon} alt="Gemini" className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">Google Gemini</span>
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">
                          Free Tier
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">
                          Recommended
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Fast, reliable, and free with generous limits. Get your API key from AI Studio.
                  </p>
                </button>
                
                <button
                  onClick={() => handleAISettingChange('provider', 'openai')}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    localSettings.aiSettings?.provider === 'openai'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-600'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                      <img src={OpenAIIcon} alt="OpenAI" className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">OpenAI GPT</span>
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 px-2 py-0.5 rounded">
                          Paid Only
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    High-quality responses with GPT-3.5 Turbo and GPT-4 models. Requires payment.
                  </p>
                </button>
                
                <button
                  onClick={() => handleAISettingChange('provider', 'ollama')}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    localSettings.aiSettings?.provider === 'ollama'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-600'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                      <img src={OllamaIcon} alt="Ollama" className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">Ollama</span>
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">
                          Local & Free
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 rounded">
                          Privacy
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Run AI models locally on your machine. Complete privacy and no API costs.
                  </p>
                </button>
              </div>
            </div>

            {/* API Configuration */}
            {localSettings.aiSettings?.provider === 'ollama' ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ollama Server URL
                    </label>
                    <Tooltip text="Ollama server URL (default: localhost:11434)">
                      <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={localSettings.aiSettings?.ollamaUrl || 'http://localhost:11434'}
                      onChange={(e) => handleAISettingChange('ollamaUrl', e.target.value)}
                      placeholder="http://localhost:11434"
                      className="input pr-10"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Bot className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Make sure Ollama is running on your machine. Download from{' '}
                    <button 
                      onClick={() => handleExternalLink('https://ollama.ai')}
                      className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      ollama.ai
                    </button>
                  </div>
                  
                  {/* API Status for Ollama */}
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    API Status: {localSettings.aiSettings?.ollamaUrl ? 'Connected' : 'Not Configured'}
                  </div>
                </div>
                

              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {localSettings.aiSettings?.provider === 'gemini' ? 'Gemini' : 'OpenAI'} API Key
                  </label>
                  <button
                    onClick={() => setShowApiKeys(!showApiKeys)}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {showApiKeys ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{showApiKeys ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type={showApiKeys ? 'text' : 'password'}
                    value={
                      localSettings.aiSettings?.provider === 'gemini'
                        ? localSettings.aiSettings?.geminiApiKey || ''
                        : localSettings.aiSettings?.openaiApiKey || ''
                    }
                    onChange={(e) => {
                      const key = localSettings.aiSettings?.provider === 'gemini' ? 'geminiApiKey' : 'openaiApiKey'
                      handleAISettingChange(key, e.target.value)
                    }}
                    placeholder={`Enter your ${localSettings.aiSettings?.provider === 'gemini' ? 'Gemini' : 'OpenAI'} API key`}
                    className="input pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Key className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {localSettings.aiSettings?.provider === 'gemini' ? (
                    <>
                      Get your free API key from{' '}
                      <button 
                        onClick={() => handleExternalLink('https://aistudio.google.com/')}
                        className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Google AI Studio
                      </button>
                    </>
                  ) : (
                    <>
                      Get your API key from{' '}
                      <button 
                        onClick={() => handleExternalLink('https://platform.openai.com/api-keys')}
                        className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        OpenAI Platform
                      </button>
                    </>
                  )}
                </div>
                
                {/* API Status for Gemini/OpenAI */}
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  API Status: {
                    (localSettings.aiSettings?.provider === 'gemini' && localSettings.aiSettings?.geminiApiKey) ||
                    (localSettings.aiSettings?.provider === 'openai' && localSettings.aiSettings?.openaiApiKey)
                      ? 'Connected'
                      : 'Not Configured'
                  }
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Advanced Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Model Selection */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Model
                    </label>
                    <Tooltip text="AI model selection">
                      <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                    </Tooltip>
                  </div>
                  {localSettings.aiSettings?.provider === 'ollama' ? (
                    <div className="flex space-x-2">
                      <select
                        value={localSettings.aiSettings?.ollamaModel || ''}
                        onChange={(e) => handleAISettingChange('ollamaModel', e.target.value)}
                        className="input text-sm flex-1"
                      >
                        <option value="">Select a model...</option>
                        {ollamaModels.map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={fetchOllamaModels}
                        disabled={isLoadingModels}
                        className="px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-lg transition-colors flex items-center justify-center"
                        title="Refresh models"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={localSettings.aiSettings?.model || (localSettings.aiSettings?.provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-3.5-turbo')}
                      onChange={(e) => handleAISettingChange('model', e.target.value)}
                      className="input text-sm"
                    >
                      {localSettings.aiSettings?.provider === 'gemini' ? (
                        <>
                          <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                          <option value="gemini-1.5-pro">Gemini 1.5 Pro (Quality)</option>
                        </>
                      ) : (
                        <>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        </>
                      )}
                    </select>
                  )}
                </div>

                {/* Max Tokens */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Max Tokens
                    </label>
                    <Tooltip text="Max tokens AI can generate">
                      <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                    </Tooltip>
                  </div>
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    value={localSettings.aiSettings?.maxTokens || 1000}
                    onChange={(e) => handleAISettingChange('maxTokens', parseInt(e.target.value))}
                    className="input text-sm"
                  />
                </div>

                {/* Temperature */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Temperature ({localSettings.aiSettings?.temperature || 0.7})
                    </label>
                    <Tooltip text="Creativity vs focus (lower = focused, higher = creative)">
                      <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                    </Tooltip>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={localSettings.aiSettings?.temperature || 0.7}
                    onChange={(e) => handleAISettingChange('temperature', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Focused</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Overlay Settings */}
        <div className="card p-3">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Move className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Overlay Positioning
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure where the AI overlay appears on your screen
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Position Selection */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Position
                </label>
                <Tooltip text="Where overlay appears">
                  <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                </Tooltip>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: 'top-left', label: 'Top Left', desc: 'Upper left corner', icon: CornerUpLeft },
                  { value: 'top-right', label: 'Top Right', desc: 'Upper right corner', icon: CornerUpRight },
                  { value: 'bottom-left', label: 'Bottom Left', desc: 'Lower left corner', icon: CornerDownLeft },
                  { value: 'bottom-right', label: 'Bottom Right', desc: 'Lower right corner', icon: CornerDownRight },
                  { value: 'center', label: 'Center', desc: 'Screen center', icon: Crosshair },
                  { value: 'cursor', label: 'Follow Cursor', desc: 'Near mouse position', icon: MousePointer }
                ].map((pos) => {
                  const IconComponent = pos.icon
                  return (
                    <button
                      key={pos.value}
                      onClick={() => handleOverlaySettingChange('position', pos.value)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        localSettings.overlaySettings?.position === pos.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <IconComponent className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {pos.label}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {pos.desc}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>


            {/* Additional Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Follow cursor movement
                      </label>
                      <Tooltip text="Overlay follows mouse cursor">
                        <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                      </Tooltip>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Overlay moves with your mouse cursor (only for cursor position)
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={localSettings.overlaySettings?.position !== 'cursor'}
                    checked={localSettings.overlaySettings?.followCursor && localSettings.overlaySettings?.position === 'cursor'}
                    onChange={(e) => handleOverlaySettingChange('followCursor', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600 ${localSettings.overlaySettings?.position !== 'cursor' ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Keep overlay on screen
                    </label>
                    <Tooltip text="Keeps overlay within screen bounds">
                      <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                    </Tooltip>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Prevent overlay from appearing outside screen boundaries
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.overlaySettings?.stayOnScreen}
                    onChange={(e) => handleOverlaySettingChange('stayOnScreen', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Always stay on top
                    </label>
                    <Tooltip text="Overlay stays above other apps">
                      <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                    </Tooltip>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Keep overlay visible above all other windows
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.overlaySettings?.alwaysOnTop}
                    onChange={(e) => handleOverlaySettingChange('alwaysOnTop', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

          </div>
        </div>

      </div>
      
      {/* Sticky Save Changes Button */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex items-center space-x-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default SettingsPage