/**
 * Browser notification service for learning reminders
 * Note for MacOS: Ensure Chrome has notification permission in System Settings > Notifications
 */

import {
  type WordPreview,
  getNotificationData,
  getRandomWordPreview,
  parseSettings,
  parseVocabData,
  getDueCards,
  getNextLocalMidnight,
  setStudyReminderSnoozeUntil
} from './notification-helpers'
import { buildReminderContent } from './notification-content-builder'

// Notification ID prefix reserved for study-reminder notifications (carries snooze buttons).
const REMINDER_ID_PREFIX = 'daily-reminder-'
const SNOOZE_ONE_HOUR_MS = 60 * 60 * 1000

// Idempotency guards: service-worker.ts calls initNotifications() both on onInstalled and at top
// level; without these guards, listeners would register twice on install/update and run handlers
// twice (RMW collision on snooze write, double openPopup, etc).
let alarmHandlerRegistered = false
let clickHandlerRegistered = false

/** @internal — test-only: resets module-level listener guards. */
export function __resetListenerGuardsForTests(): void {
  alarmHandlerRegistered = false
  clickHandlerRegistered = false
}

/**
 * Detect if running on MacOS (requireInteraction not supported on MacOS).
 */
function isMacOS(): boolean {
  return typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || '')
}

const ALARM_STUDY_REMINDER = 'study-reminder'
const ALARM_DUE_CHECK = 'due-cards-check'
const DEFAULT_REMINDER_INTERVAL = 60 // 1 hour in minutes

/**
 * Schedule interval-based study reminder.
 */
export async function scheduleStudyReminder(intervalMinutes?: number): Promise<void> {
  await chrome.alarms.clear(ALARM_STUDY_REMINDER)

  const interval = intervalMinutes || DEFAULT_REMINDER_INTERVAL
  if (interval <= 0) return

  await chrome.alarms.create(ALARM_STUDY_REMINDER, {
    delayInMinutes: interval,
    periodInMinutes: interval
  })

  console.log(`[VocabExt] Study reminder scheduled every ${interval} minutes`)
}

/**
 * Schedule periodic check for due cards (every hour).
 */
export async function scheduleDueCardsCheck(): Promise<void> {
  await chrome.alarms.clear(ALARM_DUE_CHECK)

  await chrome.alarms.create(ALARM_DUE_CHECK, {
    delayInMinutes: 60,
    periodInMinutes: 60
  })
}

/**
 * Show study-reminder notification (packed: title + message + contextMessage + 2 buttons).
 * NOTE: snooze gating lives in handleStudyReminderAlarm. This function is unconditional
 * so TEST_NOTIFICATION (and any future direct caller) always fires.
 */
export async function showDailyReminder(
  dueCount: number,
  streak: number,
  randomWord?: WordPreview
): Promise<void> {
  try {
    const permission = await chrome.permissions.contains({ permissions: ['notifications'] })
    if (!permission) {
      console.warn('[VocabExt] Notification permission not granted')
      return
    }

    const { title, message, contextMessage } = buildReminderContent(dueCount, streak, randomWord)

    const notificationId = await chrome.notifications.create(REMINDER_ID_PREFIX + Date.now(), {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
      title,
      message,
      ...(contextMessage ? { contextMessage } : {}),
      buttons: [{ title: 'Snooze 1h' }, { title: 'Skip today' }],
      priority: 2,
      ...(isMacOS() ? {} : { requireInteraction: true })
    })
    console.log('[VocabExt] Notification created:', notificationId)
  } catch (error) {
    console.error('[VocabExt] Failed to create notification:', error)
  }
}

/**
 * Show notification when cards are due.
 */
export async function showDueCardsNotification(dueCount: number): Promise<void> {
  if (dueCount === 0) return

  await chrome.notifications.create('due-cards', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
    title: 'Cards Due for Review',
    message: `${dueCount} card${dueCount > 1 ? 's are' : ' is'} ready for review. Don't forget to study!`,
    priority: 1
  })
}

/**
 * Show streak at risk notification.
 */
