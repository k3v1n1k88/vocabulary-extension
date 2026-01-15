import type { ProviderConfig, LLMProvider } from '../types'

export const LLM_PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    models: [
      { id: 'gpt-4o-mini', description: 'Fast & cheap - Best for translations' },
      { id: 'gpt-4o', description: 'Most capable - Better quality, higher cost' },
      { id: 'gpt-4-turbo', description: 'Balanced - Good quality & speed' }
    ],
    authType: 'bearer',
    apiKeyStorageKey: 'openaiApiKey',
    registerUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    defaultModel: 'gemini-2.0-flash',
    models: [
      { id: 'gemini-2.0-flash', description: 'Latest & fastest - Recommended' },
      { id: 'gemini-1.5-flash', description: 'Fast & efficient - Good for simple tasks' },
      { id: 'gemini-1.5-pro', description: 'Most capable - Complex translations' }
    ],
    authType: 'header',
    apiKeyStorageKey: 'geminiApiKey',
    registerUrl: 'https://aistudio.google.com/apikey'
  },
  {
    id: 'grok',
    name: 'xAI Grok',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    defaultModel: 'grok-2',
    models: [
      { id: 'grok-2', description: 'Latest model - Best quality' },
      { id: 'grok-beta', description: 'Beta version - Experimental features' }
    ],
    authType: 'bearer',
    apiKeyStorageKey: 'grokApiKey',
    registerUrl: 'https://console.x.ai'
  }
]

export function getProviderConfig(providerId: LLMProvider): ProviderConfig {
  return LLM_PROVIDERS.find(p => p.id === providerId) || LLM_PROVIDERS[0]
}
