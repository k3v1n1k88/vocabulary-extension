/**
 * Content Script
 * Main entry point for content script functionality.
 */

import type { Word, TranslationResult } from '@/types'

// Import modules
import { initSettings } from './modules/settings-manager'
import { initKeyboardShortcuts } from './modules/keyboard-shortcuts'
import {
  initFloatingMenu,
  removeFloatingButton,
  showFloatingMenuForSelection,
  updateTooltipRef
} from './modules/floating-menu'
import {
  getTooltip,
  showLoadingTooltip,
  updateTooltipWithWord,
  updateTooltipWithTranslation,
  showErrorTooltip
} from './modules/tooltip-manager'
import {
  restoreHighlights,
  initHighlightClickHandlers
} from './modules/highlight-renderer'

// Initialize all modules
initSettings()
initKeyboardShortcuts(showFloatingMenuForSelection)
initFloatingMenu(getTooltip)

// Initialize highlight features (wrapped in try-catch to prevent breaking floating menu)
try {
  initHighlightClickHandlers()
  restoreHighlights().catch(err => console.warn('[VocabExt] Failed to restore highlights:', err))
} catch (err) {
  console.warn('[VocabExt] Failed to initialize highlight handlers:', err)
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  removeFloatingButton() // Hide button when showing any tooltip

  if (message.type === 'SHOW_LOADING') {
    showLoadingTooltip(message.payload.text, message.payload.isPhrase)
    updateTooltipRef(getTooltip())
  } else if (message.type === 'SHOW_TOOLTIP') {
    updateTooltipWithWord(message.payload as Word)
    updateTooltipRef(getTooltip())
  } else if (message.type === 'SHOW_TRANSLATION') {
    updateTooltipWithTranslation(message.payload as TranslationResult)
    updateTooltipRef(getTooltip())
  } else if (message.type === 'SHOW_TOOLTIP_ERROR') {
    showErrorTooltip(message.payload.message)
    updateTooltipRef(getTooltip())
  }
})

console.log('Vocabulary Builder content script loaded')
