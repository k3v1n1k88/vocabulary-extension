import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  __resetListenerGuardsForTests,
  handleStudyReminderAlarm,
  setupNotificationClickHandler,
  showDailyReminder
} from './notifications'

type Settings = {
  notificationsEnabled?: boolean
  studyReminderSnoozeUntil?: number
  reminderInterval?: number
}

// Settings live in chrome.storage.sync (issue #5: cross-device sync).
async function seedSettings(s: Settings): Promise<void> {
  await chrome.storage.sync.set({
    'settings-storage': JSON.stringify({ state: { settings: s } })
  })
}

// Vocabulary stays in chrome.storage.local.
async function seedVocab(words: unknown[], flashcards: unknown[]): Promise<void> {
  await chrome.storage.local.set({
    'vocabulary-storage': JSON.stringify({ state: { words, flashcards } })
  })
}

function readSnoozeFromStorage(): number | undefined {
  const calls = vi.mocked(chrome.storage.sync.set).mock.calls
  const last = calls[calls.length - 1]
  const raw = last?.[0] as { 'settings-storage'?: string } | undefined
  if (!raw?.['settings-storage']) return undefined
  try {
    return JSON.parse(raw['settings-storage'])?.state?.settings?.studyReminderSnoozeUntil
  } catch {
    return undefined
  }
}

describe('handleStudyReminderAlarm', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('skips when snoozeUntil is in the future', async () => {
    vi.setSystemTime(new Date('2026-05-09T12:00:00Z'))
    await seedSettings({
      notificationsEnabled: true,
      studyReminderSnoozeUntil: Date.now() + 60_000
    })

    await handleStudyReminderAlarm()

    expect(chrome.notifications.create).not.toHaveBeenCalled()
  })

  it('fires and auto-clears stale snooze', async () => {
    vi.setSystemTime(new Date('2026-05-09T12:00:00Z'))
    await seedSettings({
      notificationsEnabled: true,
      studyReminderSnoozeUntil: Date.now() - 60_000
    })
    await seedVocab([], [])

    await handleStudyReminderAlarm()

    expect(chrome.notifications.create).toHaveBeenCalledTimes(1)

    // Last storage write must clear the snooze key.
    const stored = await chrome.storage.sync.get(['settings-storage'])
    const parsed = JSON.parse(stored['settings-storage'])
    expect('studyReminderSnoozeUntil' in parsed.state.settings).toBe(false)
  })

  it('skips when notifications disabled (regression)', async () => {
    vi.setSystemTime(new Date('2026-05-09T12:00:00Z'))
    await seedSettings({ notificationsEnabled: false })

    await handleStudyReminderAlarm()

    expect(chrome.notifications.create).not.toHaveBeenCalled()
  })

  it('fires normally when no snooze is set', async () => {
    vi.setSystemTime(new Date('2026-05-09T12:00:00Z'))
    await seedSettings({ notificationsEnabled: true })
    await seedVocab([], [])

    await handleStudyReminderAlarm()

    expect(chrome.notifications.create).toHaveBeenCalledTimes(1)
  })
})

describe('setupNotificationClickHandler', () => {
  beforeEach(() => {
    __resetListenerGuardsForTests()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  function captureButtonHandler(): (id: string, idx: number) => Promise<void> | void {
    setupNotificationClickHandler()
    const calls = vi.mocked(chrome.notifications.onButtonClicked.addListener).mock.calls
    const handler = calls[calls.length - 1]?.[0]
    if (!handler) throw new Error('no button handler registered')
    return handler as (id: string, idx: number) => Promise<void> | void
  }

  function captureClickHandler(): (id: string) => void {
    setupNotificationClickHandler()
    const calls = vi.mocked(chrome.notifications.onClicked.addListener).mock.calls
    const handler = calls[calls.length - 1]?.[0]
    if (!handler) throw new Error('no click handler registered')
    return handler as (id: string) => void
  }

  it('button 0 on daily-reminder- sets snooze = now + 1h and clears notification', async () => {
    vi.setSystemTime(new Date('2026-05-09T12:00:00Z'))
    const handler = captureButtonHandler()

    await handler('daily-reminder-123', 0)

    expect(readSnoozeFromStorage()).toBe(Date.now() + 60 * 60 * 1000)
    expect(chrome.notifications.clear).toHaveBeenCalledWith('daily-reminder-123')
    expect(chrome.action.openPopup).not.toHaveBeenCalled()
  })

  it('button 1 on daily-reminder- sets snooze = next local midnight', async () => {
    vi.setSystemTime(new Date(2026, 4, 9, 12, 0, 0))
    const handler = captureButtonHandler()

    await handler('daily-reminder-456', 1)

    const expected = new Date(2026, 4, 10, 0, 0, 0).getTime()
    expect(readSnoozeFromStorage()).toBe(expected)
    expect(chrome.action.openPopup).not.toHaveBeenCalled()
  })

  it('non-daily-reminder ID with button 0 falls back to legacy openPopup', async () => {
    const handler = captureButtonHandler()

    await handler('due-cards', 0)

    expect(chrome.action.openPopup).toHaveBeenCalledTimes(1)
    expect(chrome.notifications.clear).toHaveBeenCalledWith('due-cards')
  })

  it('body click always opens popup (unchanged)', () => {
    const handler = captureClickHandler()

    handler('any-id')

    expect(chrome.action.openPopup).toHaveBeenCalledTimes(1)
    expect(chrome.notifications.clear).toHaveBeenCalledWith('any-id')
  })
})

describe('showDailyReminder bypasses snooze', () => {
  it('creates notification even when active snooze is in storage', async () => {
    await seedSettings({
      notificationsEnabled: true,
      studyReminderSnoozeUntil: Date.now() + 60 * 60 * 1000
    })

    await showDailyReminder(2, 5, {
      word: 'apple',
      definition: 'a fruit'
    })

    expect(chrome.notifications.create).toHaveBeenCalledTimes(1)
    const callArgs = vi.mocked(chrome.notifications.create).mock.calls[0]
    expect(callArgs[0]).toMatch(/^daily-reminder-/)
  })

  it('does not fire when notification permission missing', async () => {
    const containsMock = chrome.permissions.contains as unknown as ReturnType<typeof vi.fn>
    containsMock.mockResolvedValueOnce(false)

    await showDailyReminder(0, 0, undefined)

    expect(chrome.notifications.create).not.toHaveBeenCalled()
  })
})
