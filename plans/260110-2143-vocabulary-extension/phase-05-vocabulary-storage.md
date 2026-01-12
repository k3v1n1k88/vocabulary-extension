---
phase: 05
title: "Vocabulary Storage"
status: pending
priority: P1
effort: 4h
dependencies: [phase-03, phase-04]
---

# Phase 05: Vocabulary Storage

## Context

Implement full vocabulary management: save words from lookup, list saved words, edit/delete, search/filter. Firestore sync for logged-in users, chrome.storage fallback for anonymous.

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-10 |
| Priority | P1 (Core Feature) |
| Status | pending |
| Effort | 4h |
| Dependencies | Phase 03, 04 completed |

## Requirements

1. Save word from lookup result (done in Phase 04)
2. List all saved words in popup
3. Search and filter words
4. Edit word details (definition, notes)
5. Delete words
6. Firestore sync on changes
7. Offline-first with chrome.storage

## Implementation Steps

### Step 1: Word List Component (45min)

**File:** `src/popup/components/WordList.tsx`
```typescript
import { useState, useMemo } from 'react'
import type { Word } from '../../types'
import { useVocabStore } from '../../shared/store'
import { deleteWord as deleteFromFirestore } from '../../shared/firestore'
import { WordCard } from './WordCard'

interface Props {
  onSelectWord?: (word: Word) => void
}

export function WordList({ onSelectWord }: Props) {
  const { words, user, deleteWord } = useVocabStore()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent')

  const filteredWords = useMemo(() => {
    let result = [...words]

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (w) =>
          w.term.toLowerCase().includes(q) ||
          w.definition?.toLowerCase().includes(q) ||
          w.translation?.toLowerCase().includes(q)
      )
    }

    // Sort
    if (sortBy === 'alpha') {
      result.sort((a, b) => a.term.localeCompare(b.term))
    } else {
      result.sort((a, b) => b.createdAt - a.createdAt)
    }

    return result
  }, [words, search, sortBy])

  const handleDelete = async (wordId: string) => {
    if (!confirm('Delete this word?')) return

    deleteWord(wordId)
    if (user) {
      await deleteFromFirestore(user.uid, wordId)
    }
  }

  if (words.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No words saved yet.</p>
        <p className="text-gray-400 text-sm mt-2">
          Look up words and click Save to add them here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Sort */}
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words..."
          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'recent' | 'alpha')}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="recent">Recent</option>
          <option value="alpha">A-Z</option>
        </select>
      </div>

      {/* Word count */}
      <p className="text-xs text-gray-400">
        {filteredWords.length} of {words.length} words
      </p>

      {/* Word list */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto">
        {filteredWords.map((word) => (
          <WordCard
            key={word.id}
            word={word}
            onClick={() => onSelectWord?.(word)}
            onDelete={() => handleDelete(word.id)}
          />
        ))}
      </div>

      {filteredWords.length === 0 && search && (
        <p className="text-center text-gray-400 text-sm">No matches found</p>
      )}
    </div>
  )
}
```

### Step 2: Word Card Component (30min)

**File:** `src/popup/components/WordCard.tsx`
```typescript
import type { Word } from '../../types'

interface Props {
  word: Word
  onClick?: () => void
  onDelete?: () => void
  compact?: boolean
}

export function WordCard({ word, onClick, onDelete, compact = false }: Props) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
      >
        <span className="font-medium text-sm">{word.term}</span>
        {word.translation && (
          <span className="text-gray-500 text-sm">{word.translation}</span>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className="p-3 border rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 truncate">{word.term}</h4>
            {word.phonetic && (
              <span className="text-gray-400 text-xs">{word.phonetic}</span>
            )}
          </div>

          {word.translation && (
            <p className="text-blue-600 text-sm mt-1">{word.translation}</p>
          )}

          {word.definition && (
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{word.definition}</p>
          )}
        </div>

        {onDelete && (
          <button
            onClick={handleDelete}
            className="ml-2 p-1 text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
        <span>{new Date(word.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  )
}
```

### Step 3: Word Detail/Edit Component (45min)

