/**
 * Translation Settings Module
 * Handles reading/writing translation settings from chrome.storage.
 *
 * Settings + API keys live in chrome.storage.sync (issue #5: cross-device
 * config sync). Reads fall back to chrome.storage.local for legacy v1.0.5
 * data; writes always go to sync.
 */

import type { LLMProvider } from '../types'
import { SUPPORTED_LANGUAGES } from '../types'
import { getProviderConfig } from './llm-provider-config'
import { getSettings } from './settings-storage-access'

interface TranslationSettings {
  llmProvider?: LLMProvider
  llmModel?: string
  targetLanguage?: string
  sourceLanguage?: string
  useLLMTranslation?: boolean
}

/**
 * Get API key for specified provider from chrome.storage.
 * Sync first; legacy local fallback for users upgrading from v1.0.5.
 */
export async function getApiKey(provider: LLMProvider): Promise<string | null> {
  const { apiKeyStorageKey } = getProviderConfig(provider)
  const sync = await chrome.storage.sync.get([apiKeyStorageKey])
  if (sync[apiKeyStorageKey]) return sync[apiKeyStorageKey] as string
  const local = await chrome.storage.local.get([apiKeyStorageKey])
  const legacy = local[apiKeyStorageKey] as string | undefined
  if (legacy) {
    // Best-effort migrate; ignore quota errors.
    try {
      await chrome.storage.sync.set({ [apiKeyStorageKey]: legacy })
    } catch {
      // ignore
    }
    return legacy
  }
  return null
}

/**
 * Save API key for specified provider (writes to sync storage).
 */
export async function saveApiKey(apiKey: string, provider: LLMProvider = 'openai'): Promise<void> {
  const { apiKeyStorageKey } = getProviderConfig(provider)
  await chrome.storage.sync.set({ [apiKeyStorageKey]: apiKey })
}

/**
 * Get selected LLM provider from settings.
 */
export async function getSelectedProvider(): Promise<LLMProvider> {
  const settings = await getSettings<TranslationSettings>()
  return settings?.llmProvider || 'openai'
}

/**
 * Resolve the model to send to the provider.
 *
 * Returns the user-selected model only when it belongs to the given provider's
 * own model list; otherwise falls back to the provider default. This prevents
 * sending a foreign model ID left over from a previous provider selection, and
 * keeps behavior unchanged when no model has been chosen.
 */
export async function getSelectedModel(provider: LLMProvider): Promise<string> {
  const settings = await getSettings<TranslationSettings>()
  const config = getProviderConfig(provider)
  const selected = settings?.llmModel
  return selected && config.models.some(m => m.id === selected)
    ? selected
    : config.defaultModel
}

/**
 * Get target language name from settings (e.g., 'Vietnamese').
 */
export async function getTargetLanguage(): Promise<string> {
  const settings = await getSettings<TranslationSettings>()
  const langCode = settings?.targetLanguage || 'vi'
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
  return lang ? lang.name : 'Vietnamese'
}

/**
 * Get target language code from settings (e.g., 'vi', 'en').
 */
export async function getTargetLanguageCode(): Promise<string> {
  const settings = await getSettings<TranslationSettings>()
  return settings?.targetLanguage || 'vi'
}

/**
 * Get source language code from settings (for free translation).
 */
export async function getSourceLanguageCode(): Promise<string> {
  const settings = await getSettings<TranslationSettings>()
  return settings?.sourceLanguage || 'en'
}

/**
 * Check if LLM translation is enabled in settings.
 */
export async function isLLMTranslationEnabled(): Promise<boolean> {
  const settings = await getSettings<TranslationSettings>()
  return settings?.useLLMTranslation ?? false
}
