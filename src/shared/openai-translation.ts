import type { TranslationResult } from '../types'
import { SUPPORTED_LANGUAGES } from '../types'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

/**
 * Get OpenAI API key from chrome.storage
 */
async function getApiKey(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      resolve(result.openaiApiKey || null)
    })
  })
}

/**
 * Get target language from settings
 */
async function getTargetLanguage(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings-storage'], (result) => {
      try {
        const parsed = result['settings-storage'] ? JSON.parse(result['settings-storage']) : null
        // Settings are nested under state.settings (Zustand persist structure)
        const langCode = parsed?.state?.settings?.targetLanguage || parsed?.state?.targetLanguage || 'vi'
        console.log('[VocabExt] Target language from settings:', langCode)
        const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
        resolve(lang ? lang.name : 'Vietnamese')
      } catch (e) {
        console.warn('[VocabExt] Failed to get target language:', e)
        resolve('Vietnamese') // Default fallback
      }
    })
  })
}

/**
 * Save OpenAI API key to chrome.storage
 */
export async function saveApiKey(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ openaiApiKey: apiKey }, resolve)
  })
}

/**
 * Detect if text is a phrase (multiple words) or single word
 */
export function isPhrase(text: string): boolean {
  const words = text.trim().split(/\s+/)
  return words.length > 1
}

/**
 * Translate text using OpenAI API
 */
export async function translateText(
  text: string,
  targetLanguage: string
): Promise<TranslationResult> {
  const apiKey = await getApiKey()

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set it in extension settings.')
  }

  const isTextPhrase = isPhrase(text)

  const systemPrompt = isTextPhrase
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

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.choices?.[0]?.message?.content?.trim() || ''

    // Parse source language from response
    const sourceMatch = responseText.match(/^Source:\s*(.+)$/m)
    const sourceLanguage = sourceMatch?.[1]?.trim() || 'Auto-detected'

    // Extract translation
    const translationMatch = responseText.match(/Translation:\s*(.+?)(?:\n|$)/m)
    const translatedText = translationMatch?.[1]?.trim() || responseText

    // Extract synonyms (for single words)
    const synonymsMatch = responseText.match(/Synonyms:\s*(.+?)(?:\n|$)/m)
    const synonymsText = synonymsMatch?.[1]?.trim()
    const synonyms = synonymsText && synonymsText.toLowerCase() !== 'none'
      ? synonymsText.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
      : undefined

    // Extract antonyms (for single words)
    const antonymsMatch = responseText.match(/Antonyms:\s*(.+?)(?:\n|$)/m)
    const antonymsText = antonymsMatch?.[1]?.trim()
    const antonyms = antonymsText && antonymsText.toLowerCase() !== 'none'
      ? antonymsText.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0)
      : undefined

    // Extract note
    const noteMatch = responseText.match(/Note:\s*(.+?)$/m)
    const noteText = noteMatch?.[1]?.trim()
    const note = noteText && noteText.toLowerCase() !== 'none' ? noteText : undefined

    return {
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      isPhrase: isTextPhrase,
      synonyms,
      antonyms,
      note
    }
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

