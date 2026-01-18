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

/**
 * Build complete floating menu HTML.
 */
export function buildFloatingMenuHtml(config: FloatingMenuConfig): string {
  const { isPhrase, useLLMTranslation, sourceLanguage, targetLanguage } = config

  const sourceLangOptionsHtml = buildLangOptionsHtml(sourceLanguage)
  const targetLangOptionsHtml = buildLangOptionsHtml(targetLanguage)
  const sourceLangHtml = buildSourceLangHtml(sourceLanguage, useLLMTranslation)
  const aiIconHtml = buildAiBadgeHtml(useLLMTranslation)

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
