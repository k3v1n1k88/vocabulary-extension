/**
 * Notification Handler Module
 * Handles study reminders and test notifications.
 */

import { scheduleStudyReminder, showDailyReminder } from '@/shared/notifications'

/**
 * Handle UPDATE_REMINDER message - enable/disable study reminders.
 */
export async function handleUpdateReminder(
  payload: { reminderInterval?: number; enabled: boolean },
  sendResponse: (response: unknown) => void
): Promise<void> {
  const { reminderInterval, enabled } = payload
  if (enabled) {
    await scheduleStudyReminder(reminderInterval)
  } else {
    await chrome.alarms.clear('study-reminder')
  }
  sendResponse({ success: true })
}

/**
 * Handle TEST_NOTIFICATION message - show test notification with random word.
 */
export async function handleTestNotification(
  sendResponse: (response: unknown) => void
): Promise<void> {
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
}
