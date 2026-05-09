/**
 * Notification Helpers Module
 * Storage access and data preparation for notifications.
 *
 * Settings live in chrome.storage.sync (issue #5: cross-device config sync).
 * Vocabulary + stats remain in chrome.storage.local. Reads merge results so
 * downstream parsers don't need to know which area each key lives in.
 */

import { SETTINGS_KEY, getSettingsRaw, patchSettings } from './settings-storage-access'

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
 * Vocabulary/stats from local; settings from sync (legacy local fallback).
 */
export async function getNotificationData(): Promise<NotificationData> {
  const [localResult, settingsRaw] = await Promise.all([
    chrome.storage.local.get(['vocabulary-storage', 'stats-storage']),
    getSettingsRaw()
  ])

  const merged: Record<string, string> = { ...(localResult as Record<string, string>) }
  if (settingsRaw) merged[SETTINGS_KEY] = settingsRaw

  const settings = parseSettings(merged)
  const { words, flashcards } = parseVocabData(merged)
  const { streak } = parseStatsData(merged)
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
  const raw = await getSettingsRaw()
  if (!raw) return false
  const settings = parseSettings({ [SETTINGS_KEY]: raw })
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
    const raw = await getSettingsRaw()
    if (!raw) return undefined
    const ts = parseSettings({ [SETTINGS_KEY]: raw })?.studyReminderSnoozeUntil
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
// Settings live in chrome.storage.sync as of issue #5; patchSettings handles sync writes.
export async function setStudyReminderSnoozeUntil(ts: number | undefined): Promise<void> {
  try {
    if (ts !== undefined && (typeof ts !== 'number' || !Number.isFinite(ts))) {
      console.warn('[VocabExt] Refusing to write non-finite snooze timestamp:', ts)
      return
    }
    if (ts === undefined) {
      // Patch with explicit undefined removes by JSON.stringify dropping the key
      // only if we use a sentinel — but our patchSettings does shallow merge, so
      // we need to read-modify-write to drop the field cleanly.
      await patchSettings({ studyReminderSnoozeUntil: undefined })
    } else {
      await patchSettings({ studyReminderSnoozeUntil: ts })
    }
  } catch (e) {
    console.warn('[VocabExt] Failed to write snooze timestamp:', e)
  }
}