export async function showStreakAtRiskNotification(streak: number): Promise<void> {
  if (streak === 0) return

  await chrome.notifications.create('streak-risk', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
    title: 'Streak at Risk!',
    message: `Don't lose your ${streak}-day streak! Study now to keep it going.`,
    priority: 2
  })
}

/**
 * Show word saved notification.
 */
export async function showWordSavedNotification(word: string): Promise<void> {
  await chrome.notifications.create(`word-saved-${Date.now()}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon-48.png'),
    title: 'Word Saved!',
    message: `"${word}" added to your vocabulary.`,
    priority: 0
  })
}

/**
 * Handle study reminder alarm. Gates on snooze; auto-clears expired snooze.
 * Exported for testability.
 */
export async function handleStudyReminderAlarm(): Promise<void> {
  const data = await getNotificationData()

  if (!data.settings?.notificationsEnabled) return

  const snoozeUntil = data.settings.studyReminderSnoozeUntil
  const now = Date.now()
  if (snoozeUntil) {
    if (now < snoozeUntil) return
    // Stale snooze: clear and proceed.
    await setStudyReminderSnoozeUntil(undefined)
  }

  const randomWord = getRandomWordPreview(data.words, data.dueCards)
  await showDailyReminder(data.dueCount, data.streak, randomWord)
}

/**
 * Handle due cards check alarm. Independent of snooze (per plan: snooze targets study reminders only).
 * Exported for testability.
 */
export async function handleDueCardsCheckAlarm(): Promise<void> {
  const result = await chrome.storage.local.get(['vocabulary-storage', 'settings-storage'])

  const settings = parseSettings(result)
  if (!settings?.notificationsEnabled) return

  const { flashcards } = parseVocabData(result)
  const dueCards = getDueCards(flashcards)

  // Only notify if more than 5 cards are due
  if (dueCards.length >= 5) {
    await showDueCardsNotification(dueCards.length)
  }
}

/**
 * Handle alarm events. Idempotent — safe to call from multiple init paths.
 */
export function setupAlarmHandler(): void {
  if (alarmHandlerRegistered) return
  alarmHandlerRegistered = true
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log('[VocabExt] Alarm triggered:', alarm.name)

    if (alarm.name === ALARM_STUDY_REMINDER) {
      await handleStudyReminderAlarm()
    }

    if (alarm.name === ALARM_DUE_CHECK) {
      await handleDueCardsCheckAlarm()
    }
  })
}

/**
 * Handle notification button clicks. Idempotent — safe to call from multiple init paths.
 * MV3: listener registration must stay top-level + synchronous (no async IIFE).
 */
export function setupNotificationClickHandler(): void {
  if (clickHandlerRegistered) return
  clickHandlerRegistered = true
  chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
    if (notificationId.startsWith(REMINDER_ID_PREFIX)) {
      if (buttonIndex === 0) {
        await setStudyReminderSnoozeUntil(Date.now() + SNOOZE_ONE_HOUR_MS)
      } else if (buttonIndex === 1) {
        await setStudyReminderSnoozeUntil(getNextLocalMidnight())
      }
      chrome.notifications.clear(notificationId)
      return
    }

    // Legacy behavior for any other notification type with buttons.
    if (buttonIndex === 0) {
      chrome.action.openPopup()
    }
    chrome.notifications.clear(notificationId)
  })

  chrome.notifications.onClicked.addListener((notificationId) => {
    chrome.action.openPopup()
    chrome.notifications.clear(notificationId)
  })
}

/**
 * Initialize notification system.
 */
export async function initNotifications(): Promise<void> {
  setupAlarmHandler()
  setupNotificationClickHandler()

  // Get settings and schedule reminders
  const result = await chrome.storage.local.get(['settings-storage'])
  const settings = parseSettings(result)

  if (settings?.notificationsEnabled) {
    await scheduleStudyReminder(settings?.reminderInterval)
  }

  await scheduleDueCardsCheck()

  console.log('[VocabExt] Notification system initialized')
}
