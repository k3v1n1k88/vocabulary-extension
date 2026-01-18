/**
 * Translation Response Parser Module
 * Parses LLM responses into structured TranslationResult objects.
 */

import type { TranslationResult, LLMProvider } from '../types'
import { SUPPORTED_LANGUAGES } from '../types'

/**
 * Map language name to code for TTS.
 */
export function languageNameToCode(langName: string): string {
  const name = langName.toLowerCase()
  const langMap: Record<string, string> = {
    'english': 'en', 'vietnamese': 'vi', 'chinese': 'zh', 'japanese': 'ja',
    'korean': 'ko', 'spanish': 'es', 'french': 'fr', 'german': 'de',
    'portuguese': 'pt', 'russian': 'ru', 'thai': 'th', 'indonesian': 'id',
    'malay': 'id', 'arabic': 'ar', 'hindi': 'hi', 'italian': 'it',
    'dutch': 'nl', 'polish': 'pl', 'turkish': 'tr', 'swedish': 'sv'
  }
  // Check for partial matches (e.g., "Thai language" -> "th")
  for (const [lang, code] of Object.entries(langMap)) {
    if (name.includes(lang)) return code
  }
  return 'en' // Default fallback
}

/**
 * Parse response text from provider-specific format.
 */
export function parseProviderResponse(provider: LLMProvider, data: unknown): string {
  if (provider === 'gemini') {
    const geminiData = data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    return geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  } else {
    const openaiData = data as { choices?: Array<{ message?: { content?: string } }> }
    return openaiData.choices?.[0]?.message?.content?.trim() || ''
  }
}

/**
 * Parse translation result from LLM response text.
 */
export function parseTranslationResult(
  responseText: string,
  originalText: string,
  targetLanguage: string,
  isTextPhrase: boolean
): TranslationResult {
  // Extract source language
  const sourceMatch = responseText.match(/^Source:\s*(.+)$/m)
  const sourceLanguage = sourceMatch?.[1]?.trim() || 'Auto-detected'
  const sourceLangCode = languageNameToCode(sourceLanguage)

  // Get target language code from SUPPORTED_LANGUAGES
  const targetLang = SUPPORTED_LANGUAGES.find(l => l.name === targetLanguage)
  const targetLangCode = targetLang?.code || 'vi'

  // Fixed regex: capture multi-line translation until next field marker or end of string
  const translationMatch = responseText.match(/Translation:\s*([\s\S]+?)(?=\n(?:Synonyms|Antonyms|Note):|\s*$)/)
  const translatedText = translationMatch?.[1]?.trim() || responseText

  // Extract synonyms
  const synonymsMatch = responseText.match(/Synonyms:\s*(.+?)(?:\n|$)/m)
  const synonymsText = synonymsMatch?.[1]?.trim()
  const synonyms = synonymsText && synonymsText.toLowerCase() !== 'none'
    ? synonymsText.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : undefined

  // Extract antonyms
  const antonymsMatch = responseText.match(/Antonyms:\s*(.+?)(?:\n|$)/m)
  const antonymsText = antonymsMatch?.[1]?.trim()
  const antonyms = antonymsText && antonymsText.toLowerCase() !== 'none'
    ? antonymsText.split(',').map(a => a.trim()).filter(a => a.length > 0)
    : undefined

  // Extract note
  const noteMatch = responseText.match(/Note:\s*(.+?)$/m)
  const noteText = noteMatch?.[1]?.trim()
  const note = noteText && noteText.toLowerCase() !== 'none' ? noteText : undefined

  return {
    originalText,
    translatedText,
    sourceLanguage,
    targetLanguage,
    sourceLangCode,
    targetLangCode,
    isPhrase: isTextPhrase,
    synonyms,
    antonyms,
    note,
    isFreeTranslation: false // AI translation
  }
}
