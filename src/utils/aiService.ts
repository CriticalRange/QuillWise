import { ollamaService } from './ollamaService'

interface AIServiceConfig {
  apiKey?: string
  model?: string
  maxTokens?: number
  baseURL?: string
  provider?: 'openai' | 'gemini' | 'ollama'
  // Ollama specific
  ollamaUrl?: string
  ollamaModel?: string
  temperature?: number
}

interface SuggestionRequest {
  text: string
  context?: string
  type?: 'improve' | 'complete' | 'rephrase' | 'summarize'
}

interface SuggestionResponse {
  suggestion: string
  confidence: number
  type: string
}

class AIService {
  private cache: Map<string, SuggestionResponse> = new Map()
  private config: AIServiceConfig

  constructor(config: AIServiceConfig = {}) {
    this.config = {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      baseURL: 'https://api.openai.com/v1',
      ...config
    }
  }

  // Generate AI suggestion for text improvement
  async generateSuggestion(request: SuggestionRequest): Promise<SuggestionResponse> {
    const { text, context = 'general', type = 'improve' } = request
    
    // Create cache key
    const cacheKey = `${text}-${context}-${type}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    try {
      // Require API key for cloud providers only
      if (this.config.provider !== 'ollama' && !this.config.apiKey) {
        throw new Error('API key is required. Please configure your AI API key in settings.')
      }
      
      const suggestion = await this.callRealAPI(text, type, context)
      
      const response: SuggestionResponse = {
        suggestion,
        confidence: 0.85,
        type
      }
      
      // Cache the response
      this.cache.set(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('AI Service error:', error)
      throw error
    }
  }

  // Call real AI API
  private async callRealAPI(text: string, type: string, context: string): Promise<string> {
    const prompt = this.buildPrompt(text, type, context)
    
    switch (this.config.provider) {
      case 'openai':
        return await this.callOpenAI(prompt)
      case 'gemini':
        return await this.callGemini(prompt)
      case 'ollama':
        return await this.callOllama(prompt)
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`)
    }
  }

  // Build prompt based on task type
  private buildPrompt(text: string, type: string, context: string): string {
    // Handle translation context specially
    if (context === 'translation') {
      return `Translate the following text to Turkish. If the text is already in Turkish, translate it to English. Provide only the translation:\n\n"${text}"\n\nTranslation:`
    }

    const basePrompts = {
      improve: `Improve the following text to make it clearer, more engaging, and more professional. Keep the same meaning but enhance the language:\n\n"${text}"\n\nImproved version:`,
      complete: `Complete the following text in a natural and contextually appropriate way:\n\n"${text}"\n\nCompletion:`,
      rephrase: `Rephrase the following text using different words while maintaining the same meaning:\n\n"${text}"\n\nRephrased version:`,
      summarize: `Summarize the following text concisely while keeping the key points:\n\n"${text}"\n\nSummary:`
    }

    return basePrompts[type as keyof typeof basePrompts] || basePrompts.improve
  }

  // OpenAI API call
  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI writing assistant. Provide clear, concise, and professional responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content?.trim() || 'No response generated'
  }


  // Google Gemini API call
  private async callGemini(prompt: string): Promise<string> {
    // Use the correct Gemini model names
    const modelName = this.config.model || 'gemini-1.5-flash'
    const validModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-pro-vision']
    const finalModel = validModels.includes(modelName) ? modelName : 'gemini-1.5-flash'
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent?key=${this.config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: this.config.temperature || 0.7,
          maxOutputTokens: this.config.maxTokens || 1000,
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API Error Response:', errorText)
      
      if (response.status === 404) {
        throw new Error(`Gemini model "${finalModel}" not found. Check your model name.`)
      } else if (response.status === 400) {
        throw new Error(`Gemini API request invalid. Check your API key and request format.`)
      } else if (response.status === 403) {
        throw new Error(`Gemini API access forbidden. Check your API key permissions.`)
      } else {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
      }
    }

    const data = await response.json()
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini returned no candidates. The content might be blocked.')
    }
    
    const content = data.candidates[0]?.content?.parts?.[0]?.text
    if (!content) {
      throw new Error('Gemini returned empty content. The response might be blocked.')
    }
    
    return content.trim()
  }

  // Ollama API call
  private async callOllama(prompt: string): Promise<string> {
    try {
      // Update Ollama service URL if configured
      if (this.config.ollamaUrl) {
        ollamaService.setBaseUrl(this.config.ollamaUrl)
      }

      const model = this.config.ollamaModel || this.config.model || 'llama3.2'
      const result = await ollamaService.generateCompletion(prompt, model, {
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 1000
      })

      return result.trim() || 'No response generated'
    } catch (error) {
      console.error('Ollama API error:', error)
      throw new Error(`Ollama API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get multiple suggestion types for a text
  async getMultipleSuggestions(text: string, context?: string): Promise<SuggestionResponse[]> {
    const types: Array<'improve' | 'complete' | 'rephrase' | 'summarize'> = ['improve', 'rephrase']
    
    if (text.length > 50) {
      types.push('summarize')
    }
    
    if (text.length < 100) {
      types.push('complete')
    }
    
    const suggestions = await Promise.all(
      types.map(type => this.generateSuggestion({ text, context, type }))
    )
    
    return suggestions
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear()
  }

  // Get cache size
  getCacheSize(): number {
    return this.cache.size
  }

  // Ollama specific methods
  async testOllamaConnection(): Promise<boolean> {
    if (this.config.provider !== 'ollama') return false
    
    if (this.config.ollamaUrl) {
      ollamaService.setBaseUrl(this.config.ollamaUrl)
    }
    
    return await ollamaService.testConnection()
  }

  async getAvailableOllamaModels(): Promise<string[]> {
    if (this.config.provider !== 'ollama') return []
    
    if (this.config.ollamaUrl) {
      ollamaService.setBaseUrl(this.config.ollamaUrl)
    }
    
    try {
      const models = await ollamaService.listModels()
      return models.map(model => model.name)
    } catch (error) {
      console.error('Failed to get Ollama models:', error)
      return []
    }
  }

  async pullOllamaModel(modelName: string, onProgress?: (progress: any) => void): Promise<boolean> {
    if (this.config.provider !== 'ollama') return false
    
    if (this.config.ollamaUrl) {
      ollamaService.setBaseUrl(this.config.ollamaUrl)
    }
    
    return await ollamaService.pullModel(modelName, onProgress)
  }

  // Smart provider selection based on content sensitivity
  shouldUseLocalProvider(text: string): boolean {
    if (this.config.provider === 'ollama') return true
    
    // Check if local processing is preferred for sensitive content
    const settings = JSON.parse(localStorage.getItem('quillwise_settings') || '{}')
    if (settings.aiSettings?.useLocalForSensitive && settings.aiSettings?.sensitiveContentDetection) {
      return ollamaService.detectSensitiveContent(text)
    }
    
    return false
  }

  // Update configuration with settings
  updateConfig(aiSettings: any): void {
    if (aiSettings) {
      this.config = {
        ...this.config,
        provider: aiSettings.provider || 'gemini',
        apiKey: aiSettings.provider === 'ollama' ? undefined : 
                aiSettings.provider === 'gemini' ? aiSettings.geminiApiKey : aiSettings.openaiApiKey,
        model: aiSettings.model || (aiSettings.provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-3.5-turbo'),
        maxTokens: aiSettings.maxTokens || 1000,
        temperature: aiSettings.temperature || 0.7,
        ollamaUrl: aiSettings.ollamaUrl || 'http://localhost:11434',
        ollamaModel: aiSettings.ollamaModel || 'llama3.2',
      }
      
      console.log('AI Service config updated:', {
        provider: this.config.provider,
        model: this.config.model,
        hasApiKey: !!this.config.apiKey,
        ollamaUrl: this.config.ollamaUrl
      })
    }
  }
}

// Export singleton instance
export const aiService = new AIService()

// Export types
export type { SuggestionRequest, SuggestionResponse, AIServiceConfig }