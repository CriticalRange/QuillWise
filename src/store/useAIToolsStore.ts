import { create } from 'zustand'

interface AIToolsStore {
  // Prompt Tool State
  promptTool: {
    inputText: string
    generatedPrompt: string
    promptType: 'creative' | 'analytical' | 'conversational' | 'technical'
    isGenerating: boolean
    history: Array<{ input: string; output: string; type: string; timestamp: Date }>
  }
  
  // Translation Tool State
  translationTool: {
    inputText: string
    translatedText: string
    sourceLanguage: string
    targetLanguage: string
    isTranslating: boolean
    history: Array<{ input: string; output: string; from: string; to: string; timestamp: Date }>
  }
  
  // Summarization Tool State
  summarizationTool: {
    inputText: string
    summary: string
    summaryType: 'brief' | 'detailed' | 'bullet'
    summaryLength: 'short' | 'medium' | 'long'
    isSummarizing: boolean
    history: Array<{ input: string; output: string; type: string; length: string; timestamp: Date }>
  }
  
  // Enhancement Tool State
  enhancementTool: {
    inputText: string
    enhancedText: string
    enhancementType: 'grammar' | 'style' | 'tone' | 'clarity'
    targetTone: 'professional' | 'casual' | 'academic' | 'creative'
    isEnhancing: boolean
    history: Array<{ input: string; output: string; type: string; tone: string; timestamp: Date }>
  }
  
  // General Actions
  clearHistory: (tool: 'prompt' | 'translation' | 'summarization' | 'enhancement') => void
  exportHistory: (tool: 'prompt' | 'translation' | 'summarization' | 'enhancement') => string
  
  // Prompt Tool Actions
  setPromptInput: (text: string) => void
  setPromptType: (type: 'creative' | 'analytical' | 'conversational' | 'technical') => void
  generatePrompt: () => Promise<void>
  setGeneratedPrompt: (prompt: string) => void
  addToPromptHistory: (input: string, output: string, type: string) => void
  
  // Translation Tool Actions
  setTranslationInput: (text: string) => void
  setSourceLanguage: (language: string) => void
  setTargetLanguage: (language: string) => void
  swapLanguages: () => void
  translateText: () => Promise<void>
  setTranslatedText: (text: string) => void
  addToTranslationHistory: (input: string, output: string, from: string, to: string) => void
  
  // Summarization Tool Actions
  setSummarizationInput: (text: string) => void
  setSummaryType: (type: 'brief' | 'detailed' | 'bullet') => void
  setSummaryLength: (length: 'short' | 'medium' | 'long') => void
  summarizeText: () => Promise<void>
  setSummary: (summary: string) => void
  addToSummarizationHistory: (input: string, output: string, type: string, length: string) => void
  
  // Enhancement Tool Actions
  setEnhancementInput: (text: string) => void
  setEnhancementType: (type: 'grammar' | 'style' | 'tone' | 'clarity') => void
  setTargetTone: (tone: 'professional' | 'casual' | 'academic' | 'creative') => void
  enhanceText: () => Promise<void>
  setEnhancedText: (text: string) => void
  addToEnhancementHistory: (input: string, output: string, type: string, tone: string) => void
}

const initialState = {
  promptTool: {
    inputText: '',
    generatedPrompt: '',
    promptType: 'creative' as const,
    isGenerating: false,
    history: []
  },
  translationTool: {
    inputText: '',
    translatedText: '',
    sourceLanguage: 'auto',
    targetLanguage: 'en',
    isTranslating: false,
    history: []
  },
  summarizationTool: {
    inputText: '',
    summary: '',
    summaryType: 'brief' as const,
    summaryLength: 'medium' as const,
    isSummarizing: false,
    history: []
  },
  enhancementTool: {
    inputText: '',
    enhancedText: '',
    enhancementType: 'grammar' as const,
    targetTone: 'professional' as const,
    isEnhancing: false,
    history: []
  }
}

