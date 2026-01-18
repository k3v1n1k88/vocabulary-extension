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
  getDueCards
} from './notification-helpers'

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
 * Show notification for daily study reminder with a random word preview.
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

    // Build notification content
    let title = 'Time to Study!'
    let message = ''

    if (randomWord) {
      title = `Learn: "${randomWord.word}"`
      message = randomWord.definition.slice(0, 100)
      if (randomWord.translation) {
        message += `\n${randomWord.translation}`
      }
      if (dueCount > 1) {
        message += `\n\n+${dueCount - 1} more cards waiting`
      }
    } else if (dueCount > 0) {
      message = `You have ${dueCount} cards waiting for review!`
    } else if (streak > 0) {
      message = `Keep your ${streak}-day streak going!`
    } else {
      message = 'Start building your vocabulary today!'
    }

    const notificationId = await chrome.notifications.create('daily-reminder-' + Date.now(), {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
      title,
      message,
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
 * Handle study reminder alarm.
 */
async function handleStudyReminderAlarm(): Promise<void> {
  const data = await getNotificationData()

  if (!data.settings?.notificationsEnabled) return

  const randomWord = getRandomWordPreview(data.words, data.dueCards)
  await showDailyReminder(data.dueCount, data.streak, randomWord)
}

/**
 * Handle due cards check alarm.
 */
async function handleDueCardsCheckAlarm(): Promise<void> {
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
 * Handle alarm events.
 */
export function setupAlarmHandler(): void {
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
 * Handle notification button clicks.
 */
export function setupNotificationClickHandler(): void {
  chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
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
