/**
 * Tooltip Templates Module
 * HTML generation for word and translation tooltips.
 * Uses shared elements for reusable components.
 */

import type { Word, TranslationResult } from '@/types'
import { escapeHtml, escapeAttr } from '../utils/html-escape'
import {
  TOOLTIP_ICONS,
  createTranslationBadgeHtml,
  createTypeBadgeHtml,
  createAiUpsellHtml,
  createLangDropdownHtml,
  createAudioButtonHtml,
  createCopyButtonHtml,
  createSaveButtonHtml,
  createAiBadgeHtml
} from './tooltip-shared-elements'
export { createErrorHTML } from './tooltip-error-template'

/**
 * Create tooltip HTML for word lookup.
 */
export function createTooltipHTML(word: Word): string {
  const synonymsHTML = word.synonyms?.length
    ? `<div class="vocab-synonyms">
        <span class="vocab-label">Synonyms:</span>
        ${word.synonyms.map(s => `<span class="vocab-tag vocab-tag-syn">${escapeHtml(s)}</span>`).join('')}
       </div>`
    : ''

  const antonymsHTML = word.antonyms?.length
    ? `<div class="vocab-antonyms">
        <span class="vocab-label">Antonyms:</span>
        ${word.antonyms.map(a => `<span class="vocab-tag vocab-tag-ant">${escapeHtml(a)}</span>`).join('')}
       </div>`
    : ''

  const exampleHTML = word.examples?.[0]
    ? `<div class="vocab-example">
        <span class="vocab-label">Example:</span>
        <em>"${escapeHtml(word.examples[0])}"</em>
       </div>`
    : ''

  // Translation or error message
  const translationHTML = word.translationError
    ? `<div class="vocab-translation-error">
        <span class="vocab-label">⚠️ Translation Error:</span>
        <span class="vocab-error-msg">${escapeHtml(word.translationError)}</span>
        <a href="#" class="vocab-settings-link" data-action="open-settings">Open Settings →</a>
       </div>`
    : word.vietnameseTranslation
    ? `<div class="vocab-vietnamese">
        <span class="vocab-label">Translation:</span>
        ${escapeHtml(word.vietnameseTranslation)}
       </div>`
    : ''

  const translationBadgeHTML = createTranslationBadgeHtml(word.isFreeTranslation, !!word.translationError)
  const aiUpsellHTML = createAiUpsellHtml(word.isFreeTranslation === true && !word.translationError)

  return `
    <div class="vocab-tooltip-content">
      <div class="vocab-header">
        <div class="vocab-word-row">
          <span class="vocab-word">${escapeHtml(word.word)}</span>
          ${translationBadgeHTML}
          ${createAudioButtonHtml(word.word)}
        </div>
        ${word.pronunciation ? `<span class="vocab-pronunciation">${escapeHtml(word.pronunciation)}</span>` : ''}
        ${word.partOfSpeech ? `<span class="vocab-pos">${escapeHtml(word.partOfSpeech)}</span>` : ''}
      </div>

      <div class="vocab-definition">
        <span class="vocab-label">Definition:</span>
        ${escapeHtml(word.definition)}
      </div>

      ${translationHTML}
      ${exampleHTML}
      ${synonymsHTML}
      ${antonymsHTML}

      ${aiUpsellHTML}

      <div class="vocab-actions">
        ${createSaveButtonHtml(word.id)}
      </div>
    </div>
  `
}

/**
 * Create tooltip HTML for phrase translation.
 */
export function createTranslationTooltipHTML(translation: TranslationResult, cachedTargetLanguage: string): string {
  const typeLabel = translation.isPhrase ? 'Phrase' : 'Word'
  const targetLangOptionsHtml = createLangDropdownHtml(cachedTargetLanguage, 'name')
  const translationBadgeHtml = createTranslationBadgeHtml(translation.isFreeTranslation)
  const aiUpsellHtml = createAiUpsellHtml(!!translation.isFreeTranslation)

  // Source language: dropdown for free, static text for LLM
  const sourceLangCode = translation.sourceLangCode || 'en'
  const targetLangCode = translation.targetLangCode || 'vi'
  const sourceLangOptionsHtml = createLangDropdownHtml(sourceLangCode, 'code')

  const sourceLangHtml = translation.isFreeTranslation
    ? `<span class="vocab-source-lang-trigger" data-original-text="${encodeURIComponent(translation.originalText)}" data-target-code="${escapeAttr(targetLangCode)}">${escapeHtml(translation.sourceLanguage)} ${TOOLTIP_ICONS.chevronDown}</span>
       <div class="vocab-source-lang-dropdown" style="display:none;">${sourceLangOptionsHtml}</div>`
    : `<span>${escapeHtml(translation.sourceLanguage)}</span>`

  return `
    <div class="vocab-tooltip-content vocab-translation">
      <div class="vocab-header">
        <div class="vocab-word-row">
          <span class="vocab-word">${escapeHtml(translation.originalText)}</span>
          ${createTypeBadgeHtml(typeLabel)}
          ${translationBadgeHtml}
        </div>
        <span class="vocab-lang-info">
          ${sourceLangHtml} →
          <span class="vocab-target-lang-trigger">${escapeHtml(translation.targetLanguage)} ${TOOLTIP_ICONS.chevronDown}</span>
          <div class="vocab-target-lang-dropdown" style="display:none;">${targetLangOptionsHtml}</div>
        </span>
      </div>

      <div class="vocab-translation-result">
        <span class="vocab-label">Translation:</span>
        <div class="vocab-translated-text">${escapeHtml(translation.translatedText).replace(/\n/g, '<br>')}</div>
      </div>

      ${aiUpsellHtml}

      <div class="vocab-actions">
        ${createCopyButtonHtml()}
        <button class="vocab-audio-btn" data-text="${escapeAttr(translation.originalText)}" title="Play pronunciation">
          ${TOOLTIP_ICONS.speakerSmall}
        </button>
      </div>
    </div>
  `
}

/**
 * Create loading tooltip HTML.
 */
export function createLoadingHTML(text: string, isPhrase: boolean, isLLMEnabled: boolean): string {
  const loadingAiBadge = isLLMEnabled ? createAiBadgeHtml() : ''
  const displayText = isPhrase ? text.substring(0, 50) + (text.length > 50 ? '...' : '') : text

  return `
    <div class="vocab-tooltip-content">
      <div class="vocab-header">
        <div class="vocab-word-row">
          <span class="vocab-word">${escapeHtml(displayText)}</span>
          ${createTypeBadgeHtml(isPhrase ? 'Translating...' : 'Looking up...')}
          ${loadingAiBadge}
        </div>
      </div>
      <div class="vocab-loading">
        <div class="vocab-loading-spinner"></div>
        <span>${isPhrase ? 'Translating...' : 'Fetching definition...'}</span>
      </div>
    </div>
  `
}