export const useAIToolsStore = create<AIToolsStore>((set, get) => ({
  ...initialState,
  
  // General Actions
  clearHistory: (tool) => {
    set((state) => ({
      ...state,
      [`${tool}Tool`]: {
        ...state[`${tool}Tool` as keyof typeof state],
        history: []
      }
    }))
  },
  
  exportHistory: (tool) => {
    const state = get()
    const toolState = state[`${tool}Tool` as keyof typeof state] as any
    return JSON.stringify(toolState.history, null, 2)
  },
  
  // Prompt Tool Actions
  setPromptInput: (text) => {
    set((state) => ({
      promptTool: { ...state.promptTool, inputText: text }
    }))
  },
  
  setPromptType: (type) => {
    set((state) => ({
      promptTool: { ...state.promptTool, promptType: type }
    }))
  },
  
  generatePrompt: async () => {
    const { promptTool } = get()
    if (!promptTool.inputText.trim()) return
    
    set((state) => ({
      promptTool: { ...state.promptTool, isGenerating: true }
    }))
    
    try {
      // Call real prompt generation API
      const generatedPrompt = await callPromptGenerationAPI(
        promptTool.inputText,
        promptTool.promptType
      )
      
      set((state) => ({
        promptTool: {
          ...state.promptTool,
          generatedPrompt,
          isGenerating: false
        }
      }))
      
      // Add to history
      get().addToPromptHistory(promptTool.inputText, generatedPrompt, promptTool.promptType)
      
    } catch (error) {
      console.error('Failed to generate prompt:', error)
      
      // Handle different error types with user-friendly messages
      let userMessage = 'Prompt generation failed'
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes('503') || errorMsg.includes('service unavailable')) {
          userMessage = '⚠️ AI service is temporarily overloaded. Please try again in a few minutes.'
        } else if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
          userMessage = '🔑 API key is invalid. Please check your API key in Settings.'
        } else if (errorMsg.includes('no api key')) {
          userMessage = '⚠️ No API key configured. Please add your API key in Settings.'
        } else if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
          userMessage = '⏱️ Rate limit exceeded. Please wait a moment and try again.'
        } else {
          userMessage = `❌ ${error.message}`
        }
      }
      
      set((state) => ({
        promptTool: { 
          ...state.promptTool, 
          isGenerating: false,
          generatedPrompt: userMessage
        }
      }))
      
      // Don't add failed prompts to history
    }
  },
  
  setGeneratedPrompt: (prompt) => {
    set((state) => ({
      promptTool: { ...state.promptTool, generatedPrompt: prompt }
    }))
  },
  
  addToPromptHistory: (input, output, type) => {
    set((state) => ({
      promptTool: {
        ...state.promptTool,
        history: [{ input, output, type, timestamp: new Date() }, ...state.promptTool.history.slice(0, 49)]
      }
    }))
  },
  
  // Translation Tool Actions
  setTranslationInput: (text) => {
    set((state) => ({
      translationTool: { ...state.translationTool, inputText: text }
    }))
  },
  
  setSourceLanguage: (language) => {
    set((state) => ({
      translationTool: { ...state.translationTool, sourceLanguage: language }
    }))
  },
  
  setTargetLanguage: (language) => {
    set((state) => ({
      translationTool: { ...state.translationTool, targetLanguage: language }
    }))
  },
  
  swapLanguages: () => {
    set((state) => {
      const { sourceLanguage, targetLanguage, translatedText, inputText } = state.translationTool
      return {
        translationTool: {
          ...state.translationTool,
          sourceLanguage: targetLanguage,
          targetLanguage: sourceLanguage,
          inputText: translatedText,
          translatedText: inputText
        }
      }
    })
  },
  
  translateText: async () => {
    const { translationTool } = get()
    if (!translationTool.inputText.trim()) return
    
    set((state) => ({
      translationTool: { ...state.translationTool, isTranslating: true }
    }))
    
    try {
      // Call real translation API
      const translationResult = await callTranslationAPI(
        translationTool.inputText,
        translationTool.sourceLanguage,
        translationTool.targetLanguage
      )
      
      set((state) => ({
        translationTool: {
          ...state.translationTool,
          translatedText: translationResult,
          isTranslating: false
        }
      }))
      
      // Add to history
      get().addToTranslationHistory(
        translationTool.inputText,
        translationResult,
        translationTool.sourceLanguage,
        translationTool.targetLanguage
      )
      
    } catch (error) {
      console.error('Failed to translate text:', error)
      
      // Handle different error types with user-friendly messages
      let userMessage = 'Translation failed'
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes('503') || errorMsg.includes('service unavailable')) {
          userMessage = '⚠️ AI service is temporarily overloaded. Please try again in a few minutes.'
        } else if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
          userMessage = '🔑 API key is invalid. Please check your API key in Settings.'
        } else if (errorMsg.includes('no api key')) {
          userMessage = '⚠️ No API key configured. Please add your API key in Settings.'
        } else if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
          userMessage = '⏱️ Rate limit exceeded. Please wait a moment and try again.'
        } else {
          userMessage = `❌ ${error.message}`
        }
      }
      
      set((state) => ({
        translationTool: { 
          ...state.translationTool, 
          isTranslating: false,
          translatedText: userMessage
        }
      }))
      
      // Don't add failed translations to history
    }
  },
  
  setTranslatedText: (text) => {
    set((state) => ({
      translationTool: { ...state.translationTool, translatedText: text }
    }))
  },
  
  addToTranslationHistory: (input, output, from, to) => {
    set((state) => ({
      translationTool: {
        ...state.translationTool,
        history: [{ input, output, from, to, timestamp: new Date() }, ...state.translationTool.history.slice(0, 49)]
      }
    }))
  },
  
  // Summarization Tool Actions
  setSummarizationInput: (text) => {
    set((state) => ({
      summarizationTool: { ...state.summarizationTool, inputText: text }
    }))
  },
  
  setSummaryType: (type) => {
    set((state) => ({
      summarizationTool: { ...state.summarizationTool, summaryType: type }
    }))
  },
  
  setSummaryLength: (length) => {
    set((state) => ({
      summarizationTool: { ...state.summarizationTool, summaryLength: length }
    }))
  },
  
  summarizeText: async () => {
    const { summarizationTool } = get()
    if (!summarizationTool.inputText.trim()) return
    
    set((state) => ({
      summarizationTool: { ...state.summarizationTool, isSummarizing: true }
    }))
    
    try {
      // Call real summarization API
      const summaryResult = await callSummarizationAPI(
        summarizationTool.inputText,
        summarizationTool.summaryType,
        summarizationTool.summaryLength
      )
      
      set((state) => ({
        summarizationTool: {
          ...state.summarizationTool,
          summary: summaryResult,
          isSummarizing: false
        }
      }))
      
      // Add to history
      get().addToSummarizationHistory(
        summarizationTool.inputText,
        summaryResult,
        summarizationTool.summaryType,
        summarizationTool.summaryLength
      )
      
    } catch (error) {
      console.error('Failed to summarize text:', error)
      
      // Handle different error types with user-friendly messages
      let userMessage = 'Summarization failed'
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes('503') || errorMsg.includes('service unavailable')) {
          userMessage = '⚠️ AI service is temporarily overloaded. Please try again in a few minutes.'
        } else if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
          userMessage = '🔑 API key is invalid. Please check your API key in Settings.'
        } else if (errorMsg.includes('no api key')) {
          userMessage = '⚠️ No API key configured. Please add your API key in Settings.'
        } else if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
          userMessage = '⏱️ Rate limit exceeded. Please wait a moment and try again.'
        } else {
          userMessage = `❌ ${error.message}`
        }
      }
      
      set((state) => ({
        summarizationTool: { 
          ...state.summarizationTool, 
          isSummarizing: false,
          summary: userMessage
        }
      }))
      
      // Don't add failed summarizations to history
    }
  },
  
  setSummary: (summary) => {
    set((state) => ({
      summarizationTool: { ...state.summarizationTool, summary }
    }))
  },
  
  addToSummarizationHistory: (input, output, type, length) => {
    set((state) => ({
      summarizationTool: {
        ...state.summarizationTool,
        history: [{ input, output, type, length, timestamp: new Date() }, ...state.summarizationTool.history.slice(0, 49)]
      }
    }))
  },
  
  // Enhancement Tool Actions
  setEnhancementInput: (text) => {
    set((state) => ({
      enhancementTool: { ...state.enhancementTool, inputText: text }
    }))
  },
  
  setEnhancementType: (type) => {
    set((state) => ({
      enhancementTool: { ...state.enhancementTool, enhancementType: type }
    }))
  },
  
  setTargetTone: (tone) => {
    set((state) => ({
      enhancementTool: { ...state.enhancementTool, targetTone: tone }
    }))
  },
  
  enhanceText: async () => {
    const { enhancementTool } = get()
    if (!enhancementTool.inputText.trim()) return
    
    set((state) => ({
      enhancementTool: { ...state.enhancementTool, isEnhancing: true }
    }))
    
    try {
      // Call real enhancement API
      const enhancementResult = await callEnhancementAPI(
        enhancementTool.inputText,
        enhancementTool.enhancementType,
        enhancementTool.targetTone
      )
      
      set((state) => ({
        enhancementTool: {
          ...state.enhancementTool,
          enhancedText: enhancementResult,
          isEnhancing: false
        }
      }))
      
      // Add to history
      get().addToEnhancementHistory(
        enhancementTool.inputText,
        enhancementResult,
        enhancementTool.enhancementType,
        enhancementTool.targetTone
      )
      
    } catch (error) {
      console.error('Failed to enhance text:', error)
      
      // Handle different error types with user-friendly messages
      let userMessage = 'Enhancement failed'
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes('503') || errorMsg.includes('service unavailable')) {
          userMessage = '⚠️ AI service is temporarily overloaded. Please try again in a few minutes.'
        } else if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
          userMessage = '🔑 API key is invalid. Please check your API key in Settings.'
        } else if (errorMsg.includes('no api key')) {
          userMessage = '⚠️ No API key configured. Please add your API key in Settings.'
        } else if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
          userMessage = '⏱️ Rate limit exceeded. Please wait a moment and try again.'
        } else {
          userMessage = `❌ ${error.message}`
        }
      }
      
      set((state) => ({
        enhancementTool: { 
          ...state.enhancementTool, 
          isEnhancing: false,
          enhancedText: userMessage
        }
      }))
      
      // Don't add failed enhancements to history
    }
  },
  
  setEnhancedText: (text) => {
    set((state) => ({
      enhancementTool: { ...state.enhancementTool, enhancedText: text }
    }))
  },
  
  addToEnhancementHistory: (input, output, type, tone) => {
    set((state) => ({
      enhancementTool: {
        ...state.enhancementTool,
        history: [{ input, output, type, tone, timestamp: new Date() }, ...state.enhancementTool.history.slice(0, 49)]
      }
    }))
  }
}))

