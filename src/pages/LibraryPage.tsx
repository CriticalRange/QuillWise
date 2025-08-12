import React from 'react'
import { Plus, Search, Download, Upload, FolderPlus } from 'lucide-react'
import { usePromptStore } from '../store/usePromptStore'
import PromptCard from '../components/PromptCard'
import { Prompt, Category } from '../types'
import { cn } from '../utils'

const LibraryPage: React.FC = () => {
  const {
    prompts,
    categories,
    addPrompt,
    updatePrompt,
    deletePrompt,
    addCategory
  } = usePromptStore()
  

  const [showAddPrompt, setShowAddPrompt] = React.useState(false)
  const [showAddCategory, setShowAddCategory] = React.useState(false)
  const [editingPrompt, setEditingPrompt] = React.useState<Prompt | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState('all')
  const [sortBy, setSortBy] = React.useState<'name' | 'created' | 'updated' | 'usage'>('updated')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')

  const filteredPrompts = React.useMemo(() => {
    let filtered = prompts
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(prompt => 
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(prompt => prompt.categoryId === selectedCategory)
    }
    
    // Sort prompts
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title)
          break
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        case 'usage':
          comparison = a.usageCount - b.usageCount
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return filtered
  }, [prompts, searchTerm, selectedCategory, sortBy, sortOrder])

  const handleAddPrompt = (promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => {
    addPrompt({
      ...promptData,
      usageCount: 0
    })
    setShowAddPrompt(false)
  }

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setShowAddPrompt(true)
  }

  const handleUpdatePrompt = (promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    if (editingPrompt) {
      updatePrompt(editingPrompt.id, promptData)
      setEditingPrompt(null)
      setShowAddPrompt(false)
    }
  }

  const handleAddCategory = (name: string, color: string, icon: string = 'folder') => {
    addCategory({ name, color, icon })
    setShowAddCategory(false)
  }

  const exportPrompts = () => {
    const dataStr = JSON.stringify({ prompts, categories }, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `prompts-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importPrompts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.prompts && Array.isArray(data.prompts)) {
          data.prompts.forEach((prompt: any) => {
            addPrompt({
              title: prompt.title,
              content: prompt.content,
              categoryId: prompt.categoryId,
              tags: prompt.tags || [],
              isFavorite: prompt.isFavorite || false,
              usageCount: prompt.usageCount || 0
            })
          })
        }
        if (data.categories && Array.isArray(data.categories)) {
          data.categories.forEach((category: any) => {
            addCategory({
              name: category.name,
              color: category.color,
              icon: category.icon || 'folder'
            })
          })
        }
      } catch (error) {
        console.error('Failed to import prompts:', error)
        alert('Failed to import prompts. Please check the file format.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Prompt Library
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your collection of AI prompts
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddCategory(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
            
            <button
              onClick={() => setShowAddPrompt(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Prompt</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input min-w-[150px]"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split('-')
              setSortBy(sort as any)
              setSortOrder(order as any)
            }}
            className="input min-w-[150px]"
          >
            <option value="updated-desc">Recently Updated</option>
            <option value="created-desc">Recently Created</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="usage-desc">Most Used</option>
            <option value="usage-asc">Least Used</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept=".json"
              onChange={importPrompts}
              className="hidden"
              id="import-prompts"
            />
            <label
              htmlFor="import-prompts"
              className="btn-secondary flex items-center space-x-2 cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </label>
            
            <button
              onClick={exportPrompts}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {filteredPrompts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm ? 'No prompts found' : 'No prompts yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm
                ? 'Try adjusting your search terms or filters'
                : 'Create your first prompt to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddPrompt(true)}
                className="btn-primary"
              >
                Create First Prompt
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={() => handleEditPrompt(prompt)}
                onDelete={() => deletePrompt(prompt.id)}
                showActions
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Prompt Modal */}
      {showAddPrompt && (
        <PromptModal
          prompt={editingPrompt}
          categories={categories}
          onSave={editingPrompt ? handleUpdatePrompt : handleAddPrompt}
          onClose={() => {
            setShowAddPrompt(false)
            setEditingPrompt(null)
          }}
        />
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <CategoryModal
          onSave={handleAddCategory}
          onClose={() => setShowAddCategory(false)}
        />
      )}
    </div>
  )
}

// Prompt Modal Component
interface PromptModalProps {
  prompt?: Prompt | null
  categories: Category[]
  onSave: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}

const PromptModal: React.FC<PromptModalProps> = ({ prompt, categories, onSave, onClose }) => {
  const [title, setTitle] = React.useState(prompt?.title || '')
  const [content, setContent] = React.useState(prompt?.content || '')
  const [categoryId, setCategoryId] = React.useState(prompt?.categoryId || categories[0]?.id || '')
  const [tags, setTags] = React.useState(prompt?.tags?.join(', ') || '')
  const [isFavorite, setIsFavorite] = React.useState(prompt?.isFavorite || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    onSave({
      title: title.trim(),
      content: content.trim(),
      categoryId,
      tags: tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
      isFavorite,
      usageCount: 0
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {prompt ? 'Edit Prompt' : 'Add New Prompt'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="Enter prompt title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input min-h-[120px] resize-y"
                placeholder="Enter your prompt content..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input"
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="input"
                placeholder="e.g., writing, creative, business"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="favorite"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="favorite" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Add to favorites
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {prompt ? 'Update' : 'Create'} Prompt
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Category Modal Component
interface CategoryModalProps {
  onSave: (name: string, color: string, icon: string) => void
  onClose: () => void
}

const CategoryModal: React.FC<CategoryModalProps> = ({ onSave, onClose }) => {
  const [name, setName] = React.useState('')
  const [color, setColor] = React.useState('#3B82F6')
  const [icon, setIcon] = React.useState('folder')

  const colorOptions = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), color, icon)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Add New Category
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Enter category name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon
              </label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="input"
              >
                <option value="folder">📁 Folder</option>
                <option value="edit">✏️ Edit</option>
                <option value="code">💻 Code</option>
                <option value="lightbulb">💡 Lightbulb</option>
                <option value="briefcase">💼 Briefcase</option>
                <option value="star">⭐ Star</option>
                <option value="heart">❤️ Heart</option>
                <option value="bookmark">🔖 Bookmark</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      color === colorOption
                        ? 'border-gray-900 dark:border-gray-100 scale-110'
                        : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                    )}
                    style={{ backgroundColor: colorOption }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Create Category
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LibraryPage