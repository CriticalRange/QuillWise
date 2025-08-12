import { useNavigate } from 'react-router-dom'
import { MessageSquare, Languages, FileText, Sparkles, ArrowRight } from 'lucide-react'

export function MainPage() {
  const navigate = useNavigate()
  
  const aiTools = [
    {
      id: 'prompt',
      title: 'AI Prompt Assistant',
      description: 'Generate and optimize AI prompts for better results',
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      path: '/prompt'
    },
    {
      id: 'translate',
      title: 'Smart Translation',
      description: 'Translate text between multiple languages with AI precision',
      icon: Languages,
      color: 'from-purple-500 to-purple-600',
      path: '/translate'
    },
    {
      id: 'summarize',
      title: 'Text Summarization',
      description: 'Create concise summaries of long texts and documents',
      icon: FileText,
      color: 'from-green-500 to-green-600',
      path: '/summarize'
    },
    {
      id: 'enhance',
      title: 'Text Enhancement',
      description: 'Improve writing style, grammar, and clarity',
      icon: Sparkles,
      color: 'from-orange-500 to-orange-600',
      path: '/enhance'
    }
  ]

  const handleToolClick = (path: string) => {
    navigate(path)
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <div className="flex-shrink-0 px-8 py-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent mb-2">
            QuillWise
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Your AI-powered writing assistant
          </p>
        </div>
      </div>

      {/* AI Tools Grid */}
      <div className="flex-1 px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {aiTools.map((tool) => {
            const IconComponent = tool.icon
            return (
              <div
                key={tool.id}
                onClick={() => handleToolClick(tool.path)}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:-translate-y-1"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-r ${tool.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                
                {/* Content */}
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${tool.color} text-white`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition-colors duration-300" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                    {tool.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        


        {/* Quick Access Info */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <span className="text-sm text-purple-700 dark:text-purple-300">
              💡 Press <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded text-xs font-mono shadow">Ctrl+Shift+Q</kbd> to open QuillWise from anywhere
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}