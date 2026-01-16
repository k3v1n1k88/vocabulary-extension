import { lookupWordWithTranslation } from '@/shared/dictionary-api'
import { translateToTargetLanguage, translateText, isPhrase } from '@/shared/translation-service'
import { initNotifications, scheduleStudyReminder, showDailyReminder } from '@/shared/notifications'
import type { Message, LookupWordPayload, Word, FlashcardData } from '@/types'

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

// Shared lookup/translate logic
async function lookupOrTranslate(text: string, tabId: number) {
  if (!text) return

  // Show loading state immediately
  const isPhraseText = isPhrase(text)
  chrome.tabs.sendMessage(tabId, {
    type: 'SHOW_LOADING',
    payload: { text, isPhrase: isPhraseText }
  })

  try {
    // Auto-detect: single word = dictionary lookup, multiple words = translation
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
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'vocabulary-lookup' && info.selectionText && tab?.id) {
    await lookupOrTranslate(info.selectionText.trim(), tab.id)
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

      case 'TRANSLATE_TEXT': {
        const { text, targetLanguage } = message.payload as { text: string; targetLanguage?: string }
        // If targetLanguage provided, use translateText directly; otherwise use translateToTargetLanguage
        const translation = targetLanguage
          ? await translateText(text, targetLanguage)
          : await translateToTargetLanguage(text)
        sendResponse({ success: true, data: translation })
        break
      }

      case 'SAVE_WORD': {
        const { word } = message.payload as { word: Word }
        // Save to chrome storage
        const result = await chrome.storage.local.get('vocabulary-storage')
        let stored: { state: { words: Word[]; flashcards: [string, FlashcardData][] } } = {
          state: { words: [], flashcards: [] }
        }
        if (result['vocabulary-storage']) {
          try {
            stored = JSON.parse(result['vocabulary-storage'])
          } catch {
            console.warn('[VocabExt] Corrupted vocabulary storage, using defaults')
          }
        }

        // Check if word already exists
        if (!stored.state.words) stored.state.words = []
        if (!stored.state.flashcards) stored.state.flashcards = []

        const exists = stored.state.words.some(
          (w: Word) => w.word.toLowerCase() === word.word.toLowerCase()
        )
        if (exists) {
          sendResponse({ success: false, error: 'Word already exists' })
          break
        }

        // Add word
        stored.state.words.push(word)

        // Create flashcard for spaced repetition (SM-2 initial values)
        const flashcard = {
          wordId: word.id,
          repetitions: 0,
          easinessFactor: 2.5,
          interval: 1,
          nextReview: Date.now() // Due immediately for first review
        }
        stored.state.flashcards.push([word.id, flashcard])

        try {
          await chrome.storage.local.set({
            'vocabulary-storage': JSON.stringify(stored)
          })
          sendResponse({ success: true })
        } catch (storageError) {
          // Handle storage quota exceeded
          const errorMsg = storageError instanceof Error ? storageError.message : String(storageError)
          if (errorMsg.includes('QUOTA') || errorMsg.includes('quota')) {
            sendResponse({ success: false, error: 'Storage quota exceeded. Please delete some words.' })
          } else {
            sendResponse({ success: false, error: 'Failed to save word. Please try again.' })
          }
        }
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

      case 'UPDATE_REMINDER': {
        const { reminderInterval, enabled } = message.payload as { reminderInterval?: number; enabled: boolean }
        if (enabled) {
          await scheduleStudyReminder(reminderInterval)
        } else {
          await chrome.alarms.clear('study-reminder')
        }
        sendResponse({ success: true })
        break
      }

      case 'TEST_NOTIFICATION': {
        // Get due cards and words for test notification
        const result = await chrome.storage.local.get(['vocabulary-storage', 'stats-storage'])
        let vocabData = null
        if (result['vocabulary-storage']) {
          try {
            vocabData = JSON.parse(result['vocabulary-storage'])
          } catch {
            console.warn('[VocabExt] Corrupted vocabulary storage in TEST_NOTIFICATION')
          }
        }
        const flashcards = vocabData?.state?.flashcards || []
        const words = vocabData?.state?.words || []
        const now = Date.now()

        // Get due cards
        const dueCards = flashcards.filter(([, card]: [string, { nextReview: number }]) =>
          card.nextReview <= now
        )
        const dueCount = dueCards.length

        // Get a random word to show in notification
        let randomWord = undefined
        if (dueCount > 0 && words.length > 0) {
          // Pick a random due card's word
          const randomDueCard = dueCards[Math.floor(Math.random() * dueCards.length)]
          const wordData = words.find((w: { id: string }) => w.id === randomDueCard[0])
          if (wordData) {
            randomWord = {
              word: wordData.word,
              definition: wordData.definition,
              translation: wordData.vietnameseTranslation
            }
          }
        } else if (words.length > 0) {
          // Pick any random word
          const wordData = words[Math.floor(Math.random() * words.length)]
          randomWord = {
            word: wordData.word,
            definition: wordData.definition,
            translation: wordData.vietnameseTranslation
          }
        }

        let statsData = null
        if (result['stats-storage']) {
          try {
            statsData = JSON.parse(result['stats-storage'])
          } catch {
            console.warn('[VocabExt] Corrupted stats storage in TEST_NOTIFICATION')
          }
        }
        const streak = statsData?.state?.stats?.currentStreak || 0

        await showDailyReminder(dueCount, streak, randomWord)
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
