---
phase: 06
title: "Flashcard System"
status: pending
priority: P1
effort: 8h
dependencies: [phase-03, phase-05]
---

# Phase 06: Flashcard System

## Context

Implement SM-2 spaced repetition algorithm for vocabulary review. Flashcard UI shows word/translation, user rates difficulty, algorithm schedules next review. Notifications remind user of due reviews.

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-10 |
| Priority | P1 (Core Feature) |
| Status | pending |
| Effort | 8h |
| Dependencies | Phase 03, 05 completed |

## Requirements

1. SM-2 algorithm implementation
2. Flashcard UI (show front/back, flip animation)
3. Rating buttons (Again, Hard, Good, Easy)
4. Review queue management
5. Progress tracking (due count, streak)
6. Review statistics
7. Notification reminders
8. **Audio pronunciation** - Play word audio on flashcard (TTS or dictionary audio)

## Implementation Steps

### Step 1: SM-2 Algorithm (1h)

**File:** `src/shared/spaced-repetition.ts`
```typescript
import type { ReviewData } from '../types'

/**
 * SM-2 (SuperMemo 2) Algorithm Implementation
 *
 * Quality ratings:
 * 0 - Complete blackout, wrong response
 * 1 - Wrong response, but correct one remembered after seeing
 * 2 - Wrong response, but correct one easy to recall
 * 3 - Correct response with serious difficulty
 * 4 - Correct response after hesitation
 * 5 - Perfect response
 *
 * Simplified to 4 buttons:
 * Again (0) - Reset
 * Hard (2) - Correct but difficult
 * Good (4) - Correct with some hesitation
 * Easy (5) - Perfect
 */

export type ReviewQuality = 0 | 2 | 4 | 5

export interface SM2Result {
  easeFactor: number
  interval: number
  repetitions: number
  nextReview: number
}

const MIN_EASE_FACTOR = 1.3
const DEFAULT_EASE_FACTOR = 2.5

export function calculateSM2(
  quality: ReviewQuality,
  currentData?: Partial<ReviewData>
): SM2Result {
  const now = Date.now()
  let { easeFactor = DEFAULT_EASE_FACTOR, interval = 0, repetitions = 0 } = currentData || {}

  // Quality < 3 means failure - reset repetitions
  if (quality < 3) {
    repetitions = 0
    interval = 1 // Review again in 1 day
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  }

  // Update ease factor using SM-2 formula
  easeFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  )

  // Calculate next review timestamp
  const nextReview = now + interval * 24 * 60 * 60 * 1000

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview,
  }
}

// Convert button press to quality rating
export function qualityFromButton(button: 'again' | 'hard' | 'good' | 'easy'): ReviewQuality {
  const map: Record<string, ReviewQuality> = {
    again: 0,
    hard: 2,
    good: 4,
    easy: 5,
  }
  return map[button]
}

// Get due reviews from a list
export function getDueReviews(reviews: ReviewData[], words: { id: string }[]): ReviewData[] {
  const now = Date.now()
  const wordIds = new Set(words.map((w) => w.id))

  return reviews.filter(
    (r) => wordIds.has(r.wordId) && r.nextReview <= now
  )
}

// Initialize review data for a new word
export function initializeReview(wordId: string): ReviewData {
  return {
    wordId,
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
    nextReview: Date.now(), // Due immediately for first review
  }
}

// Get words that need initial review (no review data yet)
export function getNewWords(
  words: { id: string }[],
  reviews: ReviewData[]
): string[] {
  const reviewedIds = new Set(reviews.map((r) => r.wordId))
  return words.filter((w) => !reviewedIds.has(w.id)).map((w) => w.id)
}

// Calculate review stats
export interface ReviewStats {
  totalWords: number
  dueToday: number
  newWords: number
  masteredWords: number // interval > 21 days
  streak: number
}

export function calculateStats(
  words: { id: string }[],
  reviews: ReviewData[],
  lastReviewDate?: number
): ReviewStats {
  const now = Date.now()
  const today = new Date().setHours(0, 0, 0, 0)
  const reviewedIds = new Set(reviews.map((r) => r.wordId))

  const dueReviews = reviews.filter(
    (r) => reviewedIds.has(r.wordId) && r.nextReview <= now
  )

  const newWords = words.filter((w) => !reviewedIds.has(w.id))
  const masteredWords = reviews.filter((r) => r.interval > 21)

  // Simple streak calculation (consecutive days)
  let streak = 0
  if (lastReviewDate) {
    const lastDate = new Date(lastReviewDate).setHours(0, 0, 0, 0)
    const yesterday = today - 24 * 60 * 60 * 1000
    if (lastDate >= yesterday) {
      streak = 1 // At least 1 if reviewed today or yesterday
    }
  }

  return {
    totalWords: words.length,
    dueToday: dueReviews.length,
    newWords: newWords.length,
    masteredWords: masteredWords.length,
    streak,
  }
}
```

