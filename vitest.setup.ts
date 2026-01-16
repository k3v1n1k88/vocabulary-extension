import '@testing-library/jest-dom'
import { vi } from 'vitest'

// In-memory storage for testing
const storage: Record<string, string> = {}

// Create chrome mock manually (vitest-chrome has ESM/CJS issues)
const chromeMock = {
  storage: {
    local: {
      get: vi.fn((keys: string | string[] | object | null) => {
        return new Promise((resolve) => {
          if (keys === null) {
            resolve({ ...storage })
          } else if (typeof keys === 'string') {
            resolve({ [keys]: storage[keys] })
          } else if (Array.isArray(keys)) {
            const result: Record<string, string> = {}
            keys.forEach((key) => {
              if (storage[key] !== undefined) result[key] = storage[key]
            })
            resolve(result)
          } else {
            const result: Record<string, unknown> = {}
            Object.keys(keys).forEach((key) => {
              result[key] = storage[key] ?? (keys as Record<string, unknown>)[key]
            })
            resolve(result)
          }
        })
      }),
      set: vi.fn((items: Record<string, string>) => {
        return new Promise<void>((resolve) => {
          Object.assign(storage, items)
          resolve()
        })
      }),
      remove: vi.fn((keys: string | string[]) => {
        return new Promise<void>((resolve) => {
          if (typeof keys === 'string') {
            delete storage[keys]
          } else {
            keys.forEach((key) => delete storage[key])
          }
          resolve()
        })
      })
    },
    onChanged: {
      addListener: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn()
    }
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn()
  }
}

// Assign mocked chrome to global
Object.assign(global, { chrome: chromeMock })

// Reset all mocks and storage before each test
beforeEach(() => {
  vi.clearAllMocks()
  // Clear storage
  Object.keys(storage).forEach((key) => delete storage[key])
})
