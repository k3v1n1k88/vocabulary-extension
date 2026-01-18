/**
 * Tooltip Manager Module
 * Orchestrates tooltip display using positioning and event handler modules.
 */

import type { Word, TranslationResult } from '@/types'
import { createTooltipHTML, createTranslationTooltipHTML, createLoadingHTML, createErrorHTML } from './tooltip-templates'
import { getTargetLanguage, isLLMTranslationEnabled } from './settings-manager'
import { clearSavedTooltipPosition } from './floating-menu'
import { getFinalTooltipPosition, type TooltipPosition } from './tooltip-positioning'
import {
  initEventHandlers,
  setupOutsideClickHandler,
  setupWordTooltipEvents,
  setupTranslationTooltipEvents,
  setupErrorTooltipEvents
} from './tooltip-event-handlers'

// Tooltip element reference
let tooltip: HTMLDivElement | null = null

// Cleanup function for outside click handler
let cleanupOutsideClick: (() => void) | null = null

// Initialize event handlers with callbacks
initEventHandlers(
  getTooltip,
  removeTooltip,
  showLoadingTooltip,
  updateTooltipWithTranslation
)

/**
 * Get tooltip element reference.
 */
export function getTooltip(): HTMLDivElement | null {
  return tooltip
}

/**
 * Create tooltip element with standard styling.
 */
function createTooltipElement(html: string, position: TooltipPosition): HTMLDivElement {
  const el = document.createElement('div')
  el.id = 'vocabulary-tooltip'
  el.innerHTML = html
  el.style.cssText = `
    position: absolute;
    left: ${position.left}px;
    top: ${position.top}px;
    z-index: 999999;
  `
  return el
}

/**
 * Setup common tooltip behavior (append to DOM, outside click).
 */
function mountTooltip(el: HTMLDivElement): void {
  tooltip = el
  document.body.appendChild(tooltip)
  cleanupOutsideClick = setupOutsideClickHandler()
}

/**
 * Show loading tooltip immediately.
 */
export function showLoadingTooltip(text: string, isPhrase: boolean): void {
  // Get position BEFORE removeTooltip clears it
  const position = getFinalTooltipPosition(false)

  removeTooltip()

  const html = createLoadingHTML(text, isPhrase, isLLMTranslationEnabled())
  const el = createTooltipElement(html, position)

  mountTooltip(el)
}

/**
 * Update existing tooltip with word data (no position change).
 */
export function updateTooltipWithWord(word: Word): void {
  if (!tooltip) {
    showTooltip(word)
    return
  }

  tooltip.innerHTML = createTooltipHTML(word)
  setupWordTooltipEvents(word)
}

/**
 * Update existing tooltip with translation (no position change).
 */
export function updateTooltipWithTranslation(translation: TranslationResult): void {
  if (!tooltip) {
    showTranslationTooltip(translation)
    return
  }

  tooltip.innerHTML = createTranslationTooltipHTML(translation, getTargetLanguage())
  setupTranslationTooltipEvents(translation)
}

/**
 * Create and show tooltip with word data.
 */
export function showTooltip(word: Word): void {
  // Get position BEFORE removeTooltip clears it
  const position = getFinalTooltipPosition(false)

  removeTooltip()

  const html = createTooltipHTML(word)
  const el = createTooltipElement(html, position)

  mountTooltip(el)
  setupWordTooltipEvents(word)
}

/**
 * Show translation tooltip for phrases.
 */
export function showTranslationTooltip(translation: TranslationResult): void {
  // Get position BEFORE removeTooltip clears it
  const position = getFinalTooltipPosition(true)

  removeTooltip()

  const html = createTranslationTooltipHTML(translation, getTargetLanguage())
  const el = createTooltipElement(html, position)

  mountTooltip(el)
  setupTranslationTooltipEvents(translation)
}

/**
 * Show error tooltip.
 */
export function showErrorTooltip(message: string): void {
  // If tooltip already exists (loading state), reuse its position
  if (tooltip) {
    const existingLeft = tooltip.style.left
    const existingTop = tooltip.style.top

    tooltip.innerHTML = createErrorHTML(message)
    tooltip.style.left = existingLeft
    tooltip.style.top = existingTop

    setupErrorTooltipEvents(message)
    return
  }

  // No existing tooltip - create one
  const position = getFinalTooltipPosition(false)
  const html = createErrorHTML(message)
  const el = createTooltipElement(html, position)

  mountTooltip(el)
  setupErrorTooltipEvents(message)
}

/**
 * Remove tooltip and cleanup.
 */
export function removeTooltip(): void {
  if (tooltip) {
    tooltip.remove()
    tooltip = null
  }
  if (cleanupOutsideClick) {
    cleanupOutsideClick()
    cleanupOutsideClick = null
  }
  clearSavedTooltipPosition()
}