### Step 2: Review Session Hook (45min)

**File:** `src/popup/hooks/useReviewSession.ts`
```typescript
import { useState, useCallback, useMemo } from 'react'
import { useVocabStore } from '../../shared/store'
import {
  calculateSM2,
  qualityFromButton,
  getDueReviews,
  getNewWords,
  initializeReview,
  type ReviewQuality,
} from '../../shared/spaced-repetition'
import { saveReview } from '../../shared/firestore'
import type { Word, ReviewData } from '../../types'

export interface ReviewCard {
  word: Word
  reviewData: ReviewData
  isNew: boolean
}

export function useReviewSession(dailyLimit = 20) {
  const { words, reviews, user, updateReview, settings } = useVocabStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    wrong: 0,
  })

  // Build review queue
  const reviewQueue = useMemo(() => {
    const queue: ReviewCard[] = []

    // Add due reviews
    const dueReviews = getDueReviews(reviews, words)
    dueReviews.forEach((reviewData) => {
      const word = words.find((w) => w.id === reviewData.wordId)
      if (word) {
        queue.push({ word, reviewData, isNew: false })
      }
    })

    // Add new words (up to limit)
    const newWordIds = getNewWords(words, reviews)
    const newWordLimit = Math.max(0, dailyLimit - queue.length)

    newWordIds.slice(0, newWordLimit).forEach((wordId) => {
      const word = words.find((w) => w.id === wordId)
      if (word) {
        queue.push({
          word,
          reviewData: initializeReview(wordId),
          isNew: true,
        })
      }
    })

    // Shuffle for variety
    return queue.sort(() => Math.random() - 0.5)
  }, [words, reviews, dailyLimit])

  const currentCard = reviewQueue[currentIndex] || null
  const progress = {
    current: currentIndex + 1,
    total: reviewQueue.length,
    percent: reviewQueue.length > 0 ? ((currentIndex + 1) / reviewQueue.length) * 100 : 0,
  }

  const handleReview = useCallback(
    async (button: 'again' | 'hard' | 'good' | 'easy') => {
      if (!currentCard) return

      const quality = qualityFromButton(button)
      const result = calculateSM2(quality, currentCard.reviewData)

      const newReviewData: ReviewData = {
        wordId: currentCard.word.id,
        ...result,
        lastReview: Date.now(),
      }

      // Update local state
      updateReview(currentCard.word.id, newReviewData)

      // Sync to Firestore
      if (user) {
        await saveReview(user.uid, newReviewData)
      }

      // Update session stats
      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        correct: prev.correct + (quality >= 3 ? 1 : 0),
        wrong: prev.wrong + (quality < 3 ? 1 : 0),
      }))

      // Move to next card or complete session
      if (currentIndex < reviewQueue.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else {
        setSessionComplete(true)
      }
    },
    [currentCard, currentIndex, reviewQueue.length, updateReview, user]
  )

  const restartSession = useCallback(() => {
    setCurrentIndex(0)
    setSessionComplete(false)
    setSessionStats({ reviewed: 0, correct: 0, wrong: 0 })
  }, [])

  return {
    currentCard,
    progress,
    sessionComplete,
    sessionStats,
    queueLength: reviewQueue.length,
    handleReview,
    restartSession,
  }
}
```

### Step 3: Flashcard Component (1h)