// Prompt Generation API - Multi-provider support
async function callPromptGenerationAPI(text: string, promptType: string): Promise<string> {
  try {
    const settings = localStorage.getItem('quillwise_settings') ? 
                     JSON.parse(localStorage.getItem('quillwise_settings')!) : null
    
    let provider = 'gemini'
    let apiKey = null
    
    if (settings?.aiSettings) {
      provider = settings.aiSettings.provider || 'gemini'
      if (provider === 'openai') {
        apiKey = localStorage.getItem('openai_api_key') ||
                 settings.aiSettings.openaiApiKey
      } else if (provider === 'gemini') {
        apiKey = localStorage.getItem('gemini_api_key') ||
                 settings.aiSettings.geminiApiKey
      }
    }
    
    // Only require API key for cloud providers
    if (provider !== 'ollama' && !apiKey) {
      throw new Error(`No API key found for ${provider}. Please configure your API key in Settings.`)
    }

    const prompt = buildPromptGenerationPrompt(text, promptType)

    if (provider === 'openai') {
      return await callOpenAIAPI(prompt, apiKey, settings?.aiSettings?.model || 'gpt-3.5-turbo')
    } else if (provider === 'gemini') {
      return await callGeminiAPI(prompt, apiKey, settings?.aiSettings?.model || 'gemini-1.5-flash')
    } else if (provider === 'ollama') {
      return await callOllamaAPI(prompt, settings?.aiSettings?.ollamaUrl || 'http://localhost:11434', settings?.aiSettings?.ollamaModel || 'llama3.2')
    }

    throw new Error(`Unsupported prompt generation provider: ${provider}`)
  } catch (error) {
    console.error('Prompt generation API failed:', error)
    throw error // Don't fallback, force user to configure API key
  }
}

