/**
 * Floating Menu Module
 * Manages floating button UI for word lookup and TTS.
 * Delegates HTML building to template module.
 */

import {
  getTargetLanguage,
  getSourceLanguage,
  getSourceLangCode,
  isLLMTranslationEnabled,
  getHighlightColor
} from './settings-manager'
import { highlightRange } from './highlight-renderer'
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

// Saved selection range for highlight action (selection gets cleared on click)
let savedSelectionRange: Range | null = null

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

  // Save range for highlight action (selection gets cleared when clicking menu)
  savedSelectionRange = range.cloneRange()

  const selectedText = selection.toString().trim()
  const isPhrase = selectedText.split(/\s+/).length > 1

  // Get cached settings
  const cachedTargetLanguage = getTargetLanguage()
  const cachedSourceLanguage = getSourceLanguage()
  const cachedSourceLangCode = getSourceLangCode()
  const cachedUseLLMTranslation = isLLMTranslationEnabled()
  const cachedHighlightColor = getHighlightColor()

  // Create menu element
  floatingButton = document.createElement('div')
  floatingButton.id = 'vocab-floating-menu'
  floatingButton.className = 'vocab-menu-horizontal'
  floatingButton.innerHTML = buildFloatingMenuHtml({
    isPhrase,
    useLLMTranslation: cachedUseLLMTranslation,
    sourceLanguage: cachedSourceLanguage,
    targetLanguage: cachedTargetLanguage,
    highlightColor: cachedHighlightColor
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

// Session-level highlight color (updated when user picks from dropdown)
let sessionHighlightColor: string | null = null

/**
 * Get current highlight color (session override or settings).
 */
function getCurrentHighlightColor(): string {
  return sessionHighlightColor || getHighlightColor()
}

/**
 * Handle color trigger click - toggle dropdown.
 */
function handleColorTrigger(clickedEl: HTMLElement, menu: HTMLDivElement): boolean {
  const trigger = clickedEl.closest('.vocab-color-trigger')
  if (!trigger) return false

  const dropdown = menu.querySelector('.vocab-color-dropdown') as HTMLElement
  if (dropdown) {
    const isVisible = dropdown.style.display !== 'none'
    dropdown.style.display = isVisible ? 'none' : 'block'
  }
  return true
}

/**
 * Save highlight color to storage.
 */
function saveHighlightColorToStorage(color: string): void {
  try {
    chrome.storage.local.get('settings-storage', (result) => {
      const stored = result['settings-storage']
        ? JSON.parse(result['settings-storage'])
        : { state: { settings: {} }, version: 0 }

      if (!stored.state) stored.state = {}
      if (!stored.state.settings) stored.state.settings = {}

      stored.state.settings.highlightColor = color
      chrome.storage.local.set({ 'settings-storage': JSON.stringify(stored) })
    })
  } catch (e) {
    console.warn('[VocabExt] Failed to save highlight color:', e)
  }
}

/**
 * Handle color option click - update color and preview.
 */
function handleColorOptionClick(clickedEl: HTMLElement, menu: HTMLDivElement): boolean {
  const option = clickedEl.closest('.vocab-color-option') as HTMLElement
  if (!option) return false

  const newColor = option.getAttribute('data-color')
  if (!newColor) return false

  // Update session color
  sessionHighlightColor = newColor

  // Save to storage for persistence
  saveHighlightColorToStorage(newColor)

  // Update preview swatch
  const preview = menu.querySelector('.vocab-color-preview') as HTMLElement
  if (preview) {
    preview.style.backgroundColor = newColor
  }

  // Update active state in dropdown
  menu.querySelectorAll('.vocab-color-option').forEach(opt => opt.classList.remove('active'))
  option.classList.add('active')

  // Hide dropdown
  const dropdown = menu.querySelector('.vocab-color-dropdown') as HTMLElement
  if (dropdown) {
    dropdown.style.display = 'none'
  }

  return true
}

/**
 * Setup click event handlers for menu actions.
 */
function setupMenuEventHandlers(
  menu: HTMLDivElement,
  selectedText: string,
  sourceLangCode: string
): void {
  let activeDropdown: 'source' | 'target' | 'color' | null = null

  menu.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    const clickedEl = e.target as HTMLElement

    // Handle color trigger
    if (handleColorTrigger(clickedEl, menu)) {
      // Close other dropdowns
      menu.querySelector('.vocab-source-lang-dropdown')?.setAttribute('style', 'display:none')
      menu.querySelector('.vocab-target-lang-dropdown')?.setAttribute('style', 'display:none')
      activeDropdown = activeDropdown === 'color' ? null : 'color'
      return
    }

    // Handle color option selection
    if (handleColorOptionClick(clickedEl, menu)) {
      activeDropdown = null
      return
    }

    // Handle source language trigger
    if (handleSourceLangTrigger(clickedEl, menu)) {
      // Close color dropdown
      menu.querySelector('.vocab-color-dropdown')?.setAttribute('style', 'display:none')
      activeDropdown = activeDropdown === 'source' ? null : 'source'
      return
    }

    // Handle target language trigger
    if (handleTargetLangTrigger(clickedEl, menu)) {
      // Close color dropdown
      menu.querySelector('.vocab-color-dropdown')?.setAttribute('style', 'display:none')
      activeDropdown = activeDropdown === 'target' ? null : 'target'
      return
    }

    // Handle language option selection
    if (handleLangOptionClick(clickedEl, menu, activeDropdown === 'source' ? 'source' : activeDropdown === 'target' ? 'target' : null)) {
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
    } else if (action === 'highlight') {
      handleHighlightAction()
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
 * Handle highlight action - highlight selected text using saved range.
 */
async function handleHighlightAction(): Promise<void> {
  if (!savedSelectionRange) {
    console.warn('[VocabExt] No saved selection range for highlight')
    return
  }

  const color = getCurrentHighlightColor()
  await highlightRange(savedSelectionRange, color)
  savedSelectionRange = null
  removeFloatingButton()
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
