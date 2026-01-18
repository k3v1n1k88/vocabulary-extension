/* global DOMRect */
/**
 * Floating Menu Template Module
 * Builds HTML for the floating menu UI components.
 */

import { SUPPORTED_LANGUAGES } from '@/types'

export interface FloatingMenuConfig {
  isPhrase: boolean
  useLLMTranslation: boolean
  sourceLanguage: string
  targetLanguage: string
  highlightColor: string
}

/**
 * Build language options HTML for dropdown.
 */
export function buildLangOptionsHtml(activeLanguage: string): string {
  return SUPPORTED_LANGUAGES.map(lang =>
    `<div class="vocab-lang-option${lang.name === activeLanguage ? ' active' : ''}" data-lang-code="${lang.code}" data-lang-name="${lang.name}">${lang.nativeName} (${lang.name})</div>`
  ).join('')
}

/**
 * Build source language selector HTML (hidden in AI mode).
 */
export function buildSourceLangHtml(sourceLanguage: string, useLLMTranslation: boolean): string {
  if (useLLMTranslation) return '' // AI mode - no source dropdown needed

  return `<div class="vocab-menu-item vocab-source-lang-trigger" data-action="change-source-lang" title="Source language">
    <span class="vocab-lang-short">${sourceLanguage.slice(0, 2).toUpperCase()}</span>
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>
  </div>
  <span class="vocab-lang-arrow">→</span>`
}

/**
 * Build AI badge HTML (shown in AI mode).
 */
export function buildAiBadgeHtml(useLLMTranslation: boolean): string {
  if (!useLLMTranslation) return ''

  return `<span class="vocab-ai-badge" title="AI-powered translation">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
    AI
  </span>`
}

// Highlight color presets (must match highlight-settings.tsx)
export const HIGHLIGHT_COLORS = [
  { value: '#ffeb3b', name: 'Yellow' },
  { value: '#a5d6a7', name: 'Green' },
  { value: '#90caf9', name: 'Blue' },
  { value: '#f48fb1', name: 'Pink' },
  { value: '#ffcc80', name: 'Orange' },
  { value: '#ce93d8', name: 'Purple' }
]

/**
 * Build highlight color options HTML for dropdown.
 */
export function buildHighlightColorOptionsHtml(activeColor: string): string {
  return HIGHLIGHT_COLORS.map(color =>
    `<div class="vocab-color-option${color.value === activeColor ? ' active' : ''}" data-color="${color.value}" title="${color.name}">
      <span class="vocab-color-swatch" style="background-color: ${color.value}"></span>
      <span class="vocab-color-name">${color.name}</span>
    </div>`
  ).join('')
}

/**
 * Build highlight button with color dropdown HTML.
 */
export function buildHighlightButtonHtml(highlightColor: string): string {
  const colorOptionsHtml = buildHighlightColorOptionsHtml(highlightColor)

  return `<div class="vocab-highlight-group">
    <div class="vocab-menu-item" data-action="highlight" title="Highlight text">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
        <path d="m15 5 3 3"/>
      </svg>
      <span>Highlight</span>
    </div>
    <div class="vocab-color-trigger" data-action="change-highlight-color" title="Change color">
      <span class="vocab-color-preview" style="background-color: ${highlightColor}"></span>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="vocab-color-dropdown" style="display:none;">${colorOptionsHtml}</div>
  </div>`
}

/**
 * Build complete floating menu HTML.
 */
export function buildFloatingMenuHtml(config: FloatingMenuConfig): string {
  const { isPhrase, useLLMTranslation, sourceLanguage, targetLanguage, highlightColor } = config

  const sourceLangOptionsHtml = buildLangOptionsHtml(sourceLanguage)
  const targetLangOptionsHtml = buildLangOptionsHtml(targetLanguage)
  const sourceLangHtml = buildSourceLangHtml(sourceLanguage, useLLMTranslation)
  const aiIconHtml = buildAiBadgeHtml(useLLMTranslation)
  const highlightHtml = buildHighlightButtonHtml(highlightColor)

  return `
    <div class="vocab-menu-row">
      <div class="vocab-menu-item" data-action="lookup">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <span>${isPhrase ? 'Translate' : 'Look up'}</span>
        ${aiIconHtml}
      </div>
      <div class="vocab-menu-item" data-action="speak" title="Speak">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      </div>
      ${highlightHtml}
      <div class="vocab-menu-divider"></div>
      ${sourceLangHtml}
      <div class="vocab-menu-item vocab-target-lang-trigger" data-action="change-target-lang" title="Target language">
        <span class="vocab-lang-short">${targetLanguage.slice(0, 2).toUpperCase()}</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>
      </div>
    </div>
    ${useLLMTranslation ? '' : `<div class="vocab-source-lang-dropdown vocab-lang-dropdown" style="display:none;">${sourceLangOptionsHtml}</div>`}
    <div class="vocab-target-lang-dropdown vocab-lang-dropdown" style="display:none;">${targetLangOptionsHtml}</div>
  `
}

/**
 * Calculate menu position near selection.
 */
export function calculateMenuPosition(rect: DOMRect): { left: number; top: number } {
  let left = rect.left + window.scrollX
  const top = rect.bottom + window.scrollY + 5

  // Adjust if menu would go off-screen
  if (left + 140 > window.innerWidth) {
    left = window.innerWidth - 150
  }

  return {
    left: Math.max(left, 10),
    top: Math.max(top, 10)
  }
}

/**
 * Calculate tooltip position from selection.
 */
export function calculateTooltipPosition(rect: DOMRect): { left: number; top: number } {
  return {
    left: rect.left + window.scrollX,
    top: rect.bottom + window.scrollY + 10
  }
}