// Translation API - Multi-provider support
async function callTranslationAPI(text: string, fromLang: string, toLang: string): Promise<string> {
  try {
    // Get settings from localStorage
    const settings = localStorage.getItem('quillwise_settings') ? 
                     JSON.parse(localStorage.getItem('quillwise_settings')!) : null
    
    // Determine provider and API key
    let provider = 'gemini'
    let apiKey = null
    
    if (settings?.aiSettings) {
      provider = settings.aiSettings.provider || 'gemini'
      if (provider === 'openai') {
        apiKey = localStorage.getItem('openai_api_key') ||
                 settings.aiSettings.openaiApiKey
      } else if (provider === 'gemini') {
        apiKey = localStorage.getItem('gemini_api_key') ||
                 settings.aiSettings.geminiApiKey
      }
    } else {
      // Fallback to localStorage only
      if (localStorage.getItem('openai_api_key')) {
        provider = 'openai'
        apiKey = localStorage.getItem('openai_api_key')
      } else if (localStorage.getItem('gemini_api_key')) {
        provider = 'gemini'
        apiKey = localStorage.getItem('gemini_api_key')
      }
    }
    
    // Only require API key for cloud providers
    if (provider !== 'ollama' && !apiKey) {
      throw new Error(`No API key found for ${provider}. Please configure your API key in Settings.`)
    }

    const prompt = `Translate the following text from ${getLanguageName(fromLang)} to ${getLanguageName(toLang)}. Return only the translated text, no explanations:\n\n${text}`

    if (provider === 'openai') {
      return await callOpenAIAPI(prompt, apiKey, settings?.aiSettings?.model || 'gpt-3.5-turbo')
    } else if (provider === 'gemini') {
      return await callGeminiAPI(prompt, apiKey, settings?.aiSettings?.model || 'gemini-1.5-flash')
    } else if (provider === 'ollama') {
      return await callOllamaAPI(prompt, settings?.aiSettings?.ollamaUrl || 'http://localhost:11434', settings?.aiSettings?.ollamaModel || 'llama3.2')
    }

    throw new Error(`Unsupported translation provider: ${provider}`)
  } catch (error) {
    console.error('Translation API failed:', error)
    throw error // Don't fallback, force user to configure API key
  }
}