**File:** `src/popup/components/WordDetail.tsx`
```typescript
import { useState } from 'react'
import type { Word } from '../../types'
import { useVocabStore } from '../../shared/store'
import { saveWord as saveToFirestore } from '../../shared/firestore'

interface Props {
  word: Word
  onClose: () => void
}

export function WordDetail({ word, onClose }: Props) {
  const { user, updateWord } = useVocabStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    definition: word.definition || '',
    translation: word.translation || '',
    example: word.example || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated: Word = {
        ...word,
        ...form,
        updatedAt: Date.now(),
      }

      updateWord(word.id, updated)

      if (user) {
        await saveToFirestore(user.uid, updated)
      }

      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const playAudio = () => {
    if (word.audio) {
      new Audio(word.audio).play()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-bold text-lg">{word.term}</h2>
        <button
          onClick={() => setEditing(!editing)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Phonetic + Audio */}
        {(word.phonetic || word.audio) && (
          <div className="flex items-center gap-2">
            {word.phonetic && <span className="text-gray-500">{word.phonetic}</span>}
            {word.audio && (
              <button onClick={playAudio} className="text-blue-600 hover:text-blue-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Translation */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
            Translation
          </label>
          {editing ? (
            <input
              type="text"
              value={form.translation}
              onChange={(e) => setForm({ ...form, translation: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          ) : (
            <p className="text-blue-600">{word.translation || '-'}</p>
          )}
        </div>

        {/* Definition */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
            Definition
          </label>
          {editing ? (
            <textarea
              value={form.definition}
              onChange={(e) => setForm({ ...form, definition: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded resize-none"
            />
          ) : (
            <p className="text-gray-700">{word.definition || '-'}</p>
          )}
        </div>

        {/* Example */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
            Example
          </label>
          {editing ? (
            <textarea
              value={form.example}
              onChange={(e) => setForm({ ...form, example: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded resize-none"
            />
          ) : (
            <p className="text-gray-500 italic">
              {word.example ? `"${word.example}"` : '-'}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t text-xs text-gray-400">
          <p>Added: {new Date(word.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(word.updatedAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Save button */}
      {editing && (
        <div className="p-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  )
}
```

### Step 4: Words Tab Integration (30min)

**File:** `src/popup/components/WordsTab.tsx`
```typescript
import { useState } from 'react'
import type { Word } from '../../types'
import { WordList } from './WordList'
import { WordDetail } from './WordDetail'

export function WordsTab() {
  const [selectedWord, setSelectedWord] = useState<Word | null>(null)

  if (selectedWord) {
    return <WordDetail word={selectedWord} onClose={() => setSelectedWord(null)} />
  }

  return <WordList onSelectWord={setSelectedWord} />
}
```

### Step 5: Sync Service (45min)

**File:** `src/shared/sync.ts`
```typescript
import { useVocabStore } from './store'
import {
  saveWord,
  getWords,
  deleteWord,
  saveReview,
  getReviews,
  saveSettings,
  getSettings,
} from './firestore'
import type { Word, ReviewData, UserSettings } from '../types'

// Sync direction: local -> remote
export async function pushToFirestore(userId: string): Promise<void> {
  const { words, reviews, settings } = useVocabStore.getState()

  await Promise.all([
    ...words.map((word) => saveWord(userId, word)),
    ...reviews.map((review) => saveReview(userId, review)),
    saveSettings(userId, settings),
  ])

  useVocabStore.getState().setLastSynced(Date.now())
}

// Sync direction: remote -> local
export async function pullFromFirestore(userId: string): Promise<void> {
  const [remoteWords, remoteReviews, remoteSettings] = await Promise.all([
    getWords(userId),
    getReviews(userId),
    getSettings(userId),
  ])

  const { setWords, setReviews, updateSettings, setLastSynced } = useVocabStore.getState()

  // Merge strategy: remote wins for now (simple)
  // TODO: Implement proper conflict resolution with timestamps
  setWords(remoteWords)
  setReviews(remoteReviews)
  if (remoteSettings) {
    updateSettings(remoteSettings)
  }

  setLastSynced(Date.now())
}

// Two-way merge sync (more complex)
export async function syncWithFirestore(userId: string): Promise<void> {
  const localState = useVocabStore.getState()
  const lastSynced = localState.lastSynced || 0

  // Get remote data
  const [remoteWords, remoteReviews] = await Promise.all([
    getWords(userId),
    getReviews(userId),
  ])

  // Merge words
  const mergedWords = mergeCollections(
    localState.words,
    remoteWords,
    lastSynced
  )

  // Merge reviews
  const mergedReviews = mergeCollections(
    localState.reviews,
    remoteReviews,
    lastSynced,
    'wordId'
  )

  // Update local state
  localState.setWords(mergedWords.local)
  localState.setReviews(mergedReviews.local as ReviewData[])

  // Push changes to remote
  await Promise.all([
    ...mergedWords.toUpload.map((w) => saveWord(userId, w)),
    ...mergedReviews.toUpload.map((r) => saveReview(userId, r as ReviewData)),
  ])

  localState.setLastSynced(Date.now())
}

interface MergeResult<T> {
  local: T[]
  toUpload: T[]
}

function mergeCollections<T extends { id?: string; wordId?: string; updatedAt?: number }>(
  local: T[],
  remote: T[],
  lastSynced: number,
  idField: 'id' | 'wordId' = 'id'
): MergeResult<T> {
  const merged = new Map<string, T>()
  const toUpload: T[] = []

  // Add all remote items
  remote.forEach((item) => {
    const id = item[idField] as string
    merged.set(id, item)
  })

  // Merge local items
  local.forEach((localItem) => {
    const id = localItem[idField] as string
    const remoteItem = merged.get(id)

    if (!remoteItem) {
      // Local-only: upload if created after last sync
      merged.set(id, localItem)
      if ((localItem.updatedAt || 0) > lastSynced) {
        toUpload.push(localItem)
      }
    } else {
      // Both exist: keep newer
      const localTime = localItem.updatedAt || 0
      const remoteTime = (remoteItem as { updatedAt?: number }).updatedAt || 0

      if (localTime > remoteTime) {
        merged.set(id, localItem)
        toUpload.push(localItem)
      }
    }
  })

  return {
    local: Array.from(merged.values()),
    toUpload,
  }
}
```

