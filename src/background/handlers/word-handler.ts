/**
 * Word Handler Module
 * Handles word lookup and save operations.
 */

import { lookupWordWithTranslation } from '@/shared/dictionary-api'
import type { Word, FlashcardData, LookupWordPayload } from '@/types'

/**
 * Handle LOOKUP_WORD message - lookup word in dictionary.
 */
export async function handleLookupWord(
  payload: LookupWordPayload,
  sendResponse: (response: unknown) => void
): Promise<void> {
  const { word } = payload
  const wordData = await lookupWordWithTranslation(word)
  sendResponse({ success: true, data: wordData })
}

/**
 * Handle SAVE_WORD message - save word to vocabulary storage.
 */
export async function handleSaveWord(
  payload: { word: Word },
  sendResponse: (response: unknown) => void
): Promise<void> {
  const { word } = payload

  // Get current storage
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

  // Initialize arrays if missing
  if (!stored.state.words) stored.state.words = []
  if (!stored.state.flashcards) stored.state.flashcards = []

  // Check if word already exists
  const exists = stored.state.words.some(
    (w: Word) => w.word.toLowerCase() === word.word.toLowerCase()
  )
  if (exists) {
    sendResponse({ success: false, error: 'Word already exists' })
    return
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
    const errorMsg = storageError instanceof Error ? storageError.message : String(storageError)
    if (errorMsg.includes('QUOTA') || errorMsg.includes('quota')) {
      sendResponse({ success: false, error: 'Storage quota exceeded. Please delete some words.' })
    } else {
      sendResponse({ success: false, error: 'Failed to save word. Please try again.' })
    }
  }
}
