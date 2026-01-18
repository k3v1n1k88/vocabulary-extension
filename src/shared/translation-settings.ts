/**
 * Translation Settings Module
 * Handles reading/writing translation settings from chrome.storage.
 */

import type { LLMProvider } from '../types'
import { SUPPORTED_LANGUAGES } from '../types'
import { getProviderConfig } from './llm-provider-config'

/**
 * Get API key for specified provider from chrome.storage.
 */
export async function getApiKey(provider: LLMProvider): Promise<string | null> {
  const config = getProviderConfig(provider)
  return new Promise((resolve) => {
    chrome.storage.local.get([config.apiKeyStorageKey], (result) => {
      resolve(result[config.apiKeyStorageKey] || null)
    })
  })
}

/**
 * Save API key for specified provider.
 */
export async function saveApiKey(apiKey: string, provider: LLMProvider = 'openai'): Promise<void> {
  const config = getProviderConfig(provider)
  return new Promise((resolve) => {
    chrome.storage.local.set({ [config.apiKeyStorageKey]: apiKey }, resolve)
  })
}

/**
 * Get selected LLM provider from settings.
 */
export async function getSelectedProvider(): Promise<LLMProvider> {
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
 * Get target language name from settings (e.g., 'Vietnamese').
 */
export async function getTargetLanguage(): Promise<string> {
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
 * Get target language code from settings (e.g., 'vi', 'en').
 */
export async function getTargetLanguageCode(): Promise<string> {
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
 * Get source language code from settings (for free translation).
 */
export async function getSourceLanguageCode(): Promise<string> {
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
 * Check if LLM translation is enabled in settings.
 */
export async function isLLMTranslationEnabled(): Promise<boolean> {
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
