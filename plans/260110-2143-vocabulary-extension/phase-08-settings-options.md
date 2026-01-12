---
phase: 08
title: "Settings & Options Page"
status: pending
priority: P2
effort: 3h
dependencies: [phase-03, phase-07]
---

# Phase 08: Settings & Options Page

## Context

Complete the options page with user settings, account management, and data controls. Persist settings to Firestore for logged-in users.

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-10 |
| Priority | P2 |
| Status | pending |
| Effort | 3h |
| Dependencies | Phase 03, 07 completed |

## Requirements

1. User account display (avatar, email)
2. Sign in/out functionality
3. Language settings (native/learning)
4. Review settings (daily goal, notifications)
5. Data management (export, import, delete all)
6. About/version info

## Implementation Steps

### Step 1: Auth Context Hook (30min)

**File:** `src/popup/hooks/useAuth.ts`
```typescript
import { useEffect } from 'react'
import { useVocabStore } from '../../shared/store'
import { subscribeToAuthState, signInWithGoogle, signOut } from '../../shared/auth'
import { syncFromFirestore } from '../../shared/firestore'

export function useAuth() {
  const { user, authLoading, setUser, setAuthLoading, setWords, setReviews, updateSettings } = useVocabStore()

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      setUser(firebaseUser)
      setAuthLoading(false)

      // Sync data on sign in
      if (firebaseUser) {
        try {
          const data = await syncFromFirestore(firebaseUser.uid)
          setWords(data.words)
          setReviews(data.reviews)
          if (data.settings) {
            updateSettings(data.settings)
          }
        } catch (err) {
          console.error('Sync failed:', err)
        }
      }
    })

    return unsubscribe
  }, [setUser, setAuthLoading, setWords, setReviews, updateSettings])

  const handleSignIn = async () => {
    setAuthLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('Sign in failed:', err)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    setAuthLoading(true)
    try {
      await signOut()
      // Clear synced data (keep local for now)
    } catch (err) {
      console.error('Sign out failed:', err)
    } finally {
      setAuthLoading(false)
    }
  }

  return {
    user,
    loading: authLoading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    isAuthenticated: !!user,
  }
}
```

### Step 2: Complete Options Page (1h)

**File:** `src/options/Options.tsx`
```typescript
import { useState } from 'react'
import { useVocabStore } from '../shared/store'
import { useAuth } from '../popup/hooks/useAuth'
import { saveSettings } from '../shared/firestore'
import { ExportImport } from '../popup/components/ExportImport'

export default function Options() {
  const { user, loading, signIn, signOut, isAuthenticated } = useAuth()
  const { settings, updateSettings, words, setWords, setReviews } = useVocabStore()
  const [saving, setSaving] = useState(false)

  const handleSettingChange = async <K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    updateSettings({ [key]: value })

    // Sync to Firestore
    if (user) {
      setSaving(true)
      try {
        await saveSettings(user.uid, { ...settings, [key]: value })
      } finally {
        setSaving(false)
      }
    }
  }

  const handleDeleteAllData = async () => {
    if (!confirm('Delete all vocabulary data? This cannot be undone.')) return
    if (!confirm('Are you REALLY sure? All words will be permanently deleted.')) return

    setWords([])
    setReviews([])

    // TODO: Delete from Firestore if logged in
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">Vocabulary Extension Settings</h1>

        {/* Account Section */}
        <section className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Account</h2>

            {loading ? (
              <div className="flex items-center gap-3 text-gray-500">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                Loading...
              </div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 text-sm mb-4">
                  Sign in to sync your vocabulary across devices.
                </p>
                <button
                  onClick={signIn}
                  className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </button>
              </div>
            )}
          </div>

          {/* Sync status */}
          {isAuthenticated && (
            <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500 flex items-center justify-between">
              <span>
                {saving ? 'Saving...' : `${words.length} words synced`}
              </span>
              <span className="flex items-center gap-1 text-green-600">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Synced
              </span>
            </div>
          )}
        </section>

        {/* Language Settings */}
        <section className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Language</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Native Language
              </label>
              <select
                value={settings.nativeLanguage}
                onChange={(e) => handleSettingChange('nativeLanguage', e.target.value as 'en' | 'vi')}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              >
                <option value="vi">Vietnamese (Tieng Viet)</option>
                <option value="en">English</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Translations will be shown in this language
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Learning Language
              </label>
              <select
                value={settings.learningLanguage}
                onChange={(e) => handleSettingChange('learningLanguage', e.target.value as 'en' | 'vi')}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              >
                <option value="en">English</option>
                <option value="vi">Vietnamese (Tieng Viet)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Review Settings */}
        <section className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Review</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Review Goal
              </label>
              <input
                type="number"
                value={settings.dailyGoal}
                onChange={(e) => handleSettingChange('dailyGoal', parseInt(e.target.value) || 10)}
                min={5}
                max={100}
                step={5}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum cards to review per session (5-100)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Review Reminders</p>
                <p className="text-xs text-gray-500">
                  Get notified when reviews are due
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Data</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Export / Import</p>
                <p className="text-xs text-gray-500">
                  Backup or restore your vocabulary
                </p>
              </div>
              <ExportImport />
            </div>

            <hr />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600">Delete All Data</p>
                <p className="text-xs text-gray-500">
                  Permanently delete all words and progress
                </p>
              </div>
              <button
                onClick={handleDeleteAllData}
                className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">About</h2>

          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Vocabulary Extension</strong> v0.1.0</p>
            <p>Learn vocabulary with spaced repetition</p>
            <p className="pt-2">
              <a
                href="https://github.com/your-repo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View on GitHub
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
```

