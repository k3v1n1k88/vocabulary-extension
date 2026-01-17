import type { TranslationResult, LLMProvider } from '../types'
import { SUPPORTED_LANGUAGES } from '../types'
import { getProviderConfig } from './llm-provider-config'
import { translateWithFreeApi } from './free-translation-api'

/**
 * Get API key for specified provider from chrome.storage
 */
async function getApiKey(provider: LLMProvider): Promise<string | null> {
  const config = getProviderConfig(provider)
  return new Promise((resolve) => {
    chrome.storage.local.get([config.apiKeyStorageKey], (result) => {
      resolve(result[config.apiKeyStorageKey] || null)
    })
  })
}

/**
 * Get selected LLM provider from settings
 */
async function getSelectedProvider(): Promise<LLMProvider> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings-storage'], (result) => {
      try {
        const parsed = result['settings-storage'] ? JSON.parse(result['settings-storage']) : null
        const provider = parsed?.state?.settings?.llmProvider || 'openai'
        resolve(provider as LLMProvider)
      } catch {
        resolve('openai')
      }
    })
  })
}

/**
 * Get target language name from settings
 */
async function getTargetLanguage(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings-storage'], (result) => {
      try {
        const parsed = result['settings-storage'] ? JSON.parse(result['settings-storage']) : null
        const langCode = parsed?.state?.settings?.targetLanguage || 'vi'
        const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
        resolve(lang ? lang.name : 'Vietnamese')
      } catch {
        resolve('Vietnamese')
      }
    })
  })
}

/**
 * Get target language code from settings (e.g., 'vi', 'en')
 */
async function getTargetLanguageCode(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings-storage'], (result) => {
      try {
        const parsed = result['settings-storage'] ? JSON.parse(result['settings-storage']) : null
        resolve(parsed?.state?.settings?.targetLanguage || 'vi')
      } catch {
        resolve('vi')
      }
    })
  })
}

/**
 * Get source language code from settings (for free translation)
 */
async function getSourceLanguageCode(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings-storage'], (result) => {
      try {
        const parsed = result['settings-storage'] ? JSON.parse(result['settings-storage']) : null
        resolve(parsed?.state?.settings?.sourceLanguage || 'en')
      } catch {
        resolve('en')
      }
    })
  })
}

/**
 * Check if LLM translation is enabled in settings
 */
async function isLLMTranslationEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings-storage'], (result) => {
      try {
        const parsed = result['settings-storage'] ? JSON.parse(result['settings-storage']) : null
        // Default to false - use free API by default
        resolve(parsed?.state?.settings?.useLLMTranslation ?? false)
      } catch {
        resolve(false)
      }
    })
  })
}

/**
 * Save API key for specified provider
 */
export async function saveApiKey(apiKey: string, provider: LLMProvider = 'openai'): Promise<void> {
  const config = getProviderConfig(provider)
  return new Promise((resolve) => {
    chrome.storage.local.set({ [config.apiKeyStorageKey]: apiKey }, resolve)
  })
}

/**
 * Detect if text is a phrase (multiple words)
 */
export function isPhrase(text: string): boolean {
  return text.trim().split(/\s+/).length > 1
}

/**
 * Test API key connection for a provider
 */
export async function testConnection(provider: LLMProvider, apiKey: string): Promise<boolean> {
  // Check network connectivity first
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('No internet connection. Please check your network.')
  }

  const config = getProviderConfig(provider)
  const testPrompt = { system: 'Reply only with: OK', user: 'Test' }

  const { url, options } = provider === 'gemini'
    ? buildGeminiRequest(config.endpoint, config.defaultModel, apiKey, testPrompt.system, testPrompt.user)
    : buildOpenAIRequest(config.endpoint, config.defaultModel, apiKey, testPrompt.system, testPrompt.user)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const errorMsg = (error as { error?: { message?: string } }).error?.message
      throw new Error(errorMsg || `${config.name} API error: ${response.status}`)
    }

    return true
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Connection test timed out.')
    }
    throw error
  }
}

/**
 * Build translation prompt (same for all providers)
 */
function buildPrompt(text: string, targetLanguage: string, isTextPhrase: boolean): { system: string; user: string } {
  const system = isTextPhrase
    ? `You are a translator. Detect the source language and translate the given text to ${targetLanguage}.
Format your response as:
Source: [detected language]
Translation: [translation]`
    : `You are a translator and language expert. For the given word:
1. Detect the source language
2. Translate to ${targetLanguage}
3. Provide 2-4 synonyms (similar words in the SOURCE language)
4. Provide 2-4 antonyms (opposite words in the SOURCE language) if applicable
5. Brief usage note if the word has multiple meanings

Format your response EXACTLY as:
Source: [detected language]
Translation: [translation in ${targetLanguage}]
Synonyms: [comma-separated synonyms in source language]
Antonyms: [comma-separated antonyms in source language, or "none" if not applicable]
Note: [brief note, or "none" if straightforward]`

  return { system, user: text }
}

