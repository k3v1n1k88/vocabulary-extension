import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Separate in-memory backing stores for chrome.storage.local and chrome.storage.sync.
// Mirrors real Chrome semantics: the two areas are independent, and listeners
// receive an `areaName` argument indicating which area changed.
const localStore: Record<string, string> = {}
const syncStore: Record<string, string> = {}

function makeAreaMock(backing: Record<string, string>) {
  return {
    get: vi.fn((keys: string | string[] | object | null) => {
      return new Promise((resolve) => {
        if (keys === null || keys === undefined) {
          resolve({ ...backing })
        } else if (typeof keys === 'string') {
          resolve({ [keys]: backing[keys] })
        } else if (Array.isArray(keys)) {
          const result: Record<string, string> = {}
          keys.forEach((key) => {
            if (backing[key] !== undefined) result[key] = backing[key]
          })
          resolve(result)
        } else {
          const result: Record<string, unknown> = {}
          Object.keys(keys).forEach((key) => {
            result[key] = backing[key] ?? (keys as Record<string, unknown>)[key]
          })
          resolve(result)
        }
      })
    }),
    set: vi.fn((items: Record<string, string>) => {
      return new Promise<void>((resolve) => {
        Object.assign(backing, items)
        resolve()
      })
    }),
    remove: vi.fn((keys: string | string[]) => {
      return new Promise<void>((resolve) => {
        if (typeof keys === 'string') {
          delete backing[keys]
        } else {
          keys.forEach((key) => delete backing[key])
        }
        resolve()
      })
    })
  }
}

// Create chrome mock manually (vitest-chrome has ESM/CJS issues)
const chromeMock = {
  storage: {
    local: makeAreaMock(localStore),
    sync: makeAreaMock(syncStore),
    onChanged: {
      addListener: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn()
    },
    getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`)
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn()
  },
  notifications: {
    create: vi.fn((id: string) => Promise.resolve(id)),
    clear: vi.fn(() => Promise.resolve(true)),
    onClicked: { addListener: vi.fn() },
    onButtonClicked: { addListener: vi.fn() }
  },
  alarms: {
    create: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve(true)),
    onAlarm: { addListener: vi.fn() }
  },
  permissions: {
    contains: vi.fn(() => Promise.resolve(true))
  },
  action: {
    openPopup: vi.fn(() => Promise.resolve())
  }
}

// Assign mocked chrome to global
Object.assign(global, { chrome: chromeMock })

// Reset all mocks and both storage areas before each test
beforeEach(() => {
  vi.clearAllMocks()
  Object.keys(localStore).forEach((key) => delete localStore[key])
  Object.keys(syncStore).forEach((key) => delete syncStore[key])
})
