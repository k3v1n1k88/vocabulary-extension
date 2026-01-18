/**
 * Background Service Worker
 * Orchestrates message handling and context menu operations.
 * Handler logic is delegated to specialized modules in ./handlers/
 */

import { lookupWordWithTranslation } from '@/shared/dictionary-api'
import { translateToTargetLanguage, isPhrase } from '@/shared/translation-service'
import { initNotifications } from '@/shared/notifications'
import type { Message, LookupWordPayload, Word } from '@/types'

import {
  isPdfUrl,
  performPdfLookup,
  handleLookupWord,
  handleSaveWord,
  handleTranslateText,
  handleTranslateSwap,
  handlePlayAudio,
  handleUpdateReminder,
  handleTestNotification,
  handleOpenOptionsPage
} from './handlers'

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: 'vocabulary-lookup',
      title: 'Look up / Translate',
      contexts: ['selection']
    })
  } catch (error) {
    console.warn('[VocabExt] Failed to create context menu:', error)
  }

  // Initialize notifications on install
  initNotifications()
})

// Initialize notifications when service worker starts
initNotifications()

/**
 * Shared lookup/translate logic for content script tooltips.
 */
async function lookupOrTranslate(text: string, tabId: number) {
  if (!text) return

  // Show loading state immediately
  const isPhraseText = isPhrase(text)
  chrome.tabs.sendMessage(tabId, {
    type: 'SHOW_LOADING',
    payload: { text, isPhrase: isPhraseText }
  })

  try {
    if (isPhraseText) {
      const translation = await translateToTargetLanguage(text)
      chrome.tabs.sendMessage(tabId, {
        type: 'SHOW_TRANSLATION',
        payload: translation
      })
    } else {
      const wordData = await lookupWordWithTranslation(text)

      if (wordData) {
        chrome.tabs.sendMessage(tabId, {
          type: 'SHOW_TOOLTIP',
          payload: wordData
        })
      } else {
        // Fallback to translation for unknown words
        const translation = await translateToTargetLanguage(text)
        chrome.tabs.sendMessage(tabId, {
          type: 'SHOW_TRANSLATION',
          payload: translation
        })
      }
    }
  } catch (error) {
    console.error('Lookup/Translation failed:', error)
    const errorMsg = error instanceof Error ? error.message : 'Failed to process text'
    chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_TOOLTIP_ERROR',
      payload: { message: errorMsg }
    })
  }
}

// Handle context menu clicks
// NOTE: For PDF pages, we must call sidePanel.open() SYNCHRONOUSLY - no awaits before it!
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'vocabulary-lookup' && info.selectionText && tab?.id) {
    const text = info.selectionText.trim()
    const isPdf = isPdfUrl(tab.url)

    console.log('[VocabExt] Context menu clicked:', {
      text: text.slice(0, 20),
      url: tab.url?.slice(0, 50),
      isPdf,
      tabId: tab.id,
      windowId: tab.windowId
    })

    // PDF pages: content script can't inject DOM, use side panel
    if (isPdf && tab.windowId) {
      // CRITICAL: Call sidePanel.open() IMMEDIATELY - no awaits before this!
      chrome.sidePanel.open({ windowId: tab.windowId })
        .then(() => {
          console.log('[VocabExt] Side panel opened, starting lookup...')
          performPdfLookup(text)
        })
        .catch((error) => {
          console.error('[VocabExt] Failed to open side panel:', error)
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-128.png',
            title: 'Vocabulary Lookup',
            message: `Could not open side panel. Try clicking the extension icon.`
          })
        })
    } else {
      lookupOrTranslate(text, tab.id)
    }
  }
})

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  // Handle keyboard shortcut lookup from content script
  if (message.type === 'LOOKUP_SELECTED' && sender.tab?.id) {
    const { text } = message.payload as { text: string }
    lookupOrTranslate(text, sender.tab.id)
    sendResponse({ success: true })
    return true
  }

  handleMessage(message, sendResponse)
  return true // Keep channel open for async response
})

/**
 * Route messages to appropriate handlers.
 */
async function handleMessage(
  message: Message,
  sendResponse: (response: unknown) => void
) {
  try {
    switch (message.type) {
      case 'LOOKUP_WORD':
        await handleLookupWord(message.payload as LookupWordPayload, sendResponse)
        break

      case 'TRANSLATE_TEXT':
        await handleTranslateText(
          message.payload as { text: string; targetLanguage?: string },
          sendResponse
        )
        break

      case 'TRANSLATE_SWAP':
        await handleTranslateSwap(
          message.payload as { text: string; sourceLangCode: string; targetLangCode: string },
          sendResponse
        )
        break

      case 'SAVE_WORD':
        await handleSaveWord(message.payload as { word: Word }, sendResponse)
        break

      case 'PLAY_AUDIO':
        await handlePlayAudio(
          message.payload as { text: string; lang?: string },
          sendResponse
        )
        break

      case 'UPDATE_REMINDER':
        await handleUpdateReminder(
          message.payload as { reminderInterval?: number; enabled: boolean },
          sendResponse
        )
        break

      case 'OPEN_OPTIONS_PAGE':
        handleOpenOptionsPage(message.payload as { hash?: string }, sendResponse)
        break

      case 'TEST_NOTIFICATION':
        await handleTestNotification(sendResponse)
        break

      default:
        sendResponse({ success: false, error: 'Unknown message type' })
    }
  } catch (error) {
    console.error('Message handling error:', error)
    sendResponse({ success: false, error: String(error) })
  }
}

// Handle extension icon click - open popup
chrome.action.onClicked.addListener(() => {
  // Popup is already set in manifest, this is just a fallback
})

console.log('Vocabulary Builder background service worker loaded')
