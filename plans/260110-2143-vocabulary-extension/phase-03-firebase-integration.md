---
phase: 03
title: "Firebase Integration"
status: pending
priority: P1
effort: 4h
dependencies: [phase-01, phase-02]
---

# Phase 03: Firebase Integration

## Context

Integrate Firebase Auth (Google Sign-in) and Firestore for user data. Must use `firebase/auth/web-extension` for MV3 compatibility. Auth handled in background worker, Firestore accessible from popup.

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-10 |
| Priority | P1 (Critical Path) |
| Status | pending |
| Effort | 4h |
| Dependencies | Phase 01, 02 completed |

## Requirements

1. Firebase project setup (console.firebase.google.com)
2. Google OAuth configured for Chrome extension
3. Firebase Auth with `signInWithCredential` (MV3 compatible)
4. Firestore database with security rules
5. Auth state persistence across extension contexts
6. Zustand store with Firebase sync

## Implementation Steps

### Step 1: Firebase Project Setup (30min) - Manual

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project: "vocabulary-extension"
3. Enable Authentication > Sign-in method > Google
4. Create Firestore database (production mode)
5. Get web app config

**Note:** Store config in environment variables, not committed to repo.

### Step 2: Configure Chrome Identity (30min) - Manual

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select Firebase project
3. APIs & Services > Credentials
4. Create OAuth 2.0 Client ID for Chrome Extension
5. Add extension ID (from `chrome://extensions`)
6. Download client ID

### Step 3: Install Firebase (10min)

```bash
npm install firebase@^10.14.0
```

### Step 4: Firebase Configuration (30min)

**File:** `src/shared/firebase.ts`
```typescript
import { initializeApp, FirebaseApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  signOut,
  User,
  Auth,
} from 'firebase/auth/web-extension'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  Firestore,
  Timestamp,
} from 'firebase/firestore'

// Firebase config - loaded from environment or chrome.storage
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

export function initializeFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (!app) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
  }
  return { app, auth: auth!, db: db! }
}

export function getFirebaseAuth(): Auth {
  if (!auth) initializeFirebase()
  return auth!
}

export function getFirebaseDb(): Firestore {
  if (!db) initializeFirebase()
  return db!
}

// Re-export for convenience
export {
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  signOut,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
}
export type { User, Firestore }
```

### Step 5: Auth Service (45min)

**File:** `src/shared/auth.ts`
```typescript
import {
  getFirebaseAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from './firebase'

const OAUTH_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

// Chrome Identity API for OAuth
export async function signInWithGoogle(): Promise<User> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken(
      { interactive: true },
      async (token) => {
        if (chrome.runtime.lastError || !token) {
          reject(new Error(chrome.runtime.lastError?.message || 'No token'))
          return
        }

        try {
          const credential = GoogleAuthProvider.credential(null, token)
          const auth = getFirebaseAuth()
          const result = await signInWithCredential(auth, credential)
          resolve(result.user)
        } catch (error) {
          // If token is invalid, remove and retry once
          chrome.identity.removeCachedAuthToken({ token }, () => {
            reject(error)
          })
        }
      }
    )
  })
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth()
  await firebaseSignOut(auth)

  // Also revoke Chrome identity token
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        chrome.identity.removeCachedAuthToken({ token }, resolve)
      } else {
        resolve()
      }
    })
  })
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth()
  return onAuthStateChanged(auth, callback)
}

export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth()
  return auth.currentUser
}
```

### Step 6: Zustand Store with Firebase Sync (45min)

**File:** `src/shared/store.ts`
```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Word, ReviewData, UserSettings } from '../types'
import { User } from './firebase'

interface VocabStore {
  // Auth state
  user: User | null
  authLoading: boolean
  setUser: (user: User | null) => void
  setAuthLoading: (loading: boolean) => void

  // Words state
  words: Word[]
  setWords: (words: Word[]) => void
  addWord: (word: Word) => void
  updateWord: (id: string, updates: Partial<Word>) => void
  deleteWord: (id: string) => void

  // Review state
  reviews: ReviewData[]
  setReviews: (reviews: ReviewData[]) => void
  updateReview: (wordId: string, review: ReviewData) => void

  // Settings
  settings: UserSettings
  updateSettings: (settings: Partial<UserSettings>) => void

  // Sync state
  lastSynced: number | null
  setLastSynced: (timestamp: number) => void
}

// Chrome storage adapter for Zustand persist
const chromeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const result = await chrome.storage.local.get(name)
    return result[name] ?? null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await chrome.storage.local.set({ [name]: value })
  },
  removeItem: async (name: string): Promise<void> => {
    await chrome.storage.local.remove(name)
  },
}

const defaultSettings: UserSettings = {
  nativeLanguage: 'vi',
  learningLanguage: 'en',
  dailyGoal: 20,
  notificationsEnabled: true,
}

export const useVocabStore = create<VocabStore>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      authLoading: true,
      setUser: (user) => set({ user }),
      setAuthLoading: (authLoading) => set({ authLoading }),

      // Words
      words: [],
      setWords: (words) => set({ words }),
      addWord: (word) => set((state) => ({ words: [...state.words, word] })),
      updateWord: (id, updates) =>
        set((state) => ({
          words: state.words.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),
      deleteWord: (id) =>
        set((state) => ({
          words: state.words.filter((w) => w.id !== id),
        })),

      // Reviews
      reviews: [],
      setReviews: (reviews) => set({ reviews }),
      updateReview: (wordId, review) =>
        set((state) => ({
          reviews: state.reviews.some((r) => r.wordId === wordId)
            ? state.reviews.map((r) => (r.wordId === wordId ? review : r))
            : [...state.reviews, review],
        })),

      // Settings
      settings: defaultSettings,
      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),

      // Sync
      lastSynced: null,
      setLastSynced: (timestamp) => set({ lastSynced: timestamp }),
    }),
    {
      name: 'vocab-storage',
      storage: createJSONStorage(() => chromeStorage),
      partialize: (state) => ({
        words: state.words,
        reviews: state.reviews,
        settings: state.settings,
        lastSynced: state.lastSynced,
      }),
    }
  )
)
```