### Step 3: Popup Header with User (30min)

**File:** `src/popup/components/Header.tsx`
```typescript
import { useAuth } from '../hooks/useAuth'

export function Header() {
  const { user, isAuthenticated, signIn, signOut, loading } = useAuth()

  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Vocabulary</h1>

        {loading ? (
          <div className="w-8 h-8 animate-pulse bg-blue-500 rounded-full" />
        ) : isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="w-8 h-8 rounded-full border-2 border-white/20"
                title={user.displayName || user.email || ''}
              />
            )}
          </div>
        ) : (
          <button
            onClick={signIn}
            className="text-sm px-3 py-1 bg-white/20 rounded hover:bg-white/30"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  )
}
```

### Step 4: Update Popup App (15min)

**Update:** `src/popup/App.tsx`
```typescript
import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { LookupTab } from './components/LookupTab'
import { WordsTab } from './components/WordsTab'
import { ReviewTab } from './components/ReviewTab'
import { useAuth } from './hooks/useAuth'
import { initializeFirebase } from '../shared/firebase'

type Tab = 'lookup' | 'words' | 'review'

// Initialize Firebase on load
initializeFirebase()

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('lookup')
  const { isAuthenticated } = useAuth()

  // Badge for due reviews could be added here

  return (
    <div className="w-[400px] h-[500px] flex flex-col bg-white">
      <Header />

      {/* Tab Navigation */}
      <nav className="flex border-b">
        {(['lookup', 'words', 'review'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 text-sm font-medium capitalize transition-colors ${
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
      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === 'lookup' && <LookupTab />}
        {activeTab === 'words' && <WordsTab />}
        {activeTab === 'review' && <ReviewTab />}
      </main>

      {/* Footer */}
      <footer className="p-2 border-t text-center text-xs text-gray-400">
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
```

### Step 5: Initialize Auth in Options (15min)

**Update:** `src/options/main.tsx`
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import Options from './Options'
import '../styles/globals.css'
import { initializeFirebase } from '../shared/firebase'

// Initialize Firebase
initializeFirebase()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
)
```

## Success Criteria

- [ ] User can sign in/out with Google
- [ ] User avatar and email display correctly
- [ ] Language settings persist
- [ ] Daily goal setting works
- [ ] Notification toggle works
- [ ] Export creates valid JSON file
- [ ] Import adds new words
- [ ] Delete all clears data
- [ ] Settings sync to Firestore

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| OAuth popup blocked | Medium | Show manual instructions |
| Settings not syncing | Low | Show sync status indicator |
| Delete all too easy | Medium | Double confirmation required |

## Output Files

```
src/
├── popup/
│   ├── hooks/useAuth.ts       # Auth state hook
│   └── components/Header.tsx  # Updated with user
├── options/
│   └── Options.tsx            # Complete options page
└── popup/App.tsx              # Updated with header
```
