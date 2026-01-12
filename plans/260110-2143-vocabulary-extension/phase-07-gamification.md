---
phase: 07
title: "Gamification System"
status: pending
priority: P2
effort: 6h
dependencies: [phase-03, phase-06]
---

# Phase 07: Gamification System

## Context

Add gamification elements to increase engagement: daily streak tracking, points system, achievement badges, and progress stats display. Gamification data stored in Zustand with Firestore sync.

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-10 |
| Priority | P2 |
| Status | pending |
| Effort | 6h |
| Dependencies | Phase 03, 06 completed |

## Requirements

1. **Daily Streak Tracking** - Track consecutive days of review activity
2. **Points System** - Earn points for reviews with bonus for hard cards
3. **Achievement Badges** - Unlock achievements for milestones
4. **Stats Display** - Show gamification stats in popup UI
5. **Firestore Sync** - Persist gamification data across devices

## Implementation Steps

### Step 1: Gamification Types (15min)

**File:** `src/types/gamification.ts`
```typescript
export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastReviewDate: number // timestamp
  streakStartDate: number // timestamp
}

export interface PointsData {
  totalPoints: number
  todayPoints: number
  lastPointsDate: number // timestamp for resetting todayPoints
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string // emoji or icon name
  unlockedAt?: number // timestamp when unlocked
  progress?: number // 0-100 for progress-based achievements
}

export type AchievementId =
  | 'first_word'
  | 'ten_words'
  | 'fifty_words'
  | 'hundred_words'
  | 'first_review'
  | 'ten_reviews'
  | 'hundred_reviews'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30'
  | 'perfect_day'
  | 'hard_master'

export interface GamificationState {
  streak: StreakData
  points: PointsData
  achievements: Record<AchievementId, Achievement>
}
```

### Step 2: Achievement Definitions (20min)

**File:** `src/shared/achievements.ts`
```typescript
import type { Achievement, AchievementId } from '../types/gamification'

export const ACHIEVEMENT_DEFINITIONS: Record<AchievementId, Omit<Achievement, 'unlockedAt' | 'progress'>> = {
  first_word: {
    id: 'first_word',
    name: 'First Steps',
    description: 'Save your first word',
    icon: '🌱',
  },
  ten_words: {
    id: 'ten_words',
    name: 'Word Collector',
    description: 'Save 10 words',
    icon: '📚',
  },
  fifty_words: {
    id: 'fifty_words',
    name: 'Vocabulary Builder',
    description: 'Save 50 words',
    icon: '📖',
  },
  hundred_words: {
    id: 'hundred_words',
    name: 'Word Master',
    description: 'Save 100 words',
    icon: '🏆',
  },
  first_review: {
    id: 'first_review',
    name: 'Reviewer',
    description: 'Complete your first review',
    icon: '✅',
  },
  ten_reviews: {
    id: 'ten_reviews',
    name: 'Dedicated Learner',
    description: 'Complete 10 reviews',
    icon: '📝',
  },
  hundred_reviews: {
    id: 'hundred_reviews',
    name: 'Review Champion',
    description: 'Complete 100 reviews',
    icon: '🎯',
  },
  streak_3: {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
  },
  streak_7: {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '💪',
  },
  streak_30: {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '👑',
  },
  perfect_day: {
    id: 'perfect_day',
    name: 'Perfect Day',
    description: 'Review all due cards in one day',
    icon: '⭐',
  },
  hard_master: {
    id: 'hard_master',
    name: 'Hard Card Master',
    description: 'Successfully review 10 hard cards',
    icon: '💎',
  },
}

export function initializeAchievements(): Record<AchievementId, Achievement> {
  const achievements: Record<string, Achievement> = {}
  for (const [id, def] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
    achievements[id] = { ...def, unlockedAt: undefined, progress: 0 }
  }
  return achievements as Record<AchievementId, Achievement>
}
```

### Step 3: Gamification Logic (45min)

