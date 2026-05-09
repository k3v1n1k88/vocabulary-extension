/**
 * Settings Manager Module
 * Manages cached settings state and storage synchronization.
 *
 * Settings live in chrome.storage.sync (issue #5: cross-device config sync).
 * Falls back to chrome.storage.local for legacy v1.0.5 installs that haven't
 * been migrated yet by the popup/options paths.
 */

import { SUPPORTED_LANGUAGES } from '@/types'
import { SETTINGS_KEY, patchSettings } from '@/shared/settings-storage-access'

// Cached settings state
let cachedTargetLanguage = 'Vietnamese'
let cachedSourceLanguage = 'English'
let cachedSourceLangCode = 'en'
let cachedUseLLMTranslation = false
let cachedHighlightColor = '#ffeb3b' // Default yellow

/**
 * Apply a parsed settings-storage payload to the cache.
 */
function applySettings(rawValue: string | undefined | null): void {
  if (!rawValue) return
  try {
    const parsed = JSON.parse(rawValue)
    const settings = parsed.state?.settings || parsed.state || {}
    const targetCode = settings.targetLanguage || 'vi'
    const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === targetCode)
    if (targetLang) {
      cachedTargetLanguage = targetLang.name
    }
    cachedSourceLangCode = settings.sourceLanguage || 'en'
    const sourceLang = SUPPORTED_LANGUAGES.find(l => l.code === cachedSourceLangCode)
    if (sourceLang) {
      cachedSourceLanguage = sourceLang.name
    }
    cachedUseLLMTranslation = settings.useLLMTranslation ?? false
    cachedHighlightColor = settings.highlightColor || '#ffeb3b'
  } catch (e) {
    console.warn('[VocabExt] Failed to parse settings:', e)
  }
}

/**
 * Initialize settings from storage. Sync first, fall back to local for legacy.
 */
export function initSettings(): void {
  chrome.storage.sync.get(SETTINGS_KEY, (syncResult) => {
    const syncValue = syncResult[SETTINGS_KEY]
    if (syncValue) {
      applySettings(syncValue)
      return
    }
    // Legacy fallback (read-only here; popup/options will migrate writes).
    chrome.storage.local.get(SETTINGS_KEY, (localResult) => {
      applySettings(localResult[SETTINGS_KEY])
    })
  })

  // React only to sync-area changes; vocabulary/stats live in local
  // and shouldn't trigger settings re-cache.
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') return
    if (changes[SETTINGS_KEY]?.newValue) {
      applySettings(changes[SETTINGS_KEY].newValue)
    }
  })
}

/**
 * Get cached target language name.
 */
export function getTargetLanguage(): string {
  return cachedTargetLanguage
}

/**
 * Get cached source language name.
 */
export function getSourceLanguage(): string {
  return cachedSourceLanguage
}

/**
 * Get cached source language code.
 */
export function getSourceLangCode(): string {
  return cachedSourceLangCode
}

/**
 * Get cached LLM translation flag.
 */
export function isLLMTranslationEnabled(): boolean {
  return cachedUseLLMTranslation
}

/**
 * Save target language to storage (updates Zustand persist format).
 */
export function saveTargetLanguage(langCode: string): void {
  void patchSettings({ targetLanguage: langCode }).catch(e =>
    console.warn('[VocabExt] Failed to save target language:', e)
  )
}

/**
 * Save source language to storage (for free translation).
 */
export function saveSourceLanguage(langCode: string): void {
  void patchSettings({ sourceLanguage: langCode }).catch(e =>
    console.warn('[VocabExt] Failed to save source language:', e)
  )
}

/**
 * Update cached target language directly (UI update).
 */
export function setCachedTargetLanguage(langName: string): void {
  cachedTargetLanguage = langName
}

/**
 * Update cached source language directly (UI update).
 */
export function setCachedSourceLanguage(langName: string, langCode: string): void {
  cachedSourceLanguage = langName
  cachedSourceLangCode = langCode
}

/**
 * Get cached highlight color.
 */
export function getHighlightColor(): string {
  return cachedHighlightColor
}