### Step 7: Firestore Service (45min)

**File:** `src/shared/firestore.ts`
```typescript
import {
  getFirebaseDb,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from './firebase'
import type { Word, ReviewData, UserSettings } from '../types'

const COLLECTIONS = {
  USERS: 'users',
  WORDS: 'words',
  REVIEWS: 'reviews',
  SETTINGS: 'settings',
}

// Words
export async function saveWord(userId: string, word: Word): Promise<void> {
  const db = getFirebaseDb()
  const wordRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.WORDS, word.id)
  await setDoc(wordRef, {
    ...word,
    createdAt: Timestamp.fromMillis(word.createdAt),
    updatedAt: Timestamp.fromMillis(word.updatedAt),
  })
}

export async function getWords(userId: string): Promise<Word[]> {
  const db = getFirebaseDb()
  const wordsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.WORDS)
  const q = query(wordsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toMillis() || Date.now(),
      updatedAt: data.updatedAt?.toMillis() || Date.now(),
    } as Word
  })
}

export async function deleteWord(userId: string, wordId: string): Promise<void> {
  const db = getFirebaseDb()
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.WORDS, wordId))
}

// Reviews
export async function saveReview(userId: string, review: ReviewData): Promise<void> {
  const db = getFirebaseDb()
  const reviewRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.REVIEWS, review.wordId)
  await setDoc(reviewRef, review)
}

export async function getReviews(userId: string): Promise<ReviewData[]> {
  const db = getFirebaseDb()
  const reviewsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.REVIEWS)
  const snapshot = await getDocs(reviewsRef)

  return snapshot.docs.map((doc) => doc.data() as ReviewData)
}

export async function getDueReviews(userId: string): Promise<ReviewData[]> {
  const db = getFirebaseDb()
  const reviewsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.REVIEWS)
  const q = query(reviewsRef, where('nextReview', '<=', Date.now()))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => doc.data() as ReviewData)
}

// Settings
export async function saveSettings(userId: string, settings: UserSettings): Promise<void> {
  const db = getFirebaseDb()
  await setDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.SETTINGS, 'preferences'), settings)
}

export async function getSettings(userId: string): Promise<UserSettings | null> {
  const db = getFirebaseDb()
  const settingsDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.SETTINGS, 'preferences'))
  return settingsDoc.exists() ? (settingsDoc.data() as UserSettings) : null
}

// Sync helper
export async function syncFromFirestore(userId: string): Promise<{
  words: Word[]
  reviews: ReviewData[]
  settings: UserSettings | null
}> {
  const [words, reviews, settings] = await Promise.all([
    getWords(userId),
    getReviews(userId),
    getSettings(userId),
  ])
  return { words, reviews, settings }
}
```

### Step 8: Environment Variables (15min)

**File:** `.env.example`
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_GOOGLE_CLIENT_ID=your-oauth-client-id.apps.googleusercontent.com
```

**Update:** `.gitignore`
```
.env
.env.local
```

### Step 9: Firestore Security Rules (15min)

**File (for Firebase Console):** `firestore.rules`
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 10: Update Background Worker (15min)

**Update:** `src/background/service-worker.ts`
```typescript
import { initializeFirebase } from '../shared/firebase'
import { subscribeToAuthState, signInWithGoogle, signOut } from '../shared/auth'
import { syncFromFirestore } from '../shared/firestore'

// Initialize Firebase on install
chrome.runtime.onInstalled.addListener(() => {
  initializeFirebase()
  // ... existing context menu code
})

// Listen for auth state changes
subscribeToAuthState(async (user) => {
  // Broadcast to all contexts
  chrome.runtime.sendMessage({
    type: 'AUTH_STATE_CHANGED',
    payload: { user: user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null },
  })

  // Sync data if user signed in
  if (user) {
    try {
      const data = await syncFromFirestore(user.uid)
      chrome.runtime.sendMessage({ type: 'SYNC_COMPLETE', payload: data })
    } catch (error) {
      console.error('[Background] Sync failed:', error)
    }
  }
})

// Handle auth messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SIGN_IN') {
    signInWithGoogle()
      .then((user) => sendResponse({ success: true, user }))
      .catch((error) => sendResponse({ success: false, error: error.message }))
    return true
  }

  if (message.type === 'SIGN_OUT') {
    signOut()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }))
    return true
  }

  // ... existing handlers
})
```

## Success Criteria

- [ ] Google Sign-in works from popup
- [ ] Auth state persists after extension restart
- [ ] Words save to Firestore on user action
- [ ] Words sync from Firestore on sign-in
- [ ] Settings persist in Firestore
- [ ] Security rules block unauthorized access

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| OAuth setup complexity | High | Follow Google's Chrome extension OAuth guide exactly |
| Token refresh issues | High | Implement token refresh logic with retry |
| Firestore offline sync conflicts | Medium | Use last-write-wins with timestamps |
| CSP violations | High | Use firebase/auth/web-extension import |

## Output Files

```
src/shared/
├── firebase.ts      # Firebase init and re-exports
├── auth.ts          # Google OAuth via chrome.identity
├── store.ts         # Zustand with chrome.storage persistence
└── firestore.ts     # Firestore CRUD operations

.env.example         # Environment template
firestore.rules      # Security rules (deploy to Firebase)
```
