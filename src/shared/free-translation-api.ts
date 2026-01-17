import type { TranslationResult } from '../types'
import { SUPPORTED_LANGUAGES } from '../types'

/**
 * MyMemory Translation API (free, reliable)
 * Docs: https://mymemory.translated.net/doc/spec.php
 */
const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get'

/**
 * Translate using free MyMemory API
 * Features:
 * - No API key required
 * - 1000 words/day free (sufficient for personal use)
 * - Reliable and stable service
 * @param sourceLangCode - Optional source language code. Defaults to 'en' (English)
 */
export async function translateWithFreeApi(
  text: string,
  targetLangCode: string,
  sourceLangCode?: string
): Promise<TranslationResult> {
  const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === targetLangCode)
  const targetLangName = targetLang?.name || 'Vietnamese'

  // Use provided source language or default to English
  const sourceLang = sourceLangCode || 'en'
  const sourceLangObj = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang)

  const url = new URL(MYMEMORY_ENDPOINT)
  url.searchParams.set('q', text)
  url.searchParams.set('langpair', `${sourceLang}|${targetLangCode}`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(url.toString(), { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Free translation service unavailable')
    }

    const data = await response.json()

    if (data.responseStatus !== 200) {
      throw new Error(data.responseDetails || 'Translation failed')
    }

    // Validate response data exists
    if (!data.responseData || !data.responseData.translatedText) {
      console.error('[FreeTranslation] Invalid response:', data)
      throw new Error('Invalid response from translation service')
    }

    // Use provided source language name or default to English
    const sourceLanguageName = sourceLangObj?.name || 'English'

    return {
      originalText: text,
      translatedText: data.responseData.translatedText,
      sourceLanguage: sourceLanguageName,
      targetLanguage: targetLangName,
      sourceLangCode: sourceLang,
      targetLangCode: targetLangCode,
      isPhrase: text.trim().split(/\s+/).length > 1,
      isFreeTranslation: true
    }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Translation timed out. Please try again.')
      }
      // Preserve original error message if it's already a meaningful error
      if (error.message && !error.message.includes('fetch')) {
        throw error
      }
    }
    console.error('[FreeTranslation] Error:', error)
    throw new Error('Free translation service unavailable. Please try again later.')
  }
}
