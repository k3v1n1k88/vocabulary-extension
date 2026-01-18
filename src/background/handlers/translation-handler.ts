/**
 * Translation Handler Module
 * Handles translation operations including LLM and free API.
 */

import { translateToTargetLanguage, translateText } from '@/shared/translation-service'
import { translateWithFreeApi } from '@/shared/free-translation-api'

/**
 * Handle TRANSLATE_TEXT message - translate using configured method.
 */
export async function handleTranslateText(
  payload: { text: string; targetLanguage?: string },
  sendResponse: (response: unknown) => void
): Promise<void> {
  const { text, targetLanguage } = payload
  // If targetLanguage provided, use translateText directly; otherwise use translateToTargetLanguage
  const translation = targetLanguage
    ? await translateText(text, targetLanguage)
    : await translateToTargetLanguage(text)
  sendResponse({ success: true, data: translation })
}

/**
 * Handle TRANSLATE_SWAP message - retranslate using free API with specified languages.
 */
export async function handleTranslateSwap(
  payload: { text: string; sourceLangCode: string; targetLangCode: string },
  sendResponse: (response: unknown) => void
): Promise<void> {
  const { text, sourceLangCode, targetLangCode } = payload
  const translation = await translateWithFreeApi(text, targetLangCode, sourceLangCode)
  sendResponse(translation)
}