// Summarization API - Multi-provider support
async function callSummarizationAPI(text: string, type: string, length: string): Promise<string> {
  try {
    const settings = localStorage.getItem('quillwise_settings') ? 
                     JSON.parse(localStorage.getItem('quillwise_settings')!) : null
    
    let provider = 'gemini'
    let apiKey = null
    
    if (settings?.aiSettings) {
      provider = settings.aiSettings.provider || 'gemini'
      if (provider === 'openai') {
        apiKey = localStorage.getItem('openai_api_key') ||
                 settings.aiSettings.openaiApiKey
      } else if (provider === 'gemini') {
        apiKey = localStorage.getItem('gemini_api_key') ||
                 settings.aiSettings.geminiApiKey
      }
    }
    
    // Only require API key for cloud providers
    if (provider !== 'ollama' && !apiKey) {
      throw new Error(`No API key found for ${provider}. Please configure your API key in Settings.`)
    }

    const prompt = buildSummarizationPrompt(text, type, length)

    if (provider === 'openai') {
      return await callOpenAIAPI(prompt, apiKey, settings?.aiSettings?.model || 'gpt-3.5-turbo')
    } else if (provider === 'gemini') {
      return await callGeminiAPI(prompt, apiKey, settings?.aiSettings?.model || 'gemini-1.5-flash')
    } else if (provider === 'ollama') {
      return await callOllamaAPI(prompt, settings?.aiSettings?.ollamaUrl || 'http://localhost:11434', settings?.aiSettings?.ollamaModel || 'llama3.2')
    }

    throw new Error(`Unsupported summarization provider: ${provider}`)
  } catch (error) {
    console.error('Summarization API failed:', error)
    throw error // Don't fallback, force user to configure API key
  }
}