/**
 * Build request for OpenAI/Grok (same format)
 */
function buildOpenAIRequest(
  endpoint: string,
  model: string,
  apiKey: string,
  system: string,
  user: string
): { url: string; options: RequestInit } {
  return {
    url: endpoint,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    }
  }
}

/**
 * Build request for Gemini (uses x-goog-api-key header)
 */
function buildGeminiRequest(
  endpoint: string,
  model: string,
  apiKey: string,
  system: string,
  user: string
): { url: string; options: RequestInit } {
  return {
    url: `${endpoint}/${model}:generateContent`,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500
        }
      })
    }
  }
}

/**
 * Parse response text from provider-specific format
 */
function parseProviderResponse(provider: LLMProvider, data: unknown): string {
  if (provider === 'gemini') {
    const geminiData = data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    return geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  } else {
    const openaiData = data as { choices?: Array<{ message?: { content?: string } }> }
    return openaiData.choices?.[0]?.message?.content?.trim() || ''
  }
}

/**
 * Parse translation result from LLM response text
 */
function parseTranslationResult(
  responseText: string,
  originalText: string,
  targetLanguage: string,
  isTextPhrase: boolean
): TranslationResult {
  const sourceMatch = responseText.match(/^Source:\s*(.+)$/m)
  const sourceLanguage = sourceMatch?.[1]?.trim() || 'Auto-detected'

  // Fixed regex: capture multi-line translation until next field marker or end of string
  // Note: removed 'm' flag so $ matches end of string, not end of line
  const translationMatch = responseText.match(/Translation:\s*([\s\S]+?)(?=\n(?:Synonyms|Antonyms|Note):|\s*$)/)
  const translatedText = translationMatch?.[1]?.trim() || responseText

  const synonymsMatch = responseText.match(/Synonyms:\s*(.+?)(?:\n|$)/m)
  const synonymsText = synonymsMatch?.[1]?.trim()
  const synonyms = synonymsText && synonymsText.toLowerCase() !== 'none'
    ? synonymsText.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : undefined

  const antonymsMatch = responseText.match(/Antonyms:\s*(.+?)(?:\n|$)/m)
  const antonymsText = antonymsMatch?.[1]?.trim()
  const antonyms = antonymsText && antonymsText.toLowerCase() !== 'none'
    ? antonymsText.split(',').map(a => a.trim()).filter(a => a.length > 0)
    : undefined

  const noteMatch = responseText.match(/Note:\s*(.+?)$/m)
  const noteText = noteMatch?.[1]?.trim()
  const note = noteText && noteText.toLowerCase() !== 'none' ? noteText : undefined

  return {
    originalText,
    translatedText,
    sourceLanguage,
    targetLanguage,
    isPhrase: isTextPhrase,
    synonyms,
    antonyms,
    note,
    isFreeTranslation: false // AI translation
  }
}

/**
 * Translate text using selected LLM provider
 */
export async function translateText(
  text: string,
  targetLanguage: string
): Promise<TranslationResult> {
  // Check network connectivity first
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('No internet connection. Please check your network.')
  }

  // Check if LLM translation is enabled
  const useLLM = await isLLMTranslationEnabled()

  // Use free API if LLM is disabled or no API key configured
  if (!useLLM) {
    const [targetLangCode, sourceLangCode] = await Promise.all([
      getTargetLanguageCode(),
      getSourceLanguageCode()
    ])
    return translateWithFreeApi(text, targetLangCode, sourceLangCode)
  }

  const provider = await getSelectedProvider()
  const config = getProviderConfig(provider)
  const apiKey = await getApiKey(provider)

  // Show error if AI enabled but no API key - user can disable AI in settings
  if (!apiKey) {
    throw new Error(`${config.name} API key not configured. Add your key in Settings or disable AI translation.`)
  }

  const isTextPhrase = isPhrase(text)
  const { system, user } = buildPrompt(text, targetLanguage, isTextPhrase)

  // Build provider-specific request
  const { url, options } = provider === 'gemini'
    ? buildGeminiRequest(config.endpoint, config.defaultModel, apiKey, system, user)
    : buildOpenAIRequest(config.endpoint, config.defaultModel, apiKey, system, user)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const errorMsg = (error as { error?: { message?: string } }).error?.message
      throw new Error(errorMsg || `${config.name} API error: ${response.status}`)
    }

    const data = await response.json()
    const responseText = parseProviderResponse(provider, data)

    if (!responseText) {
      throw new Error(`${config.name} returned empty response. Please try again.`)
    }

    return parseTranslationResult(responseText, text, targetLanguage, isTextPhrase)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Translation timed out. Please try again.')
    }
    throw error
  }
}

/**
 * Translate text to user's configured target language
 */
export async function translateToTargetLanguage(text: string): Promise<TranslationResult> {
  const targetLanguage = await getTargetLanguage()
  return translateText(text, targetLanguage)
}
