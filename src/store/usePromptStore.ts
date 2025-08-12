import { create } from 'zustand'
import { Prompt, Category, SearchFilters, PromptSuggestion } from '../types'

interface PromptStore {
  prompts: Prompt[]
  categories: Category[]
  isLoading: boolean
  searchFilters: SearchFilters
  selectedPrompt: Prompt | null
  
  // Actions
  loadData: () => Promise<void>
  addPrompt: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updatePrompt: (id: string, updates: Partial<Prompt>) => Promise<void>
  deletePrompt: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  incrementUsage: (id: string) => Promise<void>
  
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  
  setSearchFilters: (filters: SearchFilters) => void
  setSelectedPrompt: (prompt: Prompt | null) => void
  
  // Getters
  getFilteredPrompts: () => Prompt[]
  getSuggestedPrompts: (context?: string) => PromptSuggestion[]
  getPromptsByCategory: (categoryId: string) => Prompt[]
  getFavoritePrompts: () => Prompt[]
  getRecentPrompts: (limit?: number) => Prompt[]
}

const defaultCategories: Category[] = [
  {
    id: 'writing',
    name: 'Writing',
    color: '#3B82F6',
    icon: 'edit',
    createdAt: new Date()
  },
  {
    id: 'coding',
    name: 'Coding',
    color: '#10B981',
    icon: 'code',
    createdAt: new Date()
  },
  {
    id: 'creative',
    name: 'Creative',
    color: '#F59E0B',
    icon: 'lightbulb',
    createdAt: new Date()
  },
  {
    id: 'business',
    name: 'Business',
    color: '#EF4444',
    icon: 'briefcase',
    createdAt: new Date()
  }
]