**File:** `src/shared/gamification.ts`
```typescript
import type { StreakData, PointsData, GamificationState, AchievementId } from '../types/gamification'

// Points configuration
export const POINTS = {
  REVIEW_AGAIN: 1, // Failed review
  REVIEW_HARD: 3, // Hard but correct
  REVIEW_GOOD: 5, // Normal correct
  REVIEW_EASY: 7, // Easy correct
  STREAK_BONUS: 10, // Per day of streak (multiplier)
  NEW_WORD: 2, // Adding new word
}

// Check if date is today
function isToday(timestamp: number): boolean {
  const date = new Date(timestamp)
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

// Check if date was yesterday
function isYesterday(timestamp: number): boolean {
  const date = new Date(timestamp)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  )
}

// Update streak on review
export function updateStreak(current: StreakData): StreakData {
  const now = Date.now()

  // Already reviewed today - no change
  if (isToday(current.lastReviewDate)) {
    return current
  }

  // Reviewed yesterday - continue streak
  if (isYesterday(current.lastReviewDate)) {
    const newStreak = current.currentStreak + 1
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, current.longestStreak),
      lastReviewDate: now,
      streakStartDate: current.streakStartDate,
    }
  }

  // Streak broken - start new
  return {
    currentStreak: 1,
    longestStreak: current.longestStreak,
    lastReviewDate: now,
    streakStartDate: now,
  }
}

// Calculate points for a review
export function calculateReviewPoints(
  rating: 'again' | 'hard' | 'good' | 'easy',
  streak: number
): number {
  const basePoints: Record<string, number> = {
    again: POINTS.REVIEW_AGAIN,
    hard: POINTS.REVIEW_HARD,
    good: POINTS.REVIEW_GOOD,
    easy: POINTS.REVIEW_EASY,
  }

  const base = basePoints[rating]
  const streakBonus = Math.min(streak, 30) * 0.1 // Max 300% bonus at 30-day streak
  return Math.round(base * (1 + streakBonus))
}

// Update points after review
export function updatePoints(
  current: PointsData,
  rating: 'again' | 'hard' | 'good' | 'easy',
  streak: number
): PointsData {
  const now = Date.now()
  const earnedPoints = calculateReviewPoints(rating, streak)

  // Reset today's points if new day
  const todayPoints = isToday(current.lastPointsDate)
    ? current.todayPoints + earnedPoints
    : earnedPoints

  return {
    totalPoints: current.totalPoints + earnedPoints,
    todayPoints,
    lastPointsDate: now,
  }
}

// Check and unlock achievements
export function checkAchievements(
  state: GamificationState,
  context: {
    totalWords: number
    totalReviews: number
    hardCardsReviewed: number
    allDueCompleted: boolean
  }
): AchievementId[] {
  const newlyUnlocked: AchievementId[] = []
  const { streak, achievements } = state
  const { totalWords, totalReviews, hardCardsReviewed, allDueCompleted } = context

  const checks: Array<{ id: AchievementId; condition: boolean }> = [
    // Word milestones
    { id: 'first_word', condition: totalWords >= 1 },
    { id: 'ten_words', condition: totalWords >= 10 },
    { id: 'fifty_words', condition: totalWords >= 50 },
    { id: 'hundred_words', condition: totalWords >= 100 },

    // Review milestones
    { id: 'first_review', condition: totalReviews >= 1 },
    { id: 'ten_reviews', condition: totalReviews >= 10 },
    { id: 'hundred_reviews', condition: totalReviews >= 100 },

    // Streak milestones
    { id: 'streak_3', condition: streak.currentStreak >= 3 },
    { id: 'streak_7', condition: streak.currentStreak >= 7 },
    { id: 'streak_30', condition: streak.currentStreak >= 30 },

    // Special achievements
    { id: 'perfect_day', condition: allDueCompleted },
    { id: 'hard_master', condition: hardCardsReviewed >= 10 },
  ]

  for (const { id, condition } of checks) {
    if (condition && !achievements[id].unlockedAt) {
      newlyUnlocked.push(id)
    }
  }

  return newlyUnlocked
}

// Initialize default gamification state
export function initGamificationState(): GamificationState {
  return {
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastReviewDate: 0,
      streakStartDate: 0,
    },
    points: {
      totalPoints: 0,
      todayPoints: 0,
      lastPointsDate: 0,
    },
    achievements: {} as GamificationState['achievements'],
  }
}
```

### Step 4: Update Store with Gamification (30min)

