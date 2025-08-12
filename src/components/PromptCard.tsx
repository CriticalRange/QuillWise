import React from 'react'
import { Copy, Heart, Star, MoreVertical } from 'lucide-react'
import { Prompt, Category } from '../types'

import { usePromptStore } from '../store/usePromptStore'
import { cn, truncateText, formatRelativeTime } from '../utils'

interface PromptCardProps {
  prompt: Prompt
  category?: Category
  onEdit?: (prompt: Prompt) => void
  onDelete?: (prompt: Prompt) => void
  showActions?: boolean
  compact?: boolean
}

const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  category,
  onEdit,
  onDelete,
  showActions = true,
  compact = false
}) => {

  const { toggleFavorite, incrementUsage } = usePromptStore()
  const [showMenu, setShowMenu] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLoading(true)
    
    try {
      await window.electronAPI.copyToClipboard(prompt.content)
      await incrementUsage(prompt.id)
      
      // Auto-hide window after copying if enabled
      // This will be controlled by settings later
      setTimeout(() => {
        window.electronAPI.hideWindow()
      }, 500)
    } catch (error) {
      console.error('Failed to copy prompt:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await toggleFavorite(prompt.id)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleMenuAction = (action: 'edit' | 'delete') => {
    setShowMenu(false)
    if (action === 'edit' && onEdit) {
      onEdit(prompt)
    } else if (action === 'delete' && onDelete) {
      onDelete(prompt)
    }
  }

  return (
    <div className={cn(
      'prompt-card group relative',
      compact ? 'p-3' : 'p-4'
    )}>
      {/* Category Badge */}
      {category && (
        <div className="flex items-center justify-between mb-2">
          <span 
            className="category-badge text-white"
            style={{ backgroundColor: category.color }}
          >
            {category.name}
          </span>
          
          {/* Usage Count */}
          {prompt.usageCount > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Used {prompt.usageCount} times
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <h3 className={cn(
        'font-semibold text-gray-900 dark:text-gray-100 mb-2',
        compact ? 'text-sm' : 'text-base'
      )}>
        {prompt.title}
      </h3>

      {/* Content Preview */}
      <p className={cn(
        'text-gray-600 dark:text-gray-400 mb-3',
        compact ? 'text-xs' : 'text-sm'
      )}>
        {truncateText(prompt.content, compact ? 80 : 120)}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Last Updated */}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatRelativeTime(prompt.updatedAt)}
        </span>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {/* Favorite Button */}
            <button
              onClick={handleToggleFavorite}
              className={cn(
                'btn-icon',
                prompt.isFavorite
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'text-gray-400 hover:text-yellow-500'
              )}
              title={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {prompt.isFavorite ? <Star size={16} fill="currentColor" /> : <Heart size={16} />}
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              disabled={isLoading}
              className="btn-icon text-gray-400 hover:text-primary-600"
              title="Copy to clipboard"
            >
              <Copy size={16} className={isLoading ? 'animate-pulse' : ''} />
            </button>

            {/* More Actions */}
            {(onEdit || onDelete) && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(!showMenu)
                  }}
                  className="btn-icon text-gray-400 hover:text-gray-600"
                  title="More actions"
                >
                  <MoreVertical size={16} />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                    {onEdit && (
                      <button
                        onClick={() => handleMenuAction('edit')}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => handleMenuAction('delete')}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 last:rounded-b-lg"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click overlay for menu close */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}

export default PromptCard