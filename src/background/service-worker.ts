import { lookupWordWithTranslation } from '@/shared/dictionary-api'
import type { Message, LookupWordPayload, Word } from '@/types'

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'vocabulary-lookup',
    title: 'Look up "%s"',
    contexts: ['selection']
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'vocabulary-lookup' && info.selectionText && tab?.id) {
    const word = info.selectionText.trim()

    if (word && word.split(/\s+/).length <= 3) {
      // Lookup word and send to content script
      try {
        const wordData = await lookupWordWithTranslation(word)

        if (wordData) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_TOOLTIP',
            payload: wordData
          })
        } else {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_TOOLTIP_ERROR',
            payload: { message: 'Word not found in dictionary' }
          })
        }
      } catch (error) {
        console.error('Lookup failed:', error)
        chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_TOOLTIP_ERROR',
          payload: { message: 'Failed to look up word' }
        })
      }
    }
  }
})

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handleMessage(message, sendResponse)
  return true // Keep channel open for async response
})

async function handleMessage(
  message: Message,
  sendResponse: (response: unknown) => void
) {
  try {
    switch (message.type) {
      case 'LOOKUP_WORD': {
        const { word } = message.payload as LookupWordPayload
        const wordData = await lookupWordWithTranslation(word)
        sendResponse({ success: true, data: wordData })
        break
      }

      case 'SAVE_WORD': {
        const { word } = message.payload as { word: Word }
        // Save to chrome storage
        const result = await chrome.storage.local.get('vocabulary-storage')
        const stored = result['vocabulary-storage']
          ? JSON.parse(result['vocabulary-storage'])
          : { state: { words: [] } }

        stored.state.words.push(word)
        await chrome.storage.local.set({
          'vocabulary-storage': JSON.stringify(stored)
        })
        sendResponse({ success: true })
        break
      }

      case 'PLAY_AUDIO': {
        const { text } = message.payload as { text: string }
        // Use chrome.tts API for background audio
        chrome.tts.speak(text, {
          lang: 'en-US',
          rate: 0.9
        })
        sendResponse({ success: true })
        break
      }

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