**Update:** `src/shared/store.ts`
```typescript
// Add to existing store interface
import type { GamificationState, AchievementId } from '../types/gamification'
import { initGamificationState, updateStreak, updatePoints, checkAchievements } from './gamification'
import { initializeAchievements } from './achievements'

interface VocabStore {
  // ... existing state
  gamification: GamificationState
  totalReviews: number
  hardCardsReviewed: number

  // Gamification actions
  recordReview: (rating: 'again' | 'hard' | 'good' | 'easy') => AchievementId[]
  unlockAchievement: (id: AchievementId) => void
  resetStreak: () => void
}

export const useVocabStore = create<VocabStore>()(
  persist(
    (set, get) => ({
      // ... existing state

      gamification: {
        ...initGamificationState(),
        achievements: initializeAchievements(),
      },
      totalReviews: 0,
      hardCardsReviewed: 0,

      recordReview: (rating) => {
        const state = get()
        const newStreak = updateStreak(state.gamification.streak)
        const newPoints = updatePoints(state.gamification.points, rating, newStreak.currentStreak)

        const hardCardsReviewed = rating === 'hard'
          ? state.hardCardsReviewed + 1
          : state.hardCardsReviewed

        const totalReviews = state.totalReviews + 1

        // Check achievements
        const newlyUnlocked = checkAchievements(
          { ...state.gamification, streak: newStreak },
          {
            totalWords: state.words.length,
            totalReviews,
            hardCardsReviewed,
            allDueCompleted: false, // Set by ReviewTab when session complete
          }
        )

        // Update achievements
        const achievements = { ...state.gamification.achievements }
        for (const id of newlyUnlocked) {
          achievements[id] = { ...achievements[id], unlockedAt: Date.now() }
        }

        set({
          gamification: {
            streak: newStreak,
            points: newPoints,
            achievements,
          },
          totalReviews,
          hardCardsReviewed,
        })

        return newlyUnlocked
      },

      unlockAchievement: (id) => {
        set((state) => ({
          gamification: {
            ...state.gamification,
            achievements: {
              ...state.gamification.achievements,
              [id]: {
                ...state.gamification.achievements[id],
                unlockedAt: Date.now(),
              },
            },
          },
        }))
      },

      resetStreak: () => {
        set((state) => ({
          gamification: {
            ...state.gamification,
            streak: {
              currentStreak: 0,
              longestStreak: state.gamification.streak.longestStreak,
              lastReviewDate: 0,
              streakStartDate: 0,
            },
          },
        }))
      },
    }),
    {
      name: 'vocab-storage',
    }
  )
)
```

### Step 5: Gamification Stats Component (45min)

**File:** `src/popup/components/GamificationStats.tsx`
```typescript
import { useMemo } from 'react'
import { useVocabStore } from '../../shared/store'
import type { Achievement } from '../../types/gamification'

interface Props {
  compact?: boolean
  className?: string
}

export function GamificationStats({ compact = false, className = '' }: Props) {
  const { gamification, totalReviews, words } = useVocabStore()
  const { streak, points, achievements } = gamification

  const unlockedCount = useMemo(
    () => Object.values(achievements).filter((a) => a.unlockedAt).length,
    [achievements]
  )

  const totalAchievements = Object.keys(achievements).length

  if (compact) {
    return (
      <div className={`flex items-center gap-4 text-sm ${className}`}>
        {/* Streak */}
        <div className="flex items-center gap-1">
          <span className="text-orange-500">🔥</span>
          <span className="font-semibold">{streak.currentStreak}</span>
        </div>

        {/* Points */}
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">⭐</span>
          <span className="font-semibold">{points.totalPoints}</span>
        </div>

        {/* Achievements */}
        <div className="flex items-center gap-1">
          <span className="text-purple-500">🏆</span>
          <span className="font-semibold">{unlockedCount}/{totalAchievements}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Progress</h3>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Streak */}
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <div className="text-2xl mb-1">🔥</div>
          <div className="text-xl font-bold text-orange-600">{streak.currentStreak}</div>
          <div className="text-xs text-gray-500">Day Streak</div>
        </div>

        {/* Points */}
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <div className="text-2xl mb-1">⭐</div>
          <div className="text-xl font-bold text-yellow-600">{points.totalPoints}</div>
          <div className="text-xs text-gray-500">Total Points</div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <div className="text-2xl mb-1">🏆</div>
          <div className="text-xl font-bold text-purple-600">{unlockedCount}</div>
          <div className="text-xs text-gray-500">Achievements</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div className="flex justify-between bg-white/50 rounded px-2 py-1">
          <span>Today's Points:</span>
          <span className="font-semibold">{points.todayPoints}</span>
        </div>
        <div className="flex justify-between bg-white/50 rounded px-2 py-1">
          <span>Best Streak:</span>
          <span className="font-semibold">{streak.longestStreak} days</span>
        </div>
        <div className="flex justify-between bg-white/50 rounded px-2 py-1">
          <span>Total Reviews:</span>
          <span className="font-semibold">{totalReviews}</span>
        </div>
        <div className="flex justify-between bg-white/50 rounded px-2 py-1">
          <span>Words Saved:</span>
          <span className="font-semibold">{words.length}</span>
        </div>
      </div>
    </div>
  )
}
```

