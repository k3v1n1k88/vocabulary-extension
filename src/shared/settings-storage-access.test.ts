import { describe, it, expect } from 'vitest'
import {
  SETTINGS_KEY,
  getSettingsRaw,
  getSettingsRecord,
  getSettings,
  setSettingsRecord,
  patchSettings
} from './settings-storage-access'

describe('settings-storage-access', () => {
  describe('getSettingsRaw', () => {
    it('returns null when both areas empty', async () => {
      expect(await getSettingsRaw()).toBeNull()
    })

    it('returns sync value when present', async () => {
      await chrome.storage.sync.set({ [SETTINGS_KEY]: '"sync"' })
      expect(await getSettingsRaw()).toBe('"sync"')
    })

    it('falls back to local for legacy installs', async () => {
      await chrome.storage.local.set({ [SETTINGS_KEY]: '"local"' })
      expect(await getSettingsRaw()).toBe('"local"')
    })

    it('prefers sync over local', async () => {
      await chrome.storage.sync.set({ [SETTINGS_KEY]: '"sync"' })
      await chrome.storage.local.set({ [SETTINGS_KEY]: '"local"' })
      expect(await getSettingsRaw()).toBe('"sync"')
    })
  })

  describe('getSettingsRecord', () => {
    it('parses JSON record', async () => {
      const payload = { state: { settings: { dailyGoal: 30 } }, version: 0 }
      await chrome.storage.sync.set({ [SETTINGS_KEY]: JSON.stringify(payload) })

      const record = await getSettingsRecord()
      expect(record).toEqual(payload)
    })

    it('returns null on malformed JSON', async () => {
      await chrome.storage.sync.set({ [SETTINGS_KEY]: 'not-json' })
      expect(await getSettingsRecord()).toBeNull()
    })
  })

  describe('getSettings', () => {
    it('returns inner settings object', async () => {
      await chrome.storage.sync.set({
        [SETTINGS_KEY]: JSON.stringify({ state: { settings: { theme: 'dark' } } })
      })
      const settings = await getSettings<{ theme: string }>()
      expect(settings).toEqual({ theme: 'dark' })
    })
  })

  describe('setSettingsRecord', () => {
    it('writes a fresh record to sync', async () => {
      await setSettingsRecord({ state: { settings: { dailyGoal: 50 } }, version: 0 })

      const stored = await chrome.storage.sync.get(SETTINGS_KEY)
      const parsed = JSON.parse(stored[SETTINGS_KEY])
      expect(parsed.state.settings.dailyGoal).toBe(50)
    })
  })

  describe('patchSettings', () => {
    it('shallow-merges new fields without losing existing ones', async () => {
      await chrome.storage.sync.set({
        [SETTINGS_KEY]: JSON.stringify({
          state: { settings: { dailyGoal: 20, theme: 'light' } }
        })
      })

      await patchSettings({ theme: 'dark' })

      const stored = await chrome.storage.sync.get(SETTINGS_KEY)
      const parsed = JSON.parse(stored[SETTINGS_KEY])
      expect(parsed.state.settings).toEqual({ dailyGoal: 20, theme: 'dark' })
    })

    it('builds envelope when no record exists', async () => {
      await patchSettings({ dailyGoal: 10 })

      const stored = await chrome.storage.sync.get(SETTINGS_KEY)
      const parsed = JSON.parse(stored[SETTINGS_KEY])
      expect(parsed.state.settings.dailyGoal).toBe(10)
    })

    it('drops keys set to undefined (JSON.stringify omits them)', async () => {
      await chrome.storage.sync.set({
        [SETTINGS_KEY]: JSON.stringify({
          state: { settings: { dailyGoal: 20, snooze: 123 } }
        })
      })

      await patchSettings({ snooze: undefined })

      const stored = await chrome.storage.sync.get(SETTINGS_KEY)
      const parsed = JSON.parse(stored[SETTINGS_KEY])
      expect('snooze' in parsed.state.settings).toBe(false)
      expect(parsed.state.settings.dailyGoal).toBe(20)
    })

    it('migrates legacy local record to sync on first patch', async () => {
      await chrome.storage.local.set({
        [SETTINGS_KEY]: JSON.stringify({ state: { settings: { dailyGoal: 7 } } })
      })

      await patchSettings({ theme: 'dark' })

      const stored = await chrome.storage.sync.get(SETTINGS_KEY)
      const parsed = JSON.parse(stored[SETTINGS_KEY])
      expect(parsed.state.settings).toEqual({ dailyGoal: 7, theme: 'dark' })
    })
  })
})
