interface OllamaResponse {
  model: string
  created_at: string
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

interface OllamaModel {
  name: string
  size: number
  digest: string
  details: {
    format: string
    family: string
    families: string[]
    parameter_size: string
    quantization_level: string
  }
  modified_at: string
}

interface OllamaListResponse {
  models: OllamaModel[]
}

export class OllamaService {
  public baseUrl: string
  private defaultTimeout = 30000 // 30 seconds

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  }

  // Update base URL
  setBaseUrl(url: string) {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url
  }

  // Test Ollama connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        // timeout: 5000, // Not supported in standard fetch
      })
      return response.ok
    } catch (error) {
      console.error('Ollama connection test failed:', error)
      return false
    }
  }

  // List available models
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        // timeout: 10000, // Not supported in standard fetch
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: OllamaListResponse = await response.json()
      return data.models || []
    } catch (error) {
      console.error('Failed to list Ollama models:', error)
      throw error
    }
  }

  // Generate text completion
  async generateCompletion(
    prompt: string, 
    model: string = 'llama3.2',
    options?: {
      temperature?: number
      max_tokens?: number
      stream?: boolean
    }
  ): Promise<string> {
    try {
      const body = {
        model,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature || 0.7,
          num_predict: options?.max_tokens || 1000,
        }
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout)

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: OllamaResponse = await response.json()
      return data.response || ''
    } catch (error) {
      console.error('Ollama generation failed:', error)
      throw error
    }
  }

  // Generate streaming completion
  async generateStreamingCompletion(
    prompt: string,
    model: string = 'llama3.2',
    onChunk: (chunk: string) => void,
    options?: {
      temperature?: number
      max_tokens?: number
    }
  ): Promise<string> {
    try {
      const body = {
        model,
        prompt,
        stream: true,
        options: {
          temperature: options?.temperature || 0.7,
          num_predict: options?.max_tokens || 1000,
        }
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      let fullResponse = ''
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body reader available')
      }

      let reading = true
      while (reading) {
        const { done, value } = await reader.read()
        if (done) {
          reading = false
          break
        }

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const data: OllamaResponse = JSON.parse(line)
            if (data.response) {
              fullResponse += data.response
              onChunk(data.response)
            }
            if (data.done) {
              return fullResponse
            }
          } catch (parseError) {
            console.warn('Failed to parse streaming chunk:', parseError)
          }
        }
      }

      return fullResponse
    } catch (error) {
      console.error('Ollama streaming failed:', error)
      throw error
    }
  }

  // Check if a model is available
  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.listModels()
      return models.some(model => model.name.includes(modelName))
    } catch (error) {
      console.error('Failed to check model availability:', error)
      return false
    }
  }

  // Pull a model from Ollama
  async pullModel(modelName: string, onProgress?: (progress: any) => void): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
          stream: !!onProgress
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (onProgress && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        let pullReading = true
        while (pullReading) {
          const { done, value } = await reader.read()
          if (done) {
            pullReading = false
            break
          }

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())

          for (const line of lines) {
            try {
              const progress = JSON.parse(line)
              onProgress(progress)
              if (progress.status === 'success') {
                return true
              }
            } catch (parseError) {
              console.warn('Failed to parse pull progress:', parseError)
            }
          }
        }
      }

      return true
    } catch (error) {
      console.error('Failed to pull model:', error)
      return false
    }
  }

  // Detect sensitive content (simple heuristics)
  detectSensitiveContent(text: string): boolean {
    const sensitivePatterns = [
      // Personal information
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{16}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
      
      // Keywords that might indicate sensitive content
      /\b(password|secret|confidential|private|ssn|credit.?card|bank.?account)\b/i,
      
      // Financial information
      /\$\d+[,.]?\d*/, // Dollar amounts
      /\b(routing|account).{0,10}\d{8,}\b/i,
      
      // Medical information
      /\b(medical|health|diagnosis|prescription|patient)\b/i,
    ]

    return sensitivePatterns.some(pattern => pattern.test(text))
  }

  // Smart provider selection
  shouldUseOllama(text: string, settings: any): boolean {
    // Always use Ollama if explicitly configured for sensitive content
    if (settings?.useLocalForSensitive && settings?.sensitiveContentDetection) {
      return this.detectSensitiveContent(text)
    }

    // Use Ollama if it's the selected provider
    return settings?.provider === 'ollama'
  }
}

// Global instance
export const ollamaService = new OllamaService()