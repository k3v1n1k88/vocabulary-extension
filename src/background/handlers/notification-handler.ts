/**
 * Notification Handler Module
 * Handles study reminders and test notifications.
 */

import { scheduleStudyReminder, showDailyReminder } from '@/shared/notifications'
import { getNotificationData, getRandomWordPreview } from '@/shared/notification-helpers'

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
  const { dueCount, streak, words, dueCards } = await getNotificationData()
  const randomWord = getRandomWordPreview(words, dueCards)

  await showDailyReminder(dueCount, streak, randomWord)
  sendResponse({ success: true })
}
