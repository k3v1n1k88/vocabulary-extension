/* global DOMRect */
/**
 * Tooltip Manager Module
 * Orchestrates tooltip display using positioning and event handler modules.
 */

import type { Word, TranslationResult } from '@/types'
import { createTooltipHTML, createTranslationTooltipHTML, createLoadingHTML, createErrorHTML } from './tooltip-templates'
import { getTargetLanguage, isLLMTranslationEnabled } from './settings-manager'
import { clearSavedTooltipPosition } from './floating-menu'
import {
  getFinalTooltipPosition,
  measureAndAdjustVertical,
  type TooltipPosition
} from './tooltip-positioning'
import {
  initEventHandlers,
  setupCloseButtonHandler,
  setupEscapeKeyHandler,
  setupWordTooltipEvents,
  setupTranslationTooltipEvents,
  setupErrorTooltipEvents
} from './tooltip-event-handlers'

let tooltip: HTMLDivElement | null = null
let cleanups: Array<() => void> = []
let currentSelectionRect: DOMRect | null = null

initEventHandlers(getTooltip, removeTooltip, showLoadingTooltip, updateTooltipWithTranslation)

export function getTooltip(): HTMLDivElement | null {
  return tooltip
}

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

function mountTooltip(el: HTMLDivElement): void {
  tooltip = el
  document.body.appendChild(tooltip)
  cleanups = [setupCloseButtonHandler(), setupEscapeKeyHandler()]
  measureAndAdjustVertical(el, currentSelectionRect)
}

/**
 * Resolve position + selectionRect, cache the rect for re-measurement,
 * and remove any existing tooltip before mounting a fresh one.
 */
function preparePosition(isTranslation: boolean): TooltipPosition {
  const { position, selectionRect } = getFinalTooltipPosition(isTranslation)
  currentSelectionRect = selectionRect
  removeTooltip()
  return position
}

export function showLoadingTooltip(text: string, isPhrase: boolean): void {
  const position = preparePosition(false)
  const html = createLoadingHTML(text, isPhrase, isLLMTranslationEnabled())
  mountTooltip(createTooltipElement(html, position))
}

export function updateTooltipWithWord(word: Word): void {
  if (!tooltip) {
    showTooltip(word)
    return
  }
  tooltip.innerHTML = createTooltipHTML(word)
  setupWordTooltipEvents(word)
  measureAndAdjustVertical(tooltip, currentSelectionRect)
}

export function updateTooltipWithTranslation(translation: TranslationResult): void {
  if (!tooltip) {
    showTranslationTooltip(translation)
    return
  }
  tooltip.innerHTML = createTranslationTooltipHTML(translation, getTargetLanguage())
  setupTranslationTooltipEvents(translation)
  measureAndAdjustVertical(tooltip, currentSelectionRect)
}

export function showTooltip(word: Word): void {
  const position = preparePosition(false)
  mountTooltip(createTooltipElement(createTooltipHTML(word), position))
  setupWordTooltipEvents(word)
}

export function showTranslationTooltip(translation: TranslationResult): void {
  const position = preparePosition(true)
  const html = createTranslationTooltipHTML(translation, getTargetLanguage())
  mountTooltip(createTooltipElement(html, position))
  setupTranslationTooltipEvents(translation)
}

export function showErrorTooltip(message: string): void {
  // If a tooltip already exists (e.g. loading), reuse its position
  if (tooltip) {
    const existingLeft = tooltip.style.left
    const existingTop = tooltip.style.top
    tooltip.innerHTML = createErrorHTML(message)
    tooltip.style.left = existingLeft
    tooltip.style.top = existingTop
    setupErrorTooltipEvents(message)
    measureAndAdjustVertical(tooltip, currentSelectionRect)
    return
  }
  const position = preparePosition(false)
  mountTooltip(createTooltipElement(createErrorHTML(message), position))
  setupErrorTooltipEvents(message)
}

export function removeTooltip(): void {
  if (tooltip) {
    tooltip.remove()
    tooltip = null
  }
  cleanups.forEach(fn => fn())
  cleanups = []
  currentSelectionRect = null
  clearSavedTooltipPosition()
}