### Step 6: Background Sync Handler (30min)

**Update:** `src/background/service-worker.ts`
```typescript
import { syncWithFirestore, pullFromFirestore } from '../shared/sync'
import { saveWord as saveToFirestore, deleteWord as deleteFromFirestore } from '../shared/firestore'

// Add to message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SYNC_DATA':
      handleSync(message.payload?.userId)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }))
      return true

    case 'SAVE_WORD':
      handleSaveWord(message.payload)
        .then((result) => sendResponse({ success: true, data: result }))
        .catch((err) => sendResponse({ success: false, error: err.message }))
      return true

    case 'DELETE_WORD':
      handleDeleteWord(message.payload)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }))
      return true
  }
})

async function handleSync(userId?: string) {
  if (!userId) return
  await syncWithFirestore(userId)
}

async function handleSaveWord(payload: { userId?: string; word: Word }) {
  const { userId, word } = payload
  // Save to local store is handled by popup
  // This handles Firestore sync
  if (userId) {
    await saveToFirestore(userId, word)
  }
  return word
}

async function handleDeleteWord(payload: { userId?: string; wordId: string }) {
  const { userId, wordId } = payload
  if (userId) {
    await deleteFromFirestore(userId, wordId)
  }
}

// Periodic sync (every 5 minutes when active)
chrome.alarms.create('sync-data', { periodInMinutes: 5 })

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sync-data') {
    // Get current user from storage
    const result = await chrome.storage.local.get('vocab-storage')
    const state = result['vocab-storage'] ? JSON.parse(result['vocab-storage']) : null
    const userId = state?.state?.user?.uid

    if (userId) {
      await syncWithFirestore(userId)
    }
  }
})
```

### Step 7: Export/Import Feature (30min)

**File:** `src/popup/components/ExportImport.tsx`
```typescript
import { useRef } from 'react'
import { useVocabStore } from '../../shared/store'
import type { Word } from '../../types'

export function ExportImport() {
  const { words, setWords, addWord } = useVocabStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      words,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vocabulary-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.words && Array.isArray(data.words)) {
          // Merge with existing words (avoid duplicates by term)
          const existingTerms = new Set(words.map((w) => w.term.toLowerCase()))
          const newWords = data.words.filter(
            (w: Word) => !existingTerms.has(w.term.toLowerCase())
          )
          newWords.forEach((w: Word) => addWord(w))
          alert(`Imported ${newWords.length} new words`)
        }
      } catch {
        alert('Invalid file format')
      }
    }
    reader.readAsText(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
      >
        Export
      </button>
      <label className="px-3 py-1 text-sm border rounded hover:bg-gray-50 cursor-pointer">
        Import
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </label>
    </div>
  )
}
```

## Success Criteria

- [ ] Word list displays all saved words
- [ ] Search filters words by term/definition/translation
- [ ] Sort by recent/alphabetical works
- [ ] Click word opens detail view
- [ ] Edit word updates definition/translation
- [ ] Delete word removes from list and Firestore
- [ ] Changes sync to Firestore for logged-in users
- [ ] Export/import JSON works correctly

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sync conflicts | Medium | Last-write-wins with updatedAt timestamp |
| Large word lists slow UI | Medium | Virtualize list if >500 words |
| Firestore quota exceeded | Low | Batch writes, optimize reads |
| Data loss on merge | High | Always backup before merge, show conflict UI |

## Output Files

```
src/popup/components/
├── WordList.tsx       # Main word list with search/sort
├── WordCard.tsx       # Individual word card
├── WordDetail.tsx     # Detail view with edit
├── WordsTab.tsx       # Tab container
└── ExportImport.tsx   # Export/import feature

src/shared/
└── sync.ts            # Firestore sync logic
```
