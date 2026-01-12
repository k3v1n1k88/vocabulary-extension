---
phase: 02
title: "Extension Skeleton"
status: pending
priority: P1
effort: 3h
dependencies: [phase-01]
---

# Phase 02: Extension Skeleton

## Context

Create working Chrome extension structure. Manifest V3, background service worker, content script, popup, and options page. Test extension loads in Chrome.

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-10 |
| Priority | P1 (Critical Path) |
| Status | pending |
| Effort | 3h |
| Dependencies | Phase 01 completed |

## Requirements

1. Manifest V3 configuration with all permissions
2. Background service worker (message routing)
3. Content script (DOM interaction)
4. Popup (React UI)
5. Options page (React UI)
6. Extension loads in Chrome without errors

## Implementation Steps

### Step 1: Create Manifest (30min)

**File:** `src/manifest.ts`
```typescript
import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Vocabulary Extension',
  description: 'Learn vocabulary with flashcards and spaced repetition',
  version: '0.1.0',

  permissions: [
    'storage',
    'contextMenus',
    'activeTab',
    'identity',
    'notifications',
    'alarms',
  ],

  host_permissions: [
    'https://*.googleapis.com/*',
    'https://*.firebaseio.com/*',
  ],

  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },

  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/content-script.ts'],
      run_at: 'document_idle',
    },
  ],

  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: 'icons/icon16.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
  },

  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },

  icons: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },

  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
})
```

### Step 2: Background Service Worker (45min)

**File:** `src/background/service-worker.ts`
```typescript
// Message types
export type MessageType =
  | 'LOOKUP_WORD'
  | 'SAVE_WORD'
  | 'GET_WORDS'
  | 'AUTH_STATE_CHANGED'
  | 'REVIEW_DUE'

export interface Message {
  type: MessageType
  payload?: unknown
}

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'lookup-word',
    title: 'Look up "%s"',
    contexts: ['selection'],
  })
  console.log('[Vocabulary] Extension installed')
})

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'lookup-word' && info.selectionText && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'LOOKUP_WORD',
      payload: { word: info.selectionText.trim() },
    })
  }
})

// Message handler
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log('[Background] Received:', message.type)

  switch (message.type) {
    case 'LOOKUP_WORD':
      // Will implement in Phase 04
      sendResponse({ success: true })
      break
    case 'SAVE_WORD':
      // Will implement in Phase 05
      sendResponse({ success: true })
      break
    default:
      sendResponse({ error: 'Unknown message type' })
  }

  return true // Keep message channel open for async
})

// Alarm for spaced repetition reminders
chrome.alarms.create('review-reminder', { periodInMinutes: 60 })

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'review-reminder') {
    // Will implement in Phase 06
    console.log('[Background] Review reminder triggered')
  }
})

export {}
```

### Step 3: Content Script (30min)

**File:** `src/content/content-script.ts`
```typescript
import type { Message } from '../background/service-worker'

// Listen for messages from background
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log('[Content] Received:', message.type)

  switch (message.type) {
    case 'LOOKUP_WORD':
      handleWordLookup(message.payload as { word: string })
      sendResponse({ success: true })
      break
    default:
      sendResponse({ error: 'Unknown message type' })
  }

  return true
})

function handleWordLookup(payload: { word: string }) {
  const { word } = payload
  console.log('[Content] Looking up word:', word)

  // Will implement tooltip/popup in Phase 04
  // For now, just log
}

// Selection change handler (optional: show floating button)
document.addEventListener('mouseup', () => {
  const selection = window.getSelection()?.toString().trim()
  if (selection && selection.length > 0 && selection.length < 100) {
    console.log('[Content] Selection:', selection)
    // Will implement floating button in Phase 04
  }
})

export {}
```

### Step 4: Popup UI (45min)

**File:** `src/popup/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vocabulary Extension</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

**File:** `src/popup/main.tsx`
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**File:** `src/popup/App.tsx`
```typescript
import { useState } from 'react'

