import { Copy, RefreshCw, ArrowLeftRight, Volume2, Languages } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useAIToolsStore } from '../store/useAIToolsStore'
import LanguageSelector from '../components/LanguageSelector'
import CopyPopup from '../components/CopyPopup'

export default function TranslatePage() {
  const navigate = useNavigate()
  const { copyToClipboard } = useAppStore()
  const [showCopyPopup, setShowCopyPopup] = useState(false)
  
  const {
    translationTool,
    setTranslationInput,
    setSourceLanguage,
    setTargetLanguage,
    swapLanguages,
    translateText
  } = useAIToolsStore()
  
  const { inputText, translatedText, sourceLanguage, targetLanguage, isTranslating } = translationTool

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
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
    { code: 'da', name: 'Danish', flag: '🇩🇰' },
    { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'cs', name: 'Czech', flag: '🇨🇿' },
    { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
    { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
    { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
    { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
    { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
    { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
    { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
    { code: 'et', name: 'Estonian', flag: '🇪🇪' },
    { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
    { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
    { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
    { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
    { code: 'ms', name: 'Malay', flag: '🇲🇾' },
    { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
    { code: 'sw', name: 'Swahili', flag: '🇹🇿' },
    { code: 'fa', name: 'Persian', flag: '🇮🇷' },
    { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
    { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
    { code: 'ta', name: 'Tamil', flag: '🇱🇰' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
    { code: 'ne', name: 'Nepali', flag: '🇳🇵' },
    { code: 'si', name: 'Sinhala', flag: '🇱🇰' },
    { code: 'my', name: 'Myanmar', flag: '🇲🇲' },
    { code: 'km', name: 'Khmer', flag: '🇰🇭' },
    { code: 'lo', name: 'Lao', flag: '🇱🇦' },
    { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
    { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
    { code: 'az', name: 'Azerbaijani', flag: '🇦🇿' },
    { code: 'kk', name: 'Kazakh', flag: '🇰🇿' },
    { code: 'ky', name: 'Kyrgyz', flag: '🇰🇬' },
    { code: 'uz', name: 'Uzbek', flag: '🇺🇿' },
    { code: 'mn', name: 'Mongolian', flag: '🇲🇳' }
  ]

  const handleTranslate = async () => {
    await translateText()
  }

  const handleCopy = async (text?: string) => {
    try {
      const textToCopy = text || translatedText
      console.log('Copying text:', textToCopy)
      
      await copyToClipboard(textToCopy)
      console.log('Copy successful, showing popup')
      setShowCopyPopup(true)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }



  const handleSwapLanguages = () => {
    swapLanguages()
  }

  const handleSpeak = (text: string, lang: string) => {
    if ('speechSynthesis' in window && text) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang === 'auto' ? 'en-US' : `${lang}-${lang.toUpperCase()}`
      speechSynthesis.speak(utterance)
    }
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
              <ArrowLeftRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <Languages className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Smart Translation
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Translate text between multiple languages with AI precision
                </p>
              </div>
            </div>
          </div>
          


        </div>
      </div>

      {/* Language Selection */}
      <div className="flex-shrink-0 px-6 py-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-y border-purple-100 dark:border-purple-800">
        <div className="flex items-center justify-center space-x-6">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From
            </label>
            <LanguageSelector
              languages={languages}
              value={sourceLanguage}
              onChange={setSourceLanguage}
              placeholder="Detect language"
            />
          </div>
          
          <div className="flex flex-col items-center justify-end pb-2">
            <button
              onClick={handleSwapLanguages}
              disabled={sourceLanguage === 'auto'}
              className="p-3 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Swap languages"
            >
              <ArrowLeftRight className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </button>
          </div>
          
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To
            </label>
            <LanguageSelector
              languages={languages.filter(lang => lang.code !== 'auto')}
              value={targetLanguage}
              onChange={setTargetLanguage}
              placeholder="Select language"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Source Text */}
          <div className="w-1/2 p-6 border-r border-purple-200 dark:border-gray-700">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Source Text
                </label>
                {inputText && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSpeak(inputText, sourceLanguage)}
                      className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
                      title="Listen"
                    >
                      <Volume2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => handleCopy(inputText)}
                      className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
                      title="Copy"
                    >
                      <Copy className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                )}
              </div>
              
              <textarea
                value={inputText}
                onChange={(e) => setTranslationInput(e.target.value)}
                placeholder="Enter text to translate..."
                className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 custom-scrollbar"
              />
              
              <button
                onClick={handleTranslate}
                disabled={!inputText.trim() || isTranslating}
                className="mt-4 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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

          {/* Translated Text */}
          <div className="w-1/2 p-6">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Translation
                </label>
                {translatedText && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSpeak(translatedText, targetLanguage)}
                      className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
                      title="Listen"
                    >
                      <Volume2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => handleCopy()}
                      className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
                      title="Copy translation"
                    >
                      <Copy className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex-1 relative">
                {translatedText ? (
                  <div 
                    onClick={() => handleCopy(translatedText)}
                    className="h-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 overflow-y-auto cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition-all duration-200 group custom-scrollbar"
                    title="Click to copy translation"
                  >
                    <p className="text-gray-900 dark:text-white leading-relaxed group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                      {translatedText}
                    </p>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-lg flex items-center space-x-1">
                        <Copy className="h-3 w-3" />
                        <span>Click to copy</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="text-center">
                      <Languages className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Translation will appear here
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Click on result to copy
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Copy Popup */}
      <CopyPopup 
        show={showCopyPopup} 
        onHide={() => setShowCopyPopup(false)}
        text="Translation copied!"
      />
    </div>
  )
}