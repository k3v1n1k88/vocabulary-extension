import type { ProviderConfig, LLMProvider } from '../types'

export const LLM_PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4.1-mini',
    models: [
      { id: 'gpt-4.1-mini', description: 'Fast & cheap - Best for translations' },
      { id: 'gpt-5-mini', description: 'Newer - Strong quality at low cost' },
      { id: 'gpt-4o-mini', description: 'Legacy cheap fallback' },
      { id: 'gpt-5', description: 'Most capable - Higher cost' }
    ],
    authType: 'bearer',
    apiKeyStorageKey: 'openaiApiKey',
    registerUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    defaultModel: 'gemini-2.5-flash',
    models: [
      { id: 'gemini-2.5-flash', description: 'Best price/performance - Recommended' },
      { id: 'gemini-3.1-flash-lite', description: 'Frontier-class at a fraction of the cost' },
      { id: 'gemini-3.5-flash', description: 'Most capable flash' },
      { id: 'gemini-2.5-pro', description: 'Complex translations' }
    ],
    authType: 'header',
    apiKeyStorageKey: 'geminiApiKey',
    registerUrl: 'https://aistudio.google.com/apikey'
  },
  {
    id: 'grok',
    name: 'xAI Grok',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    defaultModel: 'grok-4.3',
    models: [
      { id: 'grok-4.3', description: 'Latest flagship - Recommended' }
    ],
    authType: 'bearer',
    apiKeyStorageKey: 'grokApiKey',
    registerUrl: 'https://console.x.ai'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'google/gemini-2.5-flash',
    models: [
      { id: 'google/gemini-2.5-flash', description: 'Fast & cheap - Recommended' },
      { id: 'openai/gpt-4.1-mini', description: 'Fast & cheap OpenAI' },
      { id: 'anthropic/claude-haiku-4.5', description: 'Fast Anthropic' },
      { id: 'meta-llama/llama-3.3-70b-instruct', description: 'Open-weight, low cost' }
    ],
    authType: 'bearer',
    apiKeyStorageKey: 'openrouterApiKey',
    registerUrl: 'https://openrouter.ai/keys'
  }
]

export function getProviderConfig(providerId: LLMProvider): ProviderConfig {
  return LLM_PROVIDERS.find(p => p.id === providerId) || LLM_PROVIDERS[0]
}