type Tab = 'lookup' | 'words' | 'review'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('lookup')

  return (
    <div className="w-[400px] min-h-[500px] bg-white">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-lg font-bold">Vocabulary Extension</h1>
      </header>

      {/* Tab Navigation */}
      <nav className="flex border-b">
        {(['lookup', 'words', 'review'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 text-sm font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main className="p-4">
        {activeTab === 'lookup' && <LookupTab />}
        {activeTab === 'words' && <WordsTab />}
        {activeTab === 'review' && <ReviewTab />}
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-2 border-t text-center text-xs text-gray-400">
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="hover:text-blue-600"
        >
          Settings
        </button>
      </footer>
    </div>
  )
}

function LookupTab() {
  return (
    <div className="space-y-4">
      <p className="text-gray-600 text-sm">
        Select text on any webpage and right-click to look up words.
      </p>
      <input
        type="text"
        placeholder="Or type a word here..."
        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function WordsTab() {
  return (
    <div className="text-gray-600 text-sm">
      <p>Your saved words will appear here.</p>
      {/* Will implement word list in Phase 05 */}
    </div>
  )
}

function ReviewTab() {
  return (
    <div className="text-gray-600 text-sm">
      <p>Flashcard review will appear here.</p>
      {/* Will implement flashcards in Phase 06 */}
    </div>
  )
}
```

### Step 5: Options Page (30min)

**File:** `src/options/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vocabulary Extension - Settings</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

**File:** `src/options/main.tsx`
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import Options from './Options'
import '../styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
)
```

**File:** `src/options/Options.tsx`
```typescript
export default function Options() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Vocabulary Extension Settings</h1>

      <section className="space-y-6">
        {/* Account Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <p className="text-gray-600 text-sm">Sign in to sync your vocabulary.</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Sign in with Google
          </button>
        </div>

        {/* Language Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Language</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Native Language
              </label>
              <select className="w-full px-3 py-2 border rounded">
                <option value="vi">Vietnamese</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Learning Language
              </label>
              <select className="w-full px-3 py-2 border rounded">
                <option value="en">English</option>
                <option value="vi">Vietnamese</option>
              </select>
            </div>
          </div>
        </div>

        {/* Review Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Review</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Review Goal
              </label>
              <input
                type="number"
                defaultValue={20}
                min={5}
                max={100}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="notifications" className="mr-2" />
              <label htmlFor="notifications" className="text-sm text-gray-700">
                Enable review reminders
              </label>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
```

### Step 6: Create Placeholder Icons (15min)

**Files:** `public/icons/icon16.png`, `icon48.png`, `icon128.png`

Create simple placeholder icons (blue square with "V" letter) or use a temporary icon. Can be replaced with proper design later.

### Step 7: Types Setup (15min)

**File:** `src/types/index.ts`
```typescript
// Word/Vocabulary types
export interface Word {
  id: string
  term: string
  definition: string
  translation?: string
  example?: string
  phonetic?: string
  audio?: string
  createdAt: number
  updatedAt: number
}

// SM-2 Spaced Repetition types
export interface ReviewData {
  wordId: string
  easeFactor: number      // >= 1.3
  interval: number        // days
  repetitions: number     // consecutive correct
  nextReview: number      // timestamp
  lastReview?: number     // timestamp
}

// User settings
export interface UserSettings {
  nativeLanguage: 'en' | 'vi'
  learningLanguage: 'en' | 'vi'
  dailyGoal: number
  notificationsEnabled: boolean
}

// Message types for extension communication
export type MessageType =
  | 'LOOKUP_WORD'
  | 'SAVE_WORD'
  | 'DELETE_WORD'
  | 'GET_WORDS'
  | 'UPDATE_REVIEW'
  | 'AUTH_STATE_CHANGED'

export interface ExtensionMessage<T = unknown> {
  type: MessageType
  payload?: T
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
```

## Success Criteria

- [ ] `npm run dev` opens Chrome extension in dev mode
- [ ] Extension loads in `chrome://extensions` without errors
- [ ] Popup opens when clicking extension icon
- [ ] Options page opens from popup footer link
- [ ] Context menu appears on text selection
- [ ] Console logs message routing between scripts

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| CSP blocks script injection | High | Use manifest CSP config properly |
| HMR not working in content script | Medium | May need manual reload during dev |
| Icon files missing | Low | Create placeholder icons |

## Output Files

```
src/
├── manifest.ts                    # MV3 manifest configuration
├── background/service-worker.ts   # Message routing, context menu
├── content/content-script.ts      # DOM interaction, selection
├── popup/
│   ├── index.html
│   ├── main.tsx
│   └── App.tsx
├── options/
│   ├── index.html
│   ├── main.tsx
│   └── Options.tsx
└── types/index.ts

public/
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```
