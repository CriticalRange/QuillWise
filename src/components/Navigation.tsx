import React from 'react'
import { Link } from 'react-router-dom'
import { Settings, Info, X } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { cn } from '../utils'

interface NavigationProps {
  currentPath: string
}

const Navigation: React.FC<NavigationProps> = ({ currentPath }) => {
  const { hideWindow } = useAppStore()

  const navItems = [
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      title: 'QuillWise - Settings'
    },
    {
      path: '/about',
      icon: Info,
      label: 'About',
      title: 'About QuillWise'
    }
  ]

  const currentItem = navItems.find(item => item.path === currentPath)
  const title = currentItem?.title || 'QuillWise'

  return (
    <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-3 py-2 transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between">
        {/* Empty left space for balance */}
        <div className="w-8"></div>
        
        {/* Navigation Items - Centered */}
        <nav className="flex items-center space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ease-in-out transform hover:scale-105',
                  isActive
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-100'
                )}
                title={item.label}
              >
                <Icon size={14} className="transition-transform duration-300 ease-in-out" />
                {isActive && (
                  <span className="animate-fade-in transition-opacity duration-300">
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        
        {/* Close Button - Right Side */}
        <button
          onClick={() => hideWindow()}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-200 ease-in-out transform hover:scale-105"
          title="Close Window"
        >
          <X size={16} />
        </button>
      </div>
    </header>
  )
}

export default Navigation