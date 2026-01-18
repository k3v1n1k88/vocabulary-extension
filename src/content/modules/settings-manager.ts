/**
 * Settings Manager Module
 * Manages cached settings state and storage synchronization.
 */

import { SUPPORTED_LANGUAGES } from '@/types'

// Cached settings state
let cachedTargetLanguage = 'Vietnamese'
let cachedSourceLanguage = 'English'
let cachedSourceLangCode = 'en'
let cachedUseLLMTranslation = false

/**
 * Initialize settings from storage.
 */
export function initSettings(): void {
  chrome.storage.local.get('settings-storage', (result) => {
    if (result['settings-storage']) {
      try {
        const parsed = JSON.parse(result['settings-storage'])
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
      } catch (e) {
        console.warn('[VocabExt] Failed to parse settings:', e)
      }
    }
  })

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes['settings-storage']?.newValue) {
      try {
        const parsed = JSON.parse(changes['settings-storage'].newValue)
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
      } catch (e) {
        console.warn('[VocabExt] Failed to parse settings change:', e)
      }
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
  chrome.storage.local.get('settings-storage', (result) => {
    try {
      const stored = result['settings-storage'] ? JSON.parse(result['settings-storage']) : { state: { settings: {} }, version: 0 }
      if (!stored.state) stored.state = {}
      if (!stored.state.settings) stored.state.settings = {}
      stored.state.settings.targetLanguage = langCode
      chrome.storage.local.set({ 'settings-storage': JSON.stringify(stored) })
    } catch (e) {
      console.warn('[VocabExt] Failed to save target language:', e)
    }
  })
}

/**
 * Save source language to storage (for free translation).
 */
export function saveSourceLanguage(langCode: string): void {
  chrome.storage.local.get('settings-storage', (result) => {
    try {
      const stored = result['settings-storage'] ? JSON.parse(result['settings-storage']) : { state: { settings: {} }, version: 0 }
      if (!stored.state) stored.state = {}
      if (!stored.state.settings) stored.state.settings = {}
      stored.state.settings.sourceLanguage = langCode
      chrome.storage.local.set({ 'settings-storage': JSON.stringify(stored) })
    } catch (e) {
      console.warn('[VocabExt] Failed to save source language:', e)
    }
  })
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