### Step 6: Achievements Display Component (45min)

**File:** `src/popup/components/AchievementsList.tsx`
```typescript
import { useMemo } from 'react'
import { useVocabStore } from '../../shared/store'
import { ACHIEVEMENT_DEFINITIONS } from '../../shared/achievements'
import type { Achievement, AchievementId } from '../../types/gamification'

interface Props {
  showAll?: boolean // Show locked achievements too
  className?: string
}

export function AchievementsList({ showAll = true, className = '' }: Props) {
  const { gamification } = useVocabStore()
  const { achievements } = gamification

  const sortedAchievements = useMemo(() => {
    const entries = Object.entries(achievements) as Array<[AchievementId, Achievement]>

    // Sort: unlocked first (by date), then locked
    return entries.sort((a, b) => {
      const aUnlocked = a[1].unlockedAt || 0
      const bUnlocked = b[1].unlockedAt || 0

      if (aUnlocked && !bUnlocked) return -1
      if (!aUnlocked && bUnlocked) return 1
      if (aUnlocked && bUnlocked) return bUnlocked - aUnlocked // Recent first

      return 0
    })
  }, [achievements])

  const displayAchievements = showAll
    ? sortedAchievements
    : sortedAchievements.filter(([_, a]) => a.unlockedAt)

  if (displayAchievements.length === 0) {
    return (
      <div className={`text-center text-gray-500 text-sm py-4 ${className}`}>
        No achievements yet. Start reviewing to unlock!
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {displayAchievements.map(([id, achievement]) => (
        <AchievementCard
          key={id}
          achievement={achievement}
          isUnlocked={!!achievement.unlockedAt}
        />
      ))}
    </div>
  )
}

function AchievementCard({
  achievement,
  isUnlocked,
}: {
  achievement: Achievement
  isUnlocked: boolean
}) {
  const def = ACHIEVEMENT_DEFINITIONS[achievement.id as AchievementId]

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg border
        ${isUnlocked
          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
          : 'bg-gray-50 border-gray-200 opacity-60'
        }
      `}
    >
      <div className={`text-2xl ${isUnlocked ? '' : 'grayscale'}`}>
        {def.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-800 text-sm">
          {def.name}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {def.description}
        </div>
      </div>
      {isUnlocked && (
        <div className="text-green-500 text-lg">✓</div>
      )}
    </div>
  )
}
```

### Step 7: Achievement Unlock Toast (30min)

**File:** `src/popup/components/AchievementToast.tsx`
```typescript
import { useEffect, useState } from 'react'
import { ACHIEVEMENT_DEFINITIONS } from '../../shared/achievements'
import type { AchievementId } from '../../types/gamification'

interface Props {
  achievementId: AchievementId | null
  onDismiss: () => void
}

export function AchievementToast({ achievementId, onDismiss }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (achievementId) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onDismiss, 300) // Wait for fade out
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [achievementId, onDismiss])

  if (!achievementId) return null

  const def = ACHIEVEMENT_DEFINITIONS[achievementId]

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        bg-gradient-to-r from-yellow-400 to-orange-500
        text-white rounded-xl shadow-lg p-4
        transform transition-all duration-300
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl animate-bounce">{def.icon}</div>
        <div>
          <div className="text-xs uppercase tracking-wide opacity-80">
            Achievement Unlocked!
          </div>
          <div className="font-bold">{def.name}</div>
          <div className="text-sm opacity-90">{def.description}</div>
        </div>
      </div>
    </div>
  )
}
```

### Step 8: Integrate Gamification in Popup (30min)

**Update:** `src/popup/App.tsx`
```typescript
import { useState } from 'react'
import { Header } from './components/Header'
import { LookupTab } from './components/LookupTab'
import { WordsTab } from './components/WordsTab'
import { ReviewTab } from './components/ReviewTab'
import { GamificationStats } from './components/GamificationStats'
import { AchievementToast } from './components/AchievementToast'
import { useAuth } from './hooks/useAuth'
import { initializeFirebase } from '../shared/firebase'
import type { AchievementId } from '../types/gamification'

type Tab = 'lookup' | 'words' | 'review' | 'stats'

