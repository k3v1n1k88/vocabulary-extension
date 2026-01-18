/**
 * Notification Helpers Module
 * Storage access and data preparation for notifications.
 */

export interface WordPreview {
  word: string
  definition: string
  translation?: string
}

export interface NotificationData {
  settings: {
    notificationsEnabled: boolean
    reminderInterval?: number
  } | null
  dueCount: number
  streak: number
  words: Array<{ id: string; word: string; definition: string; vietnameseTranslation?: string }>
  dueCards: Array<[string, { nextReview: number }]>
}

/**
 * Parse settings from storage.
 */
export function parseSettings(storageResult: Record<string, string>): NotificationData['settings'] {
  if (!storageResult['settings-storage']) return null
  try {
    return JSON.parse(storageResult['settings-storage'])?.state?.settings || null
  } catch (e) {
    console.warn('[VocabExt] Failed to parse settings:', e)
    return null
  }
}

/**
 * Parse vocabulary data from storage.
 */
export function parseVocabData(storageResult: Record<string, string>): {
  words: NotificationData['words']
  flashcards: Array<[string, { nextReview: number }]>
} {
  if (!storageResult['vocabulary-storage']) {
    return { words: [], flashcards: [] }
  }
  try {
    const data = JSON.parse(storageResult['vocabulary-storage'])
    return {
      words: data?.state?.words || [],
      flashcards: data?.state?.flashcards || []
    }
  } catch (e) {
    console.warn('[VocabExt] Failed to parse vocabulary data:', e)
    return { words: [], flashcards: [] }
  }
}

/**
 * Parse stats data from storage.
 */
export function parseStatsData(storageResult: Record<string, string>): { streak: number } {
  if (!storageResult['stats-storage']) {
    return { streak: 0 }
  }
  try {
    const data = JSON.parse(storageResult['stats-storage'])
    return { streak: data?.state?.stats?.currentStreak || 0 }
  } catch (e) {
    console.warn('[VocabExt] Failed to parse stats data:', e)
    return { streak: 0 }
  }
}

/**
 * Get due cards from flashcards array.
 */
export function getDueCards(
  flashcards: Array<[string, { nextReview: number }]>
): Array<[string, { nextReview: number }]> {
  const now = Date.now()
  return flashcards.filter(([, card]) => card.nextReview <= now)
}

/**
 * Get a random word preview for notification.
 */
export function getRandomWordPreview(
  words: NotificationData['words'],
  dueCards: NotificationData['dueCards']
): WordPreview | undefined {
  if (words.length === 0) return undefined

  // Prefer due cards
  if (dueCards.length > 0) {
    const randomDueCard = dueCards[Math.floor(Math.random() * dueCards.length)]
    const wordData = words.find(w => w.id === randomDueCard[0])
    if (wordData) {
      return {
        word: wordData.word,
        definition: wordData.definition,
        translation: wordData.vietnameseTranslation
      }
    }
  }

  // Fallback to any random word
  const wordData = words[Math.floor(Math.random() * words.length)]
  return {
    word: wordData.word,
    definition: wordData.definition,
    translation: wordData.vietnameseTranslation
  }
}

/**
 * Get all notification data from storage.
 */
export async function getNotificationData(): Promise<NotificationData> {
  const result = await chrome.storage.local.get([
    'vocabulary-storage',
    'stats-storage',
    'settings-storage'
  ])

  const settings = parseSettings(result)
  const { words, flashcards } = parseVocabData(result)
  const { streak } = parseStatsData(result)
  const dueCards = getDueCards(flashcards)

  return {
    settings,
    dueCount: dueCards.length,
    streak,
    words,
    dueCards
  }
}

/**
 * Check if notifications are enabled in settings.
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  const result = await chrome.storage.local.get(['settings-storage'])
  const settings = parseSettings(result)
  return settings?.notificationsEnabled ?? false
}
