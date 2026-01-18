/**
 * Chrome Storage Adapter for Zustand
 * Provides async storage interface compatible with Zustand's persist middleware.
 */

export interface StorageAdapter {
  getItem: (name: string) => Promise<string | null>
  setItem: (name: string, value: string) => Promise<void>
  removeItem: (name: string) => Promise<void>
}

/**
 * Chrome storage adapter for Zustand persistence.
 * Uses chrome.storage.local for extension data storage.
 */
export const chromeStorage: StorageAdapter = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const result = await chrome.storage.local.get(name)
      return result[name] ?? null
    } catch (error) {
      console.warn('[VocabExt] Storage read failed:', error)
      return null
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await chrome.storage.local.set({ [name]: value })
    } catch (error) {
      console.error('[VocabExt] Storage write failed:', error)
      // Could be quota exceeded
      if (error instanceof Error && error.message.includes('QUOTA')) {
        throw new Error('Storage quota exceeded. Please delete some words.')
      }
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      await chrome.storage.local.remove(name)
    } catch (error) {
      console.warn('[VocabExt] Storage remove failed:', error)
    }
  }
}