initializeFirebase()

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('lookup')
  const [unlockedAchievement, setUnlockedAchievement] = useState<AchievementId | null>(null)
  const { isAuthenticated } = useAuth()

  const handleAchievementUnlocked = (id: AchievementId) => {
    setUnlockedAchievement(id)
  }

  return (
    <div className="w-[400px] h-[500px] flex flex-col bg-white">
      <Header />

      {/* Compact stats bar */}
      <div className="px-4 py-2 bg-gray-50 border-b">
        <GamificationStats compact />
      </div>

      {/* Tab Navigation */}
      <nav className="flex border-b">
        {(['lookup', 'words', 'review', 'stats'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-2 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'stats' ? '📊 Stats' : tab}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === 'lookup' && <LookupTab />}
        {activeTab === 'words' && <WordsTab />}
        {activeTab === 'review' && (
          <ReviewTab onAchievementUnlocked={handleAchievementUnlocked} />
        )}
        {activeTab === 'stats' && <StatsTab />}
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

      {/* Achievement toast */}
      <AchievementToast
        achievementId={unlockedAchievement}
        onDismiss={() => setUnlockedAchievement(null)}
      />
    </div>
  )
}

// Stats tab showing full gamification details
function StatsTab() {
  return (
    <div className="space-y-4">
      <GamificationStats />
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Achievements</h3>
        <AchievementsList showAll />
      </div>
    </div>
  )
}
```

### Step 9: Update ReviewTab for Gamification (30min)

**Update:** `src/popup/components/ReviewTab.tsx`
```typescript
// Add prop and call recordReview
interface Props {
  onAchievementUnlocked?: (id: AchievementId) => void
}

export function ReviewTab({ onAchievementUnlocked }: Props) {
  const { recordReview } = useVocabStore()

  // In handleReview callback:
  const handleReview = useCallback(
    async (button: 'again' | 'hard' | 'good' | 'easy') => {
      // ... existing SM-2 logic

      // Record for gamification
      const newlyUnlocked = recordReview(button)
      if (newlyUnlocked.length > 0 && onAchievementUnlocked) {
        // Show first unlocked achievement
        onAchievementUnlocked(newlyUnlocked[0])
      }

      // ... rest of existing logic
    },
    [currentCard, currentIndex, reviewQueue.length, updateReview, user, recordReview, onAchievementUnlocked]
  )
}
```

### Step 10: Firestore Sync for Gamification (30min)

**Update:** `src/shared/firestore.ts`
```typescript
import type { GamificationState } from '../types/gamification'

// Save gamification data
export async function saveGamification(
  userId: string,
  gamification: GamificationState
): Promise<void> {
  const db = getFirestore(firebaseApp)
  const docRef = doc(db, 'users', userId, 'data', 'gamification')
  await setDoc(docRef, gamification, { merge: true })
}

// Load gamification data
export async function loadGamification(
  userId: string
): Promise<GamificationState | null> {
  const db = getFirestore(firebaseApp)
  const docRef = doc(db, 'users', userId, 'data', 'gamification')
  const snapshot = await getDoc(docRef)
  return snapshot.exists() ? (snapshot.data() as GamificationState) : null
}
```

## Success Criteria

- [ ] Daily streak increments correctly on consecutive days
- [ ] Streak resets after missing a day
- [ ] Points awarded for each review (different amounts by difficulty)
- [ ] Streak bonus multiplier works
- [ ] All 12 achievements can be unlocked
- [ ] Achievement toast appears on unlock
- [ ] Compact stats bar shows in popup
- [ ] Full stats tab displays all gamification data
- [ ] Gamification data syncs to Firestore

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Timezone issues with streak | Medium | Use UTC for all date comparisons |
| Points inflation | Low | Cap streak bonus at 30 days |
| Achievement not triggering | Medium | Add debug logging, test each condition |
| Data not syncing | Medium | Save on every review, load on auth |

## Output Files

```
src/
├── types/gamification.ts           # Gamification type definitions
├── shared/
│   ├── achievements.ts             # Achievement definitions
│   └── gamification.ts             # Streak, points, achievement logic
├── popup/components/
│   ├── GamificationStats.tsx       # Stats display (compact + full)
│   ├── AchievementsList.tsx        # Achievements grid
│   └── AchievementToast.tsx        # Unlock notification
└── shared/
    ├── store.ts                    # Updated with gamification state
    └── firestore.ts                # Updated with gamification sync
```
