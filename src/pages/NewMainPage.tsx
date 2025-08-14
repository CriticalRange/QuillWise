import { Edit3, Globe, Type, Settings, Library, BarChart3, Keyboard } from 'lucide-react'
import { useAIToolsStore } from '../store/useAIToolsStore'

export function NewMainPage() {
  const { promptTool, translationTool, summarizationTool, enhancementTool } = useAIToolsStore()

  const stats = [
    {
      id: 'enhancements',
      label: 'Documents Processed',
      value: enhancementTool.history.length,
      icon: Edit3,
      color: 'text-slate-700'
    },
    {
      id: 'translations',
      label: 'Translations',
      value: translationTool.history.length,
      icon: Globe,
      color: 'text-blue-700'
    },
    {
      id: 'summaries',
      label: 'Summaries Created',
      value: summarizationTool.history.length,
      icon: BarChart3,
      color: 'text-emerald-700'
    },
    {
      id: 'prompts',
      label: 'Content Generated',
      value: promptTool.history.length,
      icon: Type,
      color: 'text-amber-700'
    }
  ]

  const features = [
    {
      id: 'text-editing',
      title: 'Professional Text Editing',
      description: 'Advanced editing tools for grammar, style, and clarity improvements'  
    },
    {
      id: 'translation',
      title: 'Multi-Language Support',
      description: 'Translate documents between major world languages accurately'
    },
    {
      id: 'summarization',
      title: 'Document Summarization',
      description: 'Create executive summaries and extract key insights from long texts'
    },
    {
      id: 'content-generation',
      title: 'Content Generation',
      description: 'Generate structured content, outlines, and formatted text'
    }
  ]

  const quickActions = [

    {
      id: 'settings',
      label: 'Preferences',
      description: 'Configure settings',
      icon: Settings,
      action: () => window.location.hash = '/settings'
    },
    {
      id: 'library',
      label: 'Templates',
      description: 'Browse templates',
      icon: Library,
      action: () => window.location.hash = '/library'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">
              QuillWise
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Professional writing tools for enhanced productivity
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access Card */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Keyboard className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                <span className="text-base font-medium text-blue-900 dark:text-blue-100">Global Hotkey</span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Access writing tools from any application
              </p>
              <kbd className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono">
                Ctrl+Shift+Q
              </kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Usage Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const IconComponent = stat.icon
            return (
              <div
                key={stat.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-4">
                    <IconComponent className={`w-5 h-5 ${stat.color} dark:text-gray-300`} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Available Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            return (
              <div
                key={feature.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon
            return (
              <button
                key={action.id}
                onClick={action.action}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-left hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-4">
                    <IconComponent className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                      {action.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-500">
            QuillWise — Writing productivity tools
          </p>
        </div>
      </div>
    </div>
  )
}