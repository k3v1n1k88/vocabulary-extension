# Phase 02: Unit Tests

## Context

- **Parent Plan:** [plan.md](./plan.md)
- **Dependencies:** Phase 01 (Vitest setup)
- **Docs:** [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-16 |
| Description | Write unit tests for high-priority components |
| Priority | P1 |
| Implementation Status | pending |
| Review Status | pending |

## Key Insights

1. Zustand stores testable by mocking chrome.storage
2. Translation service needs fetch + chrome.storage mocks
3. Pure functions (isPhrase, parseTranslationResult) easiest to test
4. Avoid testing implementation details - focus on behavior

## Requirements

- [ ] Test Zustand stores (vocabulary, stats, settings)
- [ ] Test translation service pure functions
- [ ] Test spaced repetition algorithm
- [ ] Mock chrome.storage for persistence tests

## Architecture

```
src/shared/
├── store.ts
├── store.test.ts              # NEW
├── translation-service.ts
├── translation-service.test.ts # NEW
├── spaced-repetition.ts
└── spaced-repetition.test.ts   # NEW
```

## Related Code Files

| File | Purpose |
|------|---------|
| `src/shared/store.test.ts` | Test Zustand stores |
| `src/shared/translation-service.test.ts` | Test translation |
| `src/shared/spaced-repetition.test.ts` | Test SM-2 algorithm |

## Implementation Steps

### Step 1: Test store.ts

```typescript
// src/shared/store.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { chrome } from 'vitest-chrome'
import { useVocabularyStore, useStatsStore, useSettingsStore } from './store'
import type { Word } from '@/types'

// Helper to create test word
const createWord = (overrides = {}): Word => ({
  id: 'test-id',
  word: 'test',
  definition: 'a test word',
  examples: [],
  phonetic: '/test/',
  addedAt: Date.now(),
  ...overrides
})

describe('useVocabularyStore', () => {
  beforeEach(() => {
    // Reset store state
    useVocabularyStore.setState({ words: [], flashcards: new Map() })
  })

  it('adds a word and creates flashcard', () => {
    const word = createWord()
    useVocabularyStore.getState().addWord(word)

    const state = useVocabularyStore.getState()
    expect(state.words).toHaveLength(1)
    expect(state.flashcards.has(word.id)).toBe(true)
  })

  it('prevents duplicate words', () => {
    const word = createWord()
    useVocabularyStore.getState().addWord(word)
    useVocabularyStore.getState().addWord({ ...word, id: 'different-id' })

    expect(useVocabularyStore.getState().words).toHaveLength(1)
  })

  it('removes word and flashcard', () => {
    const word = createWord()
    useVocabularyStore.getState().addWord(word)
    useVocabularyStore.getState().removeWord(word.id)

    const state = useVocabularyStore.getState()
    expect(state.words).toHaveLength(0)
    expect(state.flashcards.has(word.id)).toBe(false)
  })

  it('returns due cards', () => {
    const word = createWord()
    useVocabularyStore.getState().addWord(word)

    const dueCards = useVocabularyStore.getState().getDueCards()
    expect(dueCards).toHaveLength(1)
    expect(dueCards[0].wordId).toBe(word.id)
  })
})

describe('useStatsStore', () => {
  beforeEach(() => {
    useStatsStore.setState({
      stats: {
        totalWords: 0, wordsLearned: 0, totalReviews: 0, accuracy: 0,
        currentStreak: 0, longestStreak: 0, lastStudyDate: '',
        totalStudyTime: 0, xp: 0, level: 1
      }
    })
  })

  it('adds XP and calculates level', () => {
    useStatsStore.getState().addXP(500)
    expect(useStatsStore.getState().stats.xp).toBe(500)
    expect(useStatsStore.getState().stats.level).toBe(2)
  })

  it('increments streak correctly', () => {
    useStatsStore.getState().incrementStreak()
    expect(useStatsStore.getState().stats.currentStreak).toBe(1)
  })
})
```

### Step 2: Test translation-service.ts

```typescript
// src/shared/translation-service.test.ts
import { describe, it, expect } from 'vitest'
import { isPhrase } from './translation-service'

describe('isPhrase', () => {
  it('returns false for single word', () => {
    expect(isPhrase('hello')).toBe(false)
  })

  it('returns true for multiple words', () => {
    expect(isPhrase('hello world')).toBe(true)
  })

  it('handles whitespace correctly', () => {
    expect(isPhrase('  hello  ')).toBe(false)
    expect(isPhrase('  hello  world  ')).toBe(true)
  })
})

// Note: translateText requires mocking fetch and chrome.storage
// which is more complex - focus on pure functions first
```

### Step 3: Test spaced-repetition.ts

```typescript
// src/shared/spaced-repetition.test.ts
import { describe, it, expect } from 'vitest'
import { calculateNextReview, SM2Quality } from './spaced-repetition'

describe('calculateNextReview', () => {
  const baseCard = {
    wordId: 'test',
    repetitions: 0,
    easinessFactor: 2.5,
    interval: 1,
    nextReview: Date.now()
  }

  it('resets on quality < 3', () => {
    const result = calculateNextReview(baseCard, SM2Quality.BLACKOUT)
    expect(result.repetitions).toBe(0)
    expect(result.interval).toBe(1)
  })

  it('increases interval on good quality', () => {
    const result = calculateNextReview(baseCard, SM2Quality.GOOD)
    expect(result.repetitions).toBe(1)
    expect(result.interval).toBeGreaterThan(1)
  })

  it('adjusts easiness factor', () => {
    const result = calculateNextReview(baseCard, SM2Quality.PERFECT)
    expect(result.easinessFactor).toBeGreaterThan(2.5)
  })
})
```

## Todo List

- [ ] Create src/shared/store.test.ts
- [ ] Create src/shared/translation-service.test.ts
- [ ] Create src/shared/spaced-repetition.test.ts
- [ ] Run tests and fix any issues
- [ ] Achieve >80% coverage on tested files

## Success Criteria

1. All tests pass with `npm run test:unit`
2. Store operations (add/remove/update) verified
3. Pure functions fully tested
4. No false positives from implementation details

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Zustand persist breaks tests | Medium | Medium | Test state without persist |
| Async storage timing | Low | Medium | Use proper async assertions |

## Next Steps

After unit tests pass, proceed to Phase 03 for E2E setup.
