/**
 * Tooltip Dropdown Handlers Module
 * Language dropdown handlers for source/target language selection.
 */

import type { TranslationResult } from '@/types'
import { createTranslationTooltipHTML } from './tooltip-templates'
import {
  getTargetLanguage,
  saveTargetLanguage,
  saveSourceLanguage,
  setCachedTargetLanguage
} from './settings-manager'

// Callback types for tooltip operations
type GetTooltipFn = () => HTMLDivElement | null
type ShowLoadingFn = (text: string, isPhrase: boolean) => void
type UpdateTranslationFn = (translation: TranslationResult) => void
type SetupEventsFn = (translation: TranslationResult) => void

// Chevron icon for dropdown triggers
const CHEVRON_ICON = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>'

/**
 * Show loading state in translated text div.
 */
function showTranslationLoading(tooltip: HTMLDivElement): void {
  const translatedDiv = tooltip.querySelector('.vocab-translated-text')
  if (translatedDiv) {
    translatedDiv.innerHTML = '<div class="vocab-loading"><div class="vocab-loading-spinner"></div>Translating...</div>'
  }
}

/**
 * Show error state in translated text div.
 */
function showTranslationError(tooltip: HTMLDivElement): void {
  const translatedDiv = tooltip.querySelector('.vocab-translated-text')
  if (translatedDiv) {
    translatedDiv.innerHTML = '<span style="color: #dc2626;">Translation failed. Try again.</span>'
  }
}

/**
 * Retranslate with free API and update tooltip.
 */
async function retranslateWithFreeApi(
  tooltip: HTMLDivElement,
  originalText: string,
  sourceCode: string,
  targetCode: string,
  getTooltip: GetTooltipFn,
  setupTranslationEvents: SetupEventsFn
): Promise<void> {
  showTranslationLoading(tooltip)

  try {
    const result = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_SWAP',
      payload: { text: originalText, sourceLangCode: sourceCode, targetLangCode: targetCode }
    }) as TranslationResult

    const currentTooltip = getTooltip()
    if (result && currentTooltip) {
      currentTooltip.innerHTML = createTranslationTooltipHTML(result, getTargetLanguage())
      setupTranslationEvents(result)
    }
  } catch (error) {
    console.error('[VocabExt] Language change failed:', error)
    showTranslationError(tooltip)
  }
}

/**
 * Setup source language dropdown handlers.
 */
export function setupSourceLanguageDropdown(
  tooltip: HTMLDivElement,
  getTooltip: GetTooltipFn,
  setupTranslationEvents: SetupEventsFn
): void {
  const sourceLangTrigger = tooltip.querySelector('.vocab-source-lang-trigger')
  const sourceLangDropdown = tooltip.querySelector('.vocab-source-lang-dropdown')

  if (!sourceLangTrigger || !sourceLangDropdown) return

  // Toggle dropdown on trigger click
  sourceLangTrigger.addEventListener('click', (e) => {
    e.stopPropagation()
    const isVisible = sourceLangDropdown.getAttribute('style')?.includes('block')
    // Hide target dropdown if open
    const targetDropdown = tooltip.querySelector('.vocab-target-lang-dropdown')
    if (targetDropdown) targetDropdown.setAttribute('style', 'display:none;')
    // Toggle source dropdown
    sourceLangDropdown.setAttribute('style', isVisible ? 'display:none;' : 'display:block;')
  })

  // Language option selection
  sourceLangDropdown.querySelectorAll('.vocab-lang-option').forEach(option => {
    option.addEventListener('click', async (e) => {
      e.stopPropagation()
      const el = e.currentTarget as HTMLElement
      const newSourceCode = el.dataset.langCode || 'en'
      const newSourceName = el.dataset.langName || 'English'

      // Save preference
      saveSourceLanguage(newSourceCode)

      // Get data from trigger
      const trigger = tooltip.querySelector('.vocab-source-lang-trigger') as HTMLElement
      const originalText = decodeURIComponent(trigger?.dataset.originalText || '')
      const targetCode = trigger?.dataset.targetCode || 'vi'

      // Hide dropdown and update trigger
      sourceLangDropdown.setAttribute('style', 'display:none;')
      if (trigger) {
        trigger.innerHTML = `${newSourceName} ${CHEVRON_ICON}`
      }

      // Retranslate
      await retranslateWithFreeApi(tooltip, originalText, newSourceCode, targetCode, getTooltip, setupTranslationEvents)
    })
  })
}

/**
 * Setup target language dropdown handlers.
 */
export function setupTargetLanguageDropdown(
  tooltip: HTMLDivElement,
  translation: TranslationResult,
  getTooltip: GetTooltipFn,
  showLoadingTooltip: ShowLoadingFn,
  updateTooltipWithTranslation: UpdateTranslationFn,
  setupTranslationEvents: SetupEventsFn
): void {
  const targetLangTrigger = tooltip.querySelector('.vocab-target-lang-trigger')
  const targetLangDropdown = tooltip.querySelector('.vocab-target-lang-dropdown') as HTMLElement

  if (!targetLangTrigger || !targetLangDropdown) return

  // Toggle dropdown on trigger click
  targetLangTrigger.addEventListener('click', (e) => {
    e.stopPropagation()
    // Hide source dropdown if open
    const sourceDropdown = tooltip.querySelector('.vocab-source-lang-dropdown') as HTMLElement
    if (sourceDropdown) sourceDropdown.style.display = 'none'
    // Toggle target dropdown
    targetLangDropdown.style.display = targetLangDropdown.style.display === 'none' ? 'block' : 'none'
  })

  // Language option selection
  targetLangDropdown.querySelectorAll('.vocab-lang-option').forEach(option => {
    option.addEventListener('click', async (e) => {
      e.stopPropagation()
      const newTargetCode = (option as HTMLElement).dataset.langCode
      const newTargetName = (option as HTMLElement).dataset.langName

      if (!newTargetCode || !newTargetName) return

      // Update cached language and save
      setCachedTargetLanguage(newTargetName)
      saveTargetLanguage(newTargetCode)
      targetLangDropdown.style.display = 'none'

      // Retranslate based on translation type
      if (translation.isFreeTranslation) {
        const currentSourceCode = translation.sourceLangCode || 'en'
        await retranslateWithFreeApi(
          tooltip,
          translation.originalText,
          currentSourceCode,
          newTargetCode,
          getTooltip,
          setupTranslationEvents
        )
      } else {
        // LLM translation
        showLoadingTooltip(translation.originalText, translation.isPhrase)
        chrome.runtime.sendMessage({
          type: 'TRANSLATE_TEXT',
          payload: { text: translation.originalText, targetLanguage: newTargetName }
        }, (response) => {
          if (response?.success && response.data) {
            updateTooltipWithTranslation(response.data)
          }
        })
      }
    })
  })
}
