/**
 * Tooltip Shared Elements Module
 * Reusable HTML components for tooltip templates (badges, icons, dropdowns).
 */

import { SUPPORTED_LANGUAGES } from '@/types'
import { escapeHtml, escapeAttr } from '../utils/html-escape'

/**
 * SVG Icons used across tooltips.
 */
export const TOOLTIP_ICONS = {
  speaker: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M11 5L6 9H2v6h4l5 4V5z"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>`,
  speakerSmall: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M11 5L6 9H2v6h4l5 4V5z"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>`,
  bookmark: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>`,
  copy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>`,
  settings: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`,
  error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`,
  chevronDown: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>`,
  robot: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
    <circle cx="7.5" cy="14.5" r="1.5"/>
    <circle cx="16.5" cy="14.5" r="1.5"/>
  </svg>`,
  close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="6" y1="6" x2="18" y2="18"/>
    <line x1="18" y1="6" x2="6" y2="18"/>
  </svg>`
}

/**
 * Create AI badge HTML.
 */
export function createAiBadgeHtml(title = 'AI-powered translation'): string {
  return `<span class="vocab-ai-badge" title="${title}">
    ${TOOLTIP_ICONS.robot}
    AI
  </span>`
}

/**
 * Create Free badge HTML.
 */
export function createFreeBadgeHtml(): string {
  return `<span class="vocab-free-badge">Free</span>`
}

/**
 * Create translation badge based on type.
 */
export function createTranslationBadgeHtml(isFreeTranslation: boolean | undefined, hasError = false): string {
  if (hasError) return ''
  if (isFreeTranslation === false) return createAiBadgeHtml()
  if (isFreeTranslation === true) return createFreeBadgeHtml()
  return ''
}

/**
 * Create type badge (Word/Phrase).
 */
export function createTypeBadgeHtml(label: string): string {
  return `<span class="vocab-type-badge">${escapeHtml(label)}</span>`
}

/**
 * Create AI upsell hint HTML for free users.
 */
export function createAiUpsellHtml(showUpsell: boolean): string {
  if (!showUpsell) return ''
  return `<div class="vocab-ai-upsell">
    <a href="#" class="vocab-ai-hint" data-action="open-settings">✨ Get better results with AI →</a>
  </div>`
}

/**
 * Create language dropdown HTML.
 */
export function createLangDropdownHtml(
  activeValue: string,
  matchBy: 'code' | 'name' = 'name'
): string {
  return SUPPORTED_LANGUAGES.map(lang => {
    const isActive = matchBy === 'code'
      ? lang.code === activeValue
      : lang.name === activeValue
    return `<div class="vocab-lang-option${isActive ? ' active' : ''}" data-lang-code="${lang.code}" data-lang-name="${lang.name}">${lang.nativeName}</div>`
  }).join('')
}

/**
 * Create audio button HTML.
 */
export function createAudioButtonHtml(text: string, attrName = 'word'): string {
  return `<button class="vocab-audio-btn" data-${attrName}="${escapeAttr(text)}" title="Play pronunciation">
    ${TOOLTIP_ICONS.speaker}
  </button>`
}

/**
 * Create copy button HTML (full button with text).
 */
export function createCopyButtonHtml(): string {
  return `<button class="vocab-copy-btn" title="Copy translation">
    ${TOOLTIP_ICONS.copy}
    Copy
  </button>`
}

/**
 * Create copy icon button HTML (icon only, for inline use).
 */
export function createCopyIconButtonHtml(): string {
  return `<button class="vocab-copy-icon-btn" title="Copy translation">
    ${TOOLTIP_ICONS.copy}
  </button>`
}

/**
 * Create save button HTML.
 */
export function createSaveButtonHtml(wordId: string): string {
  return `<button class="vocab-save-btn" data-word-id="${wordId}">
    ${TOOLTIP_ICONS.bookmark}
    Save to Vocabulary
  </button>`
}

/**
 * Create settings button HTML.
 */
export function createSettingsButtonHtml(label = 'Check Settings'): string {
  return `<button class="vocab-settings-btn">
    ${TOOLTIP_ICONS.settings}
    ${label}
  </button>`
}

/**
 * Create close (X) button HTML for manual tooltip dismiss.
 */
export function createCloseButtonHtml(): string {
  return `<button type="button" class="vocab-close-btn" aria-label="Close" title="Close (Esc)">
    ${TOOLTIP_ICONS.close}
  </button>`
}

/**
 * Create error code badge HTML.
 */
export function createErrorCodeBadgeHtml(errorCode: string | undefined): string {
  if (!errorCode) return ''
  return `<span class="vocab-error-code">${errorCode}</span>`
}
