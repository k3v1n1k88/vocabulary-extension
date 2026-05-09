/* global Element */
/**
 * Tooltip Event Handlers Module
 * Sets up event listeners for different tooltip types.
 */

import type { Word, TranslationResult } from '@/types'
import { getSourceLangCode } from './settings-manager'
import {
  playAudioFromBackground,
  setupSaveButtonHandler,
  setupAiHintHandler,
  setupSettingsHandler
} from './tooltip-button-handlers'
import {
  setupSourceLanguageDropdown,
  setupTargetLanguageDropdown
} from './tooltip-dropdown-handlers'

// Callback types for tooltip operations
type GetTooltipFn = () => HTMLDivElement | null
type RemoveTooltipFn = () => void
type ShowLoadingFn = (text: string, isPhrase: boolean) => void
type UpdateTranslationFn = (translation: TranslationResult) => void

// Store callbacks set by tooltip-manager
let getTooltip: GetTooltipFn
let removeTooltip: RemoveTooltipFn
let showLoadingTooltip: ShowLoadingFn
let updateTooltipWithTranslation: UpdateTranslationFn

/**
 * Initialize event handlers with tooltip manager callbacks.
 * Must be called before using any setup functions.
 */
export function initEventHandlers(
  getTooltipFn: GetTooltipFn,
  removeTooltipFn: RemoveTooltipFn,
  showLoadingFn: ShowLoadingFn,
  updateTranslationFn: UpdateTranslationFn
): void {
  getTooltip = getTooltipFn
  removeTooltip = removeTooltipFn
  showLoadingTooltip = showLoadingFn
  updateTooltipWithTranslation = updateTranslationFn
}

/**
 * Setup delegated click handler for the close (X) button.
 * Listener is attached to the tooltip ROOT (which survives `innerHTML`
 * replacements done by content updates and dropdown re-renders), so the X
 * button keeps working across loading → loaded → error → re-translate flows.
 * Returns a cleanup function that removes the listener.
 */
export function setupCloseButtonHandler(): (() => void) {
  const tooltip = getTooltip()
  if (!tooltip) return () => {}
  const handler = (e: Event) => {
    const target = e.target as Element | null
    if (target && target.closest('.vocab-close-btn')) {
      e.stopPropagation()
      removeTooltip()
    }
  }
  tooltip.addEventListener('click', handler)
  return () => tooltip.removeEventListener('click', handler)
}

/**
 * Setup document-level Escape keydown handler to close tooltip.
 * Does not stopPropagation — host page Escape handlers still fire.
 */
export function setupEscapeKeyHandler(): (() => void) {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      removeTooltip()
    }
  }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}

/**
 * Setup event listeners for word tooltip.
 */
export function setupWordTooltipEvents(word: Word): void {
  const tooltip = getTooltip()
  if (!tooltip) return

  // Audio button - use user's configured source language for TTS
  const audioBtn = tooltip.querySelector('.vocab-audio-btn')
  audioBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    playAudioFromBackground(word.word, getSourceLangCode() || 'en')
  })

  // AI hint link - open settings (for free translations)
  if (word.isFreeTranslation) {
    setupAiHintHandler(tooltip)
  }

  // Settings link for translation errors
  if (word.translationError) {
    setupSettingsHandler(tooltip, '.vocab-settings-link')
  }

  // Save button
  setupSaveButtonHandler(tooltip, word)
}

/**
 * Setup event listeners for translation tooltip.
 */
export function setupTranslationTooltipEvents(translation: TranslationResult): void {
  const tooltip = getTooltip()
  if (!tooltip) return

  // AI hint and source language dropdown for free translations
  if (translation.isFreeTranslation) {
    setupAiHintHandler(tooltip)
    setupSourceLanguageDropdown(tooltip, getTooltip, setupTranslationTooltipEvents)
  }

  // Copy button (supports both full and icon-only variants)
  const copyBtn = tooltip.querySelector('.vocab-copy-btn, .vocab-copy-icon-btn')
  const isIconOnly = copyBtn?.classList.contains('vocab-copy-icon-btn')
  const checkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`
  const copyIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`

  copyBtn?.addEventListener('click', async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(translation.translatedText)
      if (copyBtn) {
        copyBtn.innerHTML = isIconOnly ? checkIcon : `${checkIcon} Copied!`
        setTimeout(() => {
          if (copyBtn) {
            copyBtn.innerHTML = isIconOnly ? copyIcon : `${copyIcon} Copy`
          }
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  })

  // Audio button
  const audioBtn = tooltip.querySelector('.vocab-audio-btn')
  audioBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    playAudioFromBackground(translation.originalText, translation.sourceLangCode || 'en')
  })

  // Target language dropdown (for all translations)
  setupTargetLanguageDropdown(
    tooltip,
    translation,
    getTooltip,
    showLoadingTooltip,
    updateTooltipWithTranslation,
    setupTranslationTooltipEvents
  )
}

/**
 * Setup event listeners for error tooltip.
 */
export function setupErrorTooltipEvents(message: string): void {
  const tooltip = getTooltip()
  if (!tooltip) return

  // Check if API-related error
  const lowerMsg = message.toLowerCase()
  const isApiError = lowerMsg.includes('api key') || lowerMsg.includes('api error') ||
    lowerMsg.includes('400') || lowerMsg.includes('401') || lowerMsg.includes('500')

  // Settings button listener
  setupSettingsHandler(tooltip, '.vocab-settings-btn', removeTooltip)

  // Auto-remove after 5 seconds for non-API errors
  if (!isApiError) {
    setTimeout(removeTooltip, 5000)
  }
}
