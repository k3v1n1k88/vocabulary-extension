/**
 * Translation Service Module
 * Main orchestrator for translation operations using LLM providers or free API.
 * Delegates to specialized modules for settings, request building, and response parsing.
 */

import type { TranslationResult, LLMProvider } from '../types'
import { getProviderConfig } from './llm-provider-config'
import { translateWithFreeApi } from './free-translation-api'

// Settings helpers
import {
  getApiKey,
  getSelectedProvider,
  getTargetLanguage,
  getTargetLanguageCode,
  getSourceLanguageCode,
  isLLMTranslationEnabled
} from './translation-settings'

// Request builders
import { buildTranslationPrompt, buildProviderRequest } from './llm-request-builders'

// Response parsers
import { parseProviderResponse, parseTranslationResult, languageNameToCode } from './translation-response-parser'

// Re-export for external use
export { saveApiKey } from './translation-settings'
export { languageNameToCode }

/**
 * Detect if text is a phrase (multiple words).
 */
export function isPhrase(text: string): boolean {
  return text.trim().split(/\s+/).length > 1
}

/**
 * Test API key connection for a provider.
 */
export async function testConnection(provider: LLMProvider, apiKey: string): Promise<boolean> {
  // Check network connectivity first
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('No internet connection. Please check your network.')
  }

  const config = getProviderConfig(provider)
  const testPrompt = { system: 'Reply only with: OK', user: 'Test' }

  const { url, options } = buildProviderRequest(
    provider,
    config.endpoint,
    config.defaultModel,
    apiKey,
    testPrompt.system,
    testPrompt.user
  )

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
 * Translate text using selected LLM provider or free API.
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

  // Use free API if LLM is disabled
  if (!useLLM) {
    const [targetLangCode, sourceLangCode] = await Promise.all([
      getTargetLanguageCode(),
      getSourceLanguageCode()
    ])
    return translateWithFreeApi(text, targetLangCode, sourceLangCode)
  }

  // LLM translation flow
  const provider = await getSelectedProvider()
  const config = getProviderConfig(provider)
  const apiKey = await getApiKey(provider)

  // Show error if AI enabled but no API key
  if (!apiKey) {
    throw new Error(`${config.name} API key not configured. Add your key in Settings or disable AI translation.`)
  }

  const isTextPhrase = isPhrase(text)
  const { system, user } = buildTranslationPrompt(text, targetLanguage, isTextPhrase)

  // Build provider-specific request
  const { url, options } = buildProviderRequest(
    provider,
    config.endpoint,
    config.defaultModel,
    apiKey,
    system,
    user
  )

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
 * Translate text to user's configured target language.
 */
export async function translateToTargetLanguage(text: string): Promise<TranslationResult> {
  const targetLanguage = await getTargetLanguage()
  return translateText(text, targetLanguage)
}
