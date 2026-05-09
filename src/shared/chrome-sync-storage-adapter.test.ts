import { describe, it, expect, vi } from 'vitest'
import { chromeSyncStorage } from './chrome-sync-storage-adapter'

const KEY = 'settings-storage'

describe('chromeSyncStorage', () => {
  describe('getItem', () => {
    it('returns sync value when present', async () => {
      await chrome.storage.sync.set({ [KEY]: '"sync-value"' })

      const result = await chromeSyncStorage.getItem(KEY)
      expect(result).toBe('"sync-value"')
    })

    it('falls back to local when sync is empty and copies to sync', async () => {
      await chrome.storage.local.set({ [KEY]: '"legacy-local"' })

      const result = await chromeSyncStorage.getItem(KEY)
      expect(result).toBe('"legacy-local"')

      // Best-effort migration: subsequent sync read should hit.
      const verify = await chrome.storage.sync.get(KEY)
      expect(verify[KEY]).toBe('"legacy-local"')
    })

    it('returns null when both areas are empty', async () => {
      const result = await chromeSyncStorage.getItem(KEY)
      expect(result).toBeNull()
    })

    it('does not read local when sync hits (avoids redundant work)', async () => {
      await chrome.storage.sync.set({ [KEY]: '"sync-hit"' })
      const localGetSpy = vi.spyOn(chrome.storage.local, 'get')

      await chromeSyncStorage.getItem(KEY)

      expect(localGetSpy).not.toHaveBeenCalled()
    })

    it('returns the legacy value even if migration copy fails', async () => {
      await chrome.storage.local.set({ [KEY]: '"legacy"' })
      const setSpy = vi.spyOn(chrome.storage.sync, 'set').mockRejectedValueOnce(new Error('QUOTA_BYTES exceeded'))

      const result = await chromeSyncStorage.getItem(KEY)
      expect(result).toBe('"legacy"')
      expect(setSpy).toHaveBeenCalled()
    })
  })

  describe('setItem', () => {
    it('writes to sync', async () => {
      await chromeSyncStorage.setItem(KEY, '"value"')

      const stored = await chrome.storage.sync.get(KEY)
      expect(stored[KEY]).toBe('"value"')
    })

    it('falls back to local when sync throws QUOTA error', async () => {
      vi.spyOn(chrome.storage.sync, 'set').mockRejectedValueOnce(new Error('QUOTA_BYTES_PER_ITEM exceeded'))

      await chromeSyncStorage.setItem(KEY, '"big"')

      const fallback = await chrome.storage.local.get(KEY)
      expect(fallback[KEY]).toBe('"big"')
    })

    it('logs and swallows non-quota errors (keeps extension running)', async () => {
      vi.spyOn(chrome.storage.sync, 'set').mockRejectedValueOnce(new Error('network blip'))
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(chromeSyncStorage.setItem(KEY, '"x"')).resolves.toBeUndefined()
      expect(errorSpy).toHaveBeenCalled()

      errorSpy.mockRestore()
    })
  })

  describe('removeItem', () => {
    it('removes from sync', async () => {
      await chrome.storage.sync.set({ [KEY]: '"v"' })

      await chromeSyncStorage.removeItem(KEY)

      const stored = await chrome.storage.sync.get(KEY)
      expect(stored[KEY]).toBeUndefined()
    })
  })
})