const defaultPrompts: Prompt[] = [
  {
    id: 'improve-text',
    title: 'Improve Text',
    content: 'Please improve the following text to make it clearer, more professional, and better structured:\n\n{text}',
    categoryId: 'writing',
    tags: ['improvement', 'professional'],
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'explain-code',
    title: 'Explain Code',
    content: 'Please explain this code step by step and describe what it does:\n\n{text}',
    categoryId: 'coding',
    tags: ['explanation', 'programming'],
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'brainstorm-ideas',
    title: 'Brainstorm Ideas',
    content: 'Help me brainstorm creative ideas related to:\n\n{text}\n\nPlease provide 5-10 innovative suggestions.',
    categoryId: 'creative',
    tags: ['brainstorming', 'innovation'],
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'business-email',
    title: 'Professional Email',
    content: 'Help me write a professional business email about:\n\n{text}\n\nMake it polite, clear, and action-oriented.',
    categoryId: 'business',
    tags: ['email', 'communication'],
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export const usePromptStore = create<PromptStore>((set, get) => ({
  prompts: [],
  categories: [],
  isLoading: false,
  searchFilters: {},
  selectedPrompt: null,

  loadData: async () => {
    set({ isLoading: true })
    try {
      if (window.electronAPI && window.electronAPI.getPrompts && window.electronAPI.getCategories) {
        const [prompts, categories] = await Promise.all([
          window.electronAPI.getPrompts(),
          window.electronAPI.getCategories()
        ])
        
        // Parse date fields from JSON strings to Date objects
        const parsedPrompts = prompts.map(prompt => ({
          ...prompt,
          createdAt: new Date(prompt.createdAt),
          updatedAt: new Date(prompt.updatedAt)
        }))
        
        const parsedCategories = categories.map(category => ({
          ...category,
          createdAt: new Date(category.createdAt)
        }))
        
        // Initialize with default data if empty
        const finalPrompts = parsedPrompts.length > 0 ? parsedPrompts : defaultPrompts
        const finalCategories = parsedCategories.length > 0 ? parsedCategories : defaultCategories
        
        if (prompts.length === 0) {
          await window.electronAPI.savePrompts(defaultPrompts)
        }
        if (categories.length === 0) {
          await window.electronAPI.saveCategories(defaultCategories)
        }
        
        set({ 
          prompts: finalPrompts, 
          categories: finalCategories, 
          isLoading: false 
        })
      } else {
        // Fallback for development/browser mode
        set({ 
          prompts: defaultPrompts, 
          categories: defaultCategories, 
          isLoading: false 
        })
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      set({ 
        prompts: defaultPrompts, 
        categories: defaultCategories, 
        isLoading: false 
      })
    }
  },

  addPrompt: async (promptData) => {
    const newPrompt: Prompt = {
      ...promptData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const updatedPrompts = [...get().prompts, newPrompt]
    if (window.electronAPI && window.electronAPI.savePrompts) {
      await window.electronAPI.savePrompts(updatedPrompts)
    }
    set({ prompts: updatedPrompts })
  },

  updatePrompt: async (id, updates) => {
    const updatedPrompts = get().prompts.map(prompt => 
      prompt.id === id 
        ? { ...prompt, ...updates, updatedAt: new Date() }
        : prompt
    )
    
    if (window.electronAPI && window.electronAPI.savePrompts) {
      await window.electronAPI.savePrompts(updatedPrompts)
    }
    set({ prompts: updatedPrompts })
  },

  deletePrompt: async (id) => {
    const updatedPrompts = get().prompts.filter(prompt => prompt.id !== id)
    if (window.electronAPI && window.electronAPI.savePrompts) {
      await window.electronAPI.savePrompts(updatedPrompts)
    }
    set({ prompts: updatedPrompts })
  },

  toggleFavorite: async (id) => {
    const prompt = get().prompts.find(p => p.id === id)
    if (prompt) {
      await get().updatePrompt(id, { isFavorite: !prompt.isFavorite })
    }
  },

  incrementUsage: async (id) => {
    const prompt = get().prompts.find(p => p.id === id)
    if (prompt) {
      await get().updatePrompt(id, { usageCount: prompt.usageCount + 1 })
    }
  },

  addCategory: async (categoryData) => {
    const newCategory: Category = {
      ...categoryData,
      id: crypto.randomUUID(),
      createdAt: new Date()
    }
    
    const updatedCategories = [...get().categories, newCategory]
    if (window.electronAPI && window.electronAPI.saveCategories) {
      await window.electronAPI.saveCategories(updatedCategories)
    }
    set({ categories: updatedCategories })
  },

  updateCategory: async (id, updates) => {
    const updatedCategories = get().categories.map(category => 
      category.id === id ? { ...category, ...updates } : category
    )
    
    if (window.electronAPI && window.electronAPI.saveCategories) {
      await window.electronAPI.saveCategories(updatedCategories)
    }
    set({ categories: updatedCategories })
  },

  deleteCategory: async (id) => {
    const updatedCategories = get().categories.filter(category => category.id !== id)
    if (window.electronAPI && window.electronAPI.saveCategories) {
      await window.electronAPI.saveCategories(updatedCategories)
    }
    set({ categories: updatedCategories })
  },

  setSearchFilters: (filters) => {
    set({ searchFilters: filters })
  },

  setSelectedPrompt: (prompt) => {
    set({ selectedPrompt: prompt })
  },

  getFilteredPrompts: () => {
    const { prompts, searchFilters } = get()
    let filtered = [...prompts]
    
    if (searchFilters.category) {
      filtered = filtered.filter(p => p.categoryId === searchFilters.category)
    }
    
    if (searchFilters.isFavorite) {
      filtered = filtered.filter(p => p.isFavorite)
    }
    
    if (searchFilters.searchTerm) {
      const term = searchFilters.searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(term) ||
        p.content.toLowerCase().includes(term)
      )
    }
    
    return filtered.sort((a, b) => b.usageCount - a.usageCount)
  },

  getSuggestedPrompts: (context = '') => {
    const { prompts } = get()
    const contextLower = context.toLowerCase()
    
    return prompts
      .map(prompt => {
        let score = 0
        let reason = ''
        
        // Score based on usage count
        score += prompt.usageCount * 0.3
        
        // Score based on context matching
        if (contextLower.includes('code') || contextLower.includes('function')) {
          if (prompt.categoryId === 'coding') {
            score += 10
            reason = 'Matches coding context'
          }
        }
        
        if (contextLower.includes('email') || contextLower.includes('business')) {
          if (prompt.categoryId === 'business') {
            score += 10
            reason = 'Matches business context'
          }
        }
        
        if (contextLower.includes('creative') || contextLower.includes('idea')) {
          if (prompt.categoryId === 'creative') {
            score += 10
            reason = 'Matches creative context'
          }
        }
        
        // Boost favorites
        if (prompt.isFavorite) {
          score += 5
          reason = reason || 'Favorite prompt'
        }
        
        return {
          prompt,
          relevanceScore: score,
          reason: reason || 'General suggestion'
        }
      })
      .filter(suggestion => suggestion.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8)
  },

  getPromptsByCategory: (categoryId) => {
    return get().prompts.filter(p => p.categoryId === categoryId)
  },

  getFavoritePrompts: () => {
    return get().prompts.filter(p => p.isFavorite)
  },

  getRecentPrompts: (limit = 5) => {
    return get().prompts
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit)
  }
}))