// Enhancement API - Multi-provider support
async function callEnhancementAPI(text: string, enhancementType: string, targetTone: string): Promise<string> {
  try {
    const settings = localStorage.getItem('quillwise_settings') ? 
                     JSON.parse(localStorage.getItem('quillwise_settings')!) : null
    
    let provider = 'gemini'
    let apiKey = null
    
    if (settings?.aiSettings) {
      provider = settings.aiSettings.provider || 'gemini'
      if (provider === 'openai') {
        apiKey = localStorage.getItem('openai_api_key') ||
                 settings.aiSettings.openaiApiKey
      } else if (provider === 'gemini') {
        apiKey = localStorage.getItem('gemini_api_key') ||
                 settings.aiSettings.geminiApiKey
      }
    }
    
    // Only require API key for cloud providers
    if (provider !== 'ollama' && !apiKey) {
      throw new Error(`No API key found for ${provider}. Please configure your API key in Settings.`)
    }

    const prompt = buildEnhancementPrompt(text, enhancementType, targetTone)

    if (provider === 'openai') {
      return await callOpenAIAPI(prompt, apiKey, settings?.aiSettings?.model || 'gpt-3.5-turbo')
    } else if (provider === 'gemini') {
      return await callGeminiAPI(prompt, apiKey, settings?.aiSettings?.model || 'gemini-1.5-flash')
    } else if (provider === 'ollama') {
      return await callOllamaAPI(prompt, settings?.aiSettings?.ollamaUrl || 'http://localhost:11434', settings?.aiSettings?.ollamaModel || 'llama3.2')
    }

    throw new Error(`Unsupported enhancement provider: ${provider}`)
  } catch (error) {
    console.error('Enhancement API failed:', error)
    throw error // Don't fallback, force user to configure API key
  }
}

// Helper functions
function getLanguageName(code: string): string {
  const languages: { [key: string]: string } = {
    'auto': 'auto-detected language',
    'en': 'English',
    'tr': 'Turkish',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi'
  }
  return languages[code] || code
}

function buildSummarizationPrompt(text: string, type: string, length: string): string {
  const typeDescriptions = {
    'brief': 'Create a brief overview of the main points',
    'detailed': 'Provide a comprehensive summary with context',
    'bullet': 'Present key points as bullet points'
  }
  
  const lengthDescriptions = {
    'short': 'in 1-2 sentences',
    'medium': 'in 3-5 sentences',
    'long': 'in 6+ sentences'
  }
  
  return `${typeDescriptions[type as keyof typeof typeDescriptions]} ${lengthDescriptions[length as keyof typeof lengthDescriptions]}. Return ONLY the summary, no explanations or additional text:\n\n${text}`
}

function buildEnhancementPrompt(text: string, enhancementType: string, targetTone: string): string {
  const typeDescriptions = {
    'grammar': `Fix grammar, spelling, and punctuation errors in the following text. Return ONLY the corrected text, no explanations or alternatives`,
    'style': `Improve sentence structure and writing flow in the following text while maintaining a ${targetTone} tone. Return ONLY the improved text, no explanations or alternatives`,
    'tone': `Adjust the tone of the following text to be more ${targetTone}. Return ONLY the rewritten text, no explanations or alternatives`,
    'clarity': `Make the following text clearer and more concise while maintaining a ${targetTone} tone. Return ONLY the improved text, no explanations or alternatives`
  }
  
  return `${typeDescriptions[enhancementType as keyof typeof typeDescriptions]}:\n\n"${text}"`
}

function buildPromptGenerationPrompt(text: string, promptType: string): string {
  const typeDescriptions = {
    'creative': `Create an engaging and imaginative prompt about "${text}". Focus on vivid descriptions, emotional resonance, and unique perspectives. Generate a creative writing prompt that encourages exploration of unexpected angles or metaphors.`,
    'analytical': `Generate an analytical prompt about "${text}". Create a prompt that asks to systematically break down key components, examine relationships between different elements, identify patterns or trends, and provide evidence-based insights from multiple perspectives.`,
    'conversational': `Create a conversational prompt about "${text}". Generate a discussion starter that encourages thoughtful exploration of this topic, including personal experiences, questions, and different perspectives.`,
    'technical': `Generate a technical prompt about "${text}". Create a prompt that asks for detailed technical explanations, including specific methodologies, processes, or frameworks. The prompt should encourage breaking down complex concepts into understandable components.`
  }
  
  return typeDescriptions[promptType as keyof typeof typeDescriptions] || typeDescriptions.creative
}


// Generic API call functions for reuse
async function callOpenAIAPI(prompt: string, apiKey: string, model: string = 'gpt-3.5-turbo'): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Provide clear, concise, and professional responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content?.trim() || 'No response generated'
}

async function callGeminiAPI(prompt: string, apiKey: string, model: string = 'gemini-1.5-flash'): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
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
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No response generated'
}

async function callOllamaAPI(prompt: string, ollamaUrl: string = 'http://localhost:11434', model: string = 'llama3.2'): Promise<string> {
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false
    })
  })

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.response?.trim() || 'No response generated'
}

