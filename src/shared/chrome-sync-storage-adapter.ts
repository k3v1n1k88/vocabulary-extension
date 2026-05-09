/**
 * Chrome Sync Storage Adapter for Zustand
 *
 * Backed by `chrome.storage.sync` so persisted data rides Google's account
 * sync infrastructure across the user's signed-in Chrome installs.
 *
 * Migration semantics (issue #5):
 *   - First read: prefer `chrome.storage.sync`. If empty, fall back to
 *     `chrome.storage.local` (legacy v1.0.5 location). On a legacy hit, the
 *     value is best-effort copied to sync so subsequent reads + other devices
 *     pick it up. Migration is implicit; no version flags or first-run hooks.
 *
 * Quota handling:
 *   - `chrome.storage.sync` limits: 8KB per item, 100KB total, 512 items.
 *     Settings JSON is well under these. If a write ever exceeds quota, we
 *     fall back to local + console.warn so the user keeps a working extension
 *     instead of a silent failure.
 *
 * Use this adapter ONLY for stores that fit sync quotas (settings).
 * Vocabulary, stats, and highlights remain on `chrome-storage-adapter.ts`.
 */

import type { StorageAdapter } from './chrome-storage-adapter'

const KEY = '[VocabExt][sync-storage]'

const isQuotaError = (error: unknown): boolean =>
  error instanceof Error && /QUOTA|MAX_/i.test(error.message)

export const chromeSyncStorage: StorageAdapter = {
  getItem: async (name) => {
    try {
      const sync = await chrome.storage.sync.get(name)
      const syncValue = sync[name]
      if (syncValue !== undefined && syncValue !== null) {
        return syncValue as string
      }

      // Legacy fallback: pre-sync versions wrote to chrome.storage.local.
      const local = await chrome.storage.local.get(name)
      const localValue = local[name]
      if (localValue !== undefined && localValue !== null) {
        // Best-effort copy to sync so other devices pick it up.
        // If this fails (offline, quota), we still return the value;
        // the next read will retry the migration.
        try {
          await chrome.storage.sync.set({ [name]: localValue })
        } catch (copyError) {
          console.warn(`${KEY} legacy migration copy failed:`, copyError)
        }
        return localValue as string
      }

      return null
    } catch (error) {
      console.warn(`${KEY} read failed:`, error)
      return null
    }
  },

  setItem: async (name, value) => {
    try {
      await chrome.storage.sync.set({ [name]: value })
    } catch (error) {
      if (isQuotaError(error)) {
        console.warn(`${KEY} sync quota exceeded; falling back to local:`, error)
        try {
          await chrome.storage.local.set({ [name]: value })
        } catch (fallbackError) {
          console.error(`${KEY} fallback write failed:`, fallbackError)
        }
        return
      }
      console.error(`${KEY} write failed:`, error)
    }
  },

  removeItem: async (name) => {
    try {
      await chrome.storage.sync.remove(name)
    } catch (error) {
      console.warn(`${KEY} remove failed:`, error)
    }
  }
}
