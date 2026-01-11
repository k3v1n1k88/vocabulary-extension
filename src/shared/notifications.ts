/**
 * Browser notification service for learning reminders
 */

const ALARM_STUDY_REMINDER = 'study-reminder'
const ALARM_DUE_CHECK = 'due-cards-check'
const DEFAULT_REMINDER_INTERVAL = 60 // 1 hour in minutes

/**
 * Schedule interval-based study reminder
 * @param intervalMinutes - Interval in minutes (default: 60)
 */
export async function scheduleStudyReminder(intervalMinutes?: number): Promise<void> {
  // Clear existing alarm
  await chrome.alarms.clear(ALARM_STUDY_REMINDER)

  const interval = intervalMinutes || DEFAULT_REMINDER_INTERVAL
  if (interval <= 0) return

  // Create alarm with interval
  await chrome.alarms.create(ALARM_STUDY_REMINDER, {
    delayInMinutes: interval,
    periodInMinutes: interval
  })

  console.log(`[VocabExt] Study reminder scheduled every ${interval} minutes`)
}

/**
 * Schedule periodic check for due cards (every hour)
 */
export async function scheduleDueCardsCheck(): Promise<void> {
  await chrome.alarms.clear(ALARM_DUE_CHECK)

  await chrome.alarms.create(ALARM_DUE_CHECK, {
    delayInMinutes: 60,
    periodInMinutes: 60 // Check every hour
  })
}

interface WordPreview {
  word: string
  definition: string
  translation?: string
}

/**
 * Show notification for daily study reminder with a random word preview
 */
export async function showDailyReminder(
  dueCount: number,
  streak: number,
  randomWord?: WordPreview
): Promise<void> {
  try {
    // Check notification permission first
    const permission = await chrome.permissions.contains({ permissions: ['notifications'] })
    console.log('[VocabExt] Notification permission:', permission)

    if (!permission) {
      console.warn('[VocabExt] Notification permission not granted')
      return
    }

    // Build notification content
    let title = 'Time to Study!'
    let message = ''

    if (randomWord) {
      // Show word preview in notification
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
      requireInteraction: true
    })
    console.log('[VocabExt] Notification created:', notificationId)
  } catch (error) {
    console.error('[VocabExt] Failed to create notification:', error)
  }
}

/**
 * Show notification when cards are due
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
 * Show streak at risk notification
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
 * Show word saved notification
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
 * Handle alarm events
 */
export function setupAlarmHandler(): void {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log('[VocabExt] Alarm triggered:', alarm.name)

    if (alarm.name === ALARM_STUDY_REMINDER) {
      // Get due cards count and streak
      const result = await chrome.storage.local.get(['vocabulary-storage', 'stats-storage', 'settings-storage'])

      // Check if notifications are enabled
      let settings = null
      if (result['settings-storage']) {
        try {
          settings = JSON.parse(result['settings-storage'])?.state?.settings
        } catch (e) {
          console.warn('[VocabExt] Failed to parse settings:', e)
        }
      }

      if (!settings?.notificationsEnabled) return

      // Get due cards count
      let vocabData = null
      if (result['vocabulary-storage']) {
        try {
          vocabData = JSON.parse(result['vocabulary-storage'])
        } catch (e) {
          console.warn('[VocabExt] Failed to parse vocabulary data:', e)
        }
      }

      const flashcards = vocabData?.state?.flashcards || []
      const words = vocabData?.state?.words || []
      const now = Date.now()
      const dueCards = flashcards.filter(([, card]: [string, { nextReview: number }]) =>
        card.nextReview <= now
      )
      const dueCount = dueCards.length

      // Get streak
      let statsData = null
      if (result['stats-storage']) {
        try {
          statsData = JSON.parse(result['stats-storage'])
        } catch (e) {
          console.warn('[VocabExt] Failed to parse stats data:', e)
        }
      }
      const streak = statsData?.state?.stats?.currentStreak || 0

      // Get a random word to show in notification
      let randomWord: WordPreview | undefined = undefined
      if (dueCount > 0 && words.length > 0) {
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
        const wordData = words[Math.floor(Math.random() * words.length)]
        randomWord = {
          word: wordData.word,
          definition: wordData.definition,
          translation: wordData.vietnameseTranslation
        }
      }

      await showDailyReminder(dueCount, streak, randomWord)
    }

    if (alarm.name === ALARM_DUE_CHECK) {
      // Check for due cards and notify if many are waiting
      const result = await chrome.storage.local.get(['vocabulary-storage', 'settings-storage'])

      let settings = null
      if (result['settings-storage']) {
        try {
          settings = JSON.parse(result['settings-storage'])?.state?.settings
        } catch (e) {
          console.warn('[VocabExt] Failed to parse settings:', e)
        }
      }

      if (!settings?.notificationsEnabled) return

      let vocabData = null
      if (result['vocabulary-storage']) {
        try {
          vocabData = JSON.parse(result['vocabulary-storage'])
        } catch (e) {
          console.warn('[VocabExt] Failed to parse vocabulary data:', e)
        }
      }

      const flashcards = vocabData?.state?.flashcards || []
      const now = Date.now()
      const dueCount = flashcards.filter(([, card]: [string, { nextReview: number }]) =>
        card.nextReview <= now
      ).length

      // Only notify if more than 5 cards are due
      if (dueCount >= 5) {
        await showDueCardsNotification(dueCount)
      }
    }
  })
}

/**
 * Handle notification button clicks
 */
export function setupNotificationClickHandler(): void {
  chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (buttonIndex === 0) {
      // Open popup to study
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
 * Initialize notification system
 */
export async function initNotifications(): Promise<void> {
  // Setup handlers
  setupAlarmHandler()
  setupNotificationClickHandler()

  // Get settings and schedule reminders
  const result = await chrome.storage.local.get(['settings-storage'])
  let settings = null
  if (result['settings-storage']) {
    try {
      settings = JSON.parse(result['settings-storage'])?.state?.settings
    } catch (e) {
      console.warn('[VocabExt] Failed to parse settings:', e)
    }
  }

  if (settings?.notificationsEnabled) {
    await scheduleStudyReminder(settings?.reminderInterval)
  }

  // Start due cards check
  await scheduleDueCardsCheck()

  console.log('[VocabExt] Notification system initialized')
}