**File:** `src/popup/components/Flashcard.tsx`
```typescript
import { useState } from 'react'
import type { Word } from '../../types'
import { speak, stopSpeaking } from '../../shared/tts'

interface Props {
  word: Word
  isNew?: boolean
  onReview: (button: 'again' | 'hard' | 'good' | 'easy') => void
}

export function Flashcard({ word, isNew, onReview }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  const handleFlip = () => {
    if (!flipped) setFlipped(true)
  }

  const handleReview = (button: 'again' | 'hard' | 'good' | 'easy') => {
    onReview(button)
    setFlipped(false) // Reset for next card
  }

  // Play audio - prefer dictionary audio, fallback to TTS
  const playAudio = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
      return
    }

    if (word.audio) {
      // Use dictionary audio if available
      new Audio(word.audio).play()
    } else {
      // Fallback to Web Speech API TTS
      setSpeaking(true)
      try {
        await speak(word.term, { lang: 'en-US' })
      } catch (err) {
        console.error('TTS failed:', err)
      } finally {
        setSpeaking(false)
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* New word badge */}
      {isNew && (
        <div className="mb-2">
          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
            New word
          </span>
        </div>
      )}

      {/* Card */}
      <div
        onClick={handleFlip}
        className="flex-1 perspective-1000"
      >
        <div
          className={`
            relative w-full h-full transition-transform duration-500
            transform-style-preserve-3d cursor-pointer
            ${flipped ? 'rotate-y-180' : ''}
          `}
        >
          {/* Front (Term) */}
          <div
            className={`
              absolute inset-0 backface-hidden
              flex flex-col items-center justify-center
              bg-white border-2 rounded-xl shadow-lg p-6
              ${flipped ? 'invisible' : ''}
            `}
          >
            <h2 className="text-3xl font-bold text-gray-900 text-center">
              {word.term}
            </h2>
            <div className="flex items-center gap-2 mt-3">
              {word.phonetic && (
                <span className="text-gray-400">{word.phonetic}</span>
              )}
              {/* Audio button - always show (TTS fallback available) */}
              <button
                onClick={playAudio}
                className={`p-1 text-blue-500 hover:text-blue-700 ${speaking ? 'animate-pulse' : ''}`}
                title="Play pronunciation"
                aria-label="Play pronunciation"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
              </button>
            </div>
            <p className="mt-6 text-gray-400 text-sm">Tap to reveal</p>
          </div>

          {/* Back (Answer) */}
          <div
            className={`
              absolute inset-0 backface-hidden rotate-y-180
              flex flex-col items-center justify-center
              bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl shadow-lg p-6
              ${!flipped ? 'invisible' : ''}
            `}
          >
            {word.translation && (
              <p className="text-2xl font-semibold text-blue-600 text-center mb-4">
                {word.translation}
              </p>
            )}
            {word.definition && (
              <p className="text-gray-700 text-center">{word.definition}</p>
            )}
            {word.example && (
              <p className="mt-4 text-gray-500 text-sm italic text-center">
                "{word.example}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Rating buttons (show after flip) */}
      {flipped && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          <button
            onClick={() => handleReview('again')}
            className="py-3 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
          >
            Again
          </button>
          <button
            onClick={() => handleReview('hard')}
            className="py-3 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
          >
            Hard
          </button>
          <button
            onClick={() => handleReview('good')}
            className="py-3 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
          >
            Good
          </button>
          <button
            onClick={() => handleReview('easy')}
            className="py-3 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
          >
            Easy
          </button>
        </div>
      )}

      {/* Keyboard hint */}
      <p className="mt-2 text-center text-xs text-gray-400">
        Press 1-4 or use buttons
      </p>
    </div>
  )
}
```

### Step 4: Review Tab (45min)

**File:** `src/popup/components/ReviewTab.tsx`
```typescript
import { useEffect, useCallback } from 'react'
import { useReviewSession } from '../hooks/useReviewSession'
import { Flashcard } from './Flashcard'
import { ReviewStats } from './ReviewStats'
import { useVocabStore } from '../../shared/store'

export function ReviewTab() {
  const { settings } = useVocabStore()
  const {
    currentCard,
    progress,
    sessionComplete,
    sessionStats,
    queueLength,
    handleReview,
    restartSession,
  } = useReviewSession(settings.dailyGoal)

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!currentCard) return

      const keyMap: Record<string, 'again' | 'hard' | 'good' | 'easy'> = {
        '1': 'again',
        '2': 'hard',
        '3': 'good',
        '4': 'easy',
      }

      if (keyMap[e.key]) {
        handleReview(keyMap[e.key])
      }
    },
    [currentCard, handleReview]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // No reviews available
  if (queueLength === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-lg font-semibold text-gray-800">All caught up!</h3>
        <p className="text-gray-500 text-sm mt-2">
          No reviews due. Add more words or come back later.
        </p>
        <ReviewStats className="mt-6" />
      </div>
    )
  }

  // Session complete
  if (sessionComplete) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">✨</div>
        <h3 className="text-lg font-semibold text-gray-800">Session complete!</h3>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">{sessionStats.reviewed}</p>
            <p className="text-xs text-gray-500">Reviewed</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{sessionStats.correct}</p>
            <p className="text-xs text-gray-500">Correct</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{sessionStats.wrong}</p>
            <p className="text-xs text-gray-500">To review</p>
          </div>
        </div>

        <button
          onClick={restartSession}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Review Again
        </button>

        <ReviewStats className="mt-6" />
      </div>
    )
  }

  // Active review
  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{progress.current} / {progress.total}</span>
          <span>{Math.round(progress.percent)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      {currentCard && (
        <Flashcard
          word={currentCard.word}
          isNew={currentCard.isNew}
          onReview={handleReview}
        />
      )}
    </div>
  )
}
```

