export interface Prompt {
  id: string
  title: string
  content: string
  categoryId: string
  tags: string[]
  isFavorite: boolean
  usageCount: number
  lastUsedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  createdAt: Date
}

export interface AppSettings {
  globalHotkey: string
  theme: 'light' | 'dark' | 'system'
  fontSize: number
  autoHide: boolean

  onboardingCompleted?: boolean
  clipboardReplacement?: boolean
  windowBounds?: {
    width: number
    height: number
    x?: number
    y?: number
  }

  // AI API Settings
  aiSettings?: {
    provider: 'openai' | 'gemini' | 'ollama'
    openaiApiKey?: string
    geminiApiKey?: string
    model?: string
    maxTokens?: number
    temperature?: number
    // Ollama specific settings
    ollamaUrl?: string
    ollamaModel?: string
    // Privacy settings
    useLocalForSensitive?: boolean
    sensitiveContentDetection?: boolean
  }
  // Overlay Position Settings
  overlaySettings?: {
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'cursor'
    offset: { x: number; y: number }
    followCursor: boolean
    stayOnScreen: boolean
    alwaysOnTop: boolean
  }
}



export interface PromptSuggestion {
  prompt: Prompt
  relevanceScore: number
  reason: string
}

export interface SearchFilters {
  category?: string
  isFavorite?: boolean
  searchTerm?: string
}

export interface UsageStats {
  totalUsage: number
  promptUsage: Record<string, number>
  categoryUsage: Record<string, number>
  lastActiveDate: Date
}