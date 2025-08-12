import React from 'react'
import { ExternalLink, Github, Heart, Coffee, Shield, RotateCcw } from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'
import iconPng from '../assets/icon.png'

const AboutPage: React.FC = () => {
  const { resetSettings } = useSettingsStore()
  
  const openExternal = (url: string) => {
    if (window.electronAPI) {
      window.electronAPI.openExternal(url)
    }
  }
  
  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      try {
        await resetSettings()
      } catch (error) {
        console.error('Failed to reset settings:', error)
      }
    }
  }

  const stats = [
    { label: 'Version', value: '1.0.0' },
    { label: 'Built with', value: 'Electron + React' },
    { label: 'License', value: 'MIT' },
    { label: 'Platform', value: 'Windows, macOS, Linux' }
  ]

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-sm mx-auto space-y-3">
        {/* Hero Section */}
        <div className="text-center py-4">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <img src={iconPng} alt="QuillWise Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              QuillWise
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400 mb-3">
              AI-Powered Writing Assistant
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span>Enhance your writing with intelligent AI suggestions</span>
            </div>
          </div>
        </div>

        {/* Brand Description */}
        <div className="card p-3">
          <div className="text-center space-y-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Smart Writing, Simplified
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              QuillWise brings the power of AI to your everyday writing tasks. Whether you're translating text, 
              summarizing documents, or enhancing your prose, our intelligent assistant works seamlessly 
              across all your applications with just a simple hotkey.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                Global AI Assistant
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="card p-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
            Technical Details
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>



        {/* Support & Links */}
        <div className="card p-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Support & Community
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => openExternal('https://github.com/yourusername/quillwise')}
              className="w-full flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Github className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div className="text-left flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  View on GitHub
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Source code, issues, and contributions
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => openExternal('https://buymeacoffee.com/yourusername')}
              className="w-full flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Coffee className="h-5 w-5 text-orange-500" />
              <div className="text-left flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  Buy me a coffee
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Support the development
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="card p-3">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Privacy &amp; Security
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your privacy and security are our priority
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-start space-x-3">
                <Shield className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-green-900 dark:text-green-100">
                    Data Privacy Notice
                  </h3>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    All your data is stored locally on your device. 
                    No information is sent to external servers unless you explicitly choose to do so.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleReset}
                className="btn-secondary flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset All Settings</span>
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This will restore all settings to their default values
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 mb-2">
            <span className="text-sm">Made with</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span className="text-sm">for productivity</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            © 2024 QuillWise. Open source under MIT License.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AboutPage