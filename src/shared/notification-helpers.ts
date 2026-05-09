/**
 * Notification Helpers Module
 * Storage access and data preparation for notifications.
 */

export interface WordPreview {
  word: string
  definition: string
  translation?: string
  pronunciation?: string
  partOfSpeech?: string
}

export interface NotificationData {
  settings: {
    notificationsEnabled: boolean
    reminderInterval?: number
    studyReminderSnoozeUntil?: number
  } | null
  dueCount: number
  streak: number
  words: Array<{
    id: string
    word: string
    definition: string
    vietnameseTranslation?: string
    pronunciation?: string
    partOfSpeech?: string
  }>
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
        translation: wordData.vietnameseTranslation,
        pronunciation: wordData.pronunciation,
        partOfSpeech: wordData.partOfSpeech
      }
    }
  }

  // Fallback to any random word
  const wordData = words[Math.floor(Math.random() * words.length)]
  return {
    word: wordData.word,
    definition: wordData.definition,
    translation: wordData.vietnameseTranslation,
    pronunciation: wordData.pronunciation,
    partOfSpeech: wordData.partOfSpeech
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

// Next local midnight (00:00:00.000); used for "Skip today" snooze. Native Date handles DST drift.
export function getNextLocalMidnight(now: number = Date.now()): number {
  const d = new Date(now)
  d.setHours(24, 0, 0, 0)
  return d.getTime()
}

// Read study-reminder snooze timestamp; undefined if missing, malformed, or non-finite.
export async function getStudyReminderSnoozeUntil(): Promise<number | undefined> {
  try {
    const result = await chrome.storage.local.get(['settings-storage'])
    const ts = parseSettings(result)?.studyReminderSnoozeUntil
    return typeof ts === 'number' && Number.isFinite(ts) ? ts : undefined
  } catch (e) {
    console.warn('[VocabExt] Failed to read snooze timestamp:', e)
    return undefined
  }
}

// Write study-reminder snooze timestamp; pass undefined to clear. RMW preserves other settings.
// NOTE: RMW races Zustand persist on `settings-storage` (`store.ts:239`). Concurrency window
// is tiny (snooze click ≤ 1/day vs settings edits while Options open). Best-effort by design;
// last-writer-wins. Per-write strict locking is out of scope for v1.
export async function setStudyReminderSnoozeUntil(ts: number | undefined): Promise<void> {
  try {
    if (ts !== undefined && (typeof ts !== 'number' || !Number.isFinite(ts))) {
      console.warn('[VocabExt] Refusing to write non-finite snooze timestamp:', ts)
      return
    }
    const result = await chrome.storage.local.get(['settings-storage'])
    const raw = result['settings-storage']
    let parsed: { state?: { settings?: Record<string, unknown> } } = {}
    if (typeof raw === 'string') {
      try { parsed = JSON.parse(raw) } catch { parsed = {} }
    }
    if (!parsed.state) parsed.state = {}
    if (!parsed.state.settings) parsed.state.settings = {}
    if (ts === undefined) {
      delete parsed.state.settings.studyReminderSnoozeUntil
    } else {
      parsed.state.settings.studyReminderSnoozeUntil = ts
    }
    await chrome.storage.local.set({ 'settings-storage': JSON.stringify(parsed) })
  } catch (e) {
    console.warn('[VocabExt] Failed to write snooze timestamp:', e)
  }
}
