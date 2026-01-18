/**
 * Floating Menu Module
 * Manages floating button UI for word lookup and TTS.
 * Delegates HTML building to template module.
 */

import {
  getTargetLanguage,
  getSourceLanguage,
  getSourceLangCode,
  isLLMTranslationEnabled
} from './settings-manager'
import { playGoogleTTSAudio, showTTSError } from './tts-player'
import { isShortcutModeEnabled } from './keyboard-shortcuts'
import {
  buildFloatingMenuHtml,
  calculateMenuPosition,
  calculateTooltipPosition
} from './floating-menu-template'
import {
  handleSourceLangTrigger,
  handleTargetLangTrigger,
  handleLangOptionClick
} from './floating-menu-lang-handlers'

// Element reference
let floatingButton: HTMLDivElement | null = null

// Saved position for tooltip positioning
let savedTooltipPosition: { left: number; top: number } | null = null

// Callbacks for external references (to avoid circular dependencies)
let onFloatingButtonRemove: (() => void) | null = null

/**
 * Initialize floating menu with dependencies.
 */
export function initFloatingMenu(getTooltip: () => HTMLDivElement | null, onRemove?: () => void): void {
  onFloatingButtonRemove = onRemove || null

  // Show floating menu when text is selected (only if shortcut mode is disabled)
  document.addEventListener('mouseup', (e) => {
    if (isShortcutModeEnabled()) return

    // Ignore if clicking on our elements
    const tooltip = getTooltip()
    if (tooltip?.contains(e.target as Node) || floatingButton?.contains(e.target as Node)) {
      return
    }

    // Small delay to let selection finalize
    setTimeout(() => {
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()

      if (selectedText && selectedText.length > 0) {
        showFloatingButton(selection!)
      } else {
        removeFloatingButton()
      }
    }, 10)
  })

  // Hide button when clicking elsewhere
  document.addEventListener('mousedown', (e) => {
    const tooltip = getTooltip()
    if (!floatingButton?.contains(e.target as Node) && !tooltip?.contains(e.target as Node)) {
      removeFloatingButton()
    }
  })
}

/**
 * Update tooltip element reference (kept for compatibility).
 */
export function updateTooltipRef(_tooltip: HTMLDivElement | null): void {
  // No-op: tooltip is accessed via getTooltip() callback
}

/**
 * Show floating menu for selected text.
 */
export function showFloatingButton(selection: Selection): void {
  removeFloatingButton()

  // Guard: Verify selection still exists
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  // Save position for tooltip
  savedTooltipPosition = calculateTooltipPosition(rect)

  const selectedText = selection.toString().trim()
  const isPhrase = selectedText.split(/\s+/).length > 1

  // Get cached settings
  const cachedTargetLanguage = getTargetLanguage()
  const cachedSourceLanguage = getSourceLanguage()
  const cachedSourceLangCode = getSourceLangCode()
  const cachedUseLLMTranslation = isLLMTranslationEnabled()

  // Create menu element
  floatingButton = document.createElement('div')
  floatingButton.id = 'vocab-floating-menu'
  floatingButton.className = 'vocab-menu-horizontal'
  floatingButton.innerHTML = buildFloatingMenuHtml({
    isPhrase,
    useLLMTranslation: cachedUseLLMTranslation,
    sourceLanguage: cachedSourceLanguage,
    targetLanguage: cachedTargetLanguage
  })

  // Position near selection
  const position = calculateMenuPosition(rect)
  floatingButton.style.cssText = `
    position: absolute;
    left: ${position.left}px;
    top: ${position.top}px;
    z-index: 999998;
  `

  // Setup event handlers
  setupMenuEventHandlers(floatingButton, selectedText, cachedSourceLangCode)

  document.body.appendChild(floatingButton)
}

/**
 * Setup click event handlers for menu actions.
 */
function setupMenuEventHandlers(
  menu: HTMLDivElement,
  selectedText: string,
  sourceLangCode: string
): void {
  let activeDropdown: 'source' | 'target' | null = null

  menu.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    const clickedEl = e.target as HTMLElement

    // Handle source language trigger
    if (handleSourceLangTrigger(clickedEl, menu)) {
      activeDropdown = activeDropdown === 'source' ? null : 'source'
      return
    }

    // Handle target language trigger
    if (handleTargetLangTrigger(clickedEl, menu)) {
      activeDropdown = activeDropdown === 'target' ? null : 'target'
      return
    }

    // Handle language option selection
    if (handleLangOptionClick(clickedEl, menu, activeDropdown)) {
      activeDropdown = null
      return
    }

    // Handle menu item actions
    const target = clickedEl.closest('.vocab-menu-item')
    if (!target) return

    const action = target.getAttribute('data-action')
    if (action === 'lookup') {
      handleLookupAction(selectedText)
    } else if (action === 'speak') {
      handleSpeakAction(selectedText, sourceLangCode)
    }
  })
}

/**
 * Handle lookup action - send message to background.
 */
function handleLookupAction(selectedText: string): void {
  removeFloatingButton()
  try {
    chrome.runtime.sendMessage({
      type: 'LOOKUP_SELECTED',
      payload: { text: selectedText }
    })
  } catch {
    console.warn('[VocabExt] Extension context invalidated, please refresh page')
  }
}

/**
 * Handle speak (TTS) action.
 */
function handleSpeakAction(selectedText: string, sourceLangCode: string): void {
  try {
    chrome.runtime.sendMessage({
      type: 'PLAY_AUDIO',
      payload: { text: selectedText, lang: sourceLangCode || 'en' }
    }, async (response) => {
      if (response?.success && response.audioDataUrl) {
        try {
          await playGoogleTTSAudio(response.audioDataUrl)
        } catch {
          showTTSError('Audio playback failed. Check your internet connection.')
        }
      } else if (response?.error) {
        showTTSError(response.error)
      }
    })
  } catch {
    console.warn('[VocabExt] Extension context invalidated, please refresh page')
  }
  removeFloatingButton()
}

/**
 * Remove floating button from DOM.
 */
export function removeFloatingButton(): void {
  if (floatingButton) {
    floatingButton.remove()
    floatingButton = null
  }
  // Fallback: remove by ID in case of race condition
  const existingButton = document.getElementById('vocab-floating-menu')
  if (existingButton) {
    existingButton.remove()
  }

  onFloatingButtonRemove?.()
}

/**
 * Show floating menu for current selection (triggered by keyboard shortcut).
 */
export function showFloatingMenuForSelection(): void {
  const selection = window.getSelection()
  const selectedText = selection?.toString().trim()

  if (selectedText && selection) {
    showFloatingButton(selection)
  }
}

/**
 * Get saved tooltip position.
 */
export function getSavedTooltipPosition(): { left: number; top: number } | null {
  return savedTooltipPosition
}

/**
 * Clear saved tooltip position.
 */
export function clearSavedTooltipPosition(): void {
  savedTooltipPosition = null
}