### Step 5: Review Stats Component (30min)

**File:** `src/popup/components/ReviewStats.tsx`
```typescript
import { useMemo } from 'react'
import { useVocabStore } from '../../shared/store'
import { calculateStats } from '../../shared/spaced-repetition'

interface Props {
  className?: string
}

export function ReviewStats({ className = '' }: Props) {
  const { words, reviews } = useVocabStore()

  const stats = useMemo(
    () => calculateStats(words, reviews),
    [words, reviews]
  )

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Statistics</h4>

      <div className="grid grid-cols-2 gap-3">
        <StatItem label="Total words" value={stats.totalWords} />
        <StatItem label="Due today" value={stats.dueToday} highlight={stats.dueToday > 0} />
        <StatItem label="New words" value={stats.newWords} />
        <StatItem label="Mastered" value={stats.masteredWords} />
      </div>

      {stats.streak > 0 && (
        <div className="mt-3 pt-3 border-t text-center">
          <span className="text-orange-500">🔥</span>
          <span className="ml-1 text-sm text-gray-600">
            {stats.streak} day streak
          </span>
        </div>
      )}
    </div>
  )
}

function StatItem({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className="text-center">
      <p
        className={`text-xl font-bold ${
          highlight ? 'text-blue-600' : 'text-gray-800'
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
```

### Step 6: Notification Reminders (45min)

**File:** `src/background/notifications.ts`
```typescript
import { getDueReviews } from '../shared/spaced-repetition'
import type { ReviewData, Word } from '../types'

const NOTIFICATION_ID = 'review-reminder'

export async function checkAndNotify(): Promise<void> {
  // Get state from storage
  const result = await chrome.storage.local.get('vocab-storage')
  if (!result['vocab-storage']) return

  const state = JSON.parse(result['vocab-storage'])
  const { words, reviews, settings } = state.state || {}

  if (!words?.length || !settings?.notificationsEnabled) return

  // Check due reviews
  const dueReviews = getDueReviews(reviews || [], words)
  const dueCount = dueReviews.length

  if (dueCount === 0) return

  // Show notification
  chrome.notifications.create(NOTIFICATION_ID, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title: 'Vocabulary Review',
    message: `You have ${dueCount} word${dueCount > 1 ? 's' : ''} to review!`,
    buttons: [{ title: 'Review Now' }],
    priority: 1,
  })
}

// Handle notification click
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === NOTIFICATION_ID) {
    openPopupToReview()
    chrome.notifications.clear(notificationId)
  }
})

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === NOTIFICATION_ID && buttonIndex === 0) {
    openPopupToReview()
    chrome.notifications.clear(notificationId)
  }
})

function openPopupToReview() {
  // Open popup (can't directly open popup, so open options or new tab)
  chrome.action.openPopup?.() || chrome.runtime.openOptionsPage()
}
```

**Update:** `src/background/service-worker.ts`
```typescript
import { checkAndNotify } from './notifications'

// Add alarm handler
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'review-reminder') {
    await checkAndNotify()
  }
})

// Also check on startup
chrome.runtime.onStartup.addListener(async () => {
  await checkAndNotify()
})
```

### Step 7: CSS for Flashcard Animations (15min)

**Update:** `src/styles/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Flashcard flip animation */
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

## Success Criteria

- [ ] SM-2 algorithm correctly calculates next review
- [ ] Flashcard shows term on front, translation/definition on back
- [ ] Flip animation works smoothly
- [ ] Rating buttons update review schedule
- [ ] Keyboard shortcuts (1-4) work
- [ ] Session shows progress and completion stats
- [ ] Notifications appear for due reviews
- [ ] Stats display correctly (due, new, mastered)
- [ ] Audio pronunciation plays on flashcard (dictionary audio or TTS)

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| SM-2 intervals too long/short | Medium | Add difficulty tuning in settings |
| Review queue empty for new users | Low | Show onboarding to add words first |
| Notification permission denied | Low | Graceful fallback, show badge count |
| Flip animation choppy | Low | Use GPU-accelerated transforms |

## Output Files

```
src/
├── shared/spaced-repetition.ts     # SM-2 algorithm
├── popup/
│   ├── hooks/useReviewSession.ts   # Review session logic
│   └── components/
│       ├── Flashcard.tsx           # Flashcard UI
│       ├── ReviewTab.tsx           # Review tab container
│       └── ReviewStats.tsx         # Statistics display
├── background/notifications.ts     # Review reminders
└── styles/globals.css              # Updated with animations
```
