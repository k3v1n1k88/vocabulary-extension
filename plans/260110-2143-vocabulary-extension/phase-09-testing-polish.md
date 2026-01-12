---
phase: 09
title: "Testing & Polish"
status: pending
priority: P2
effort: 3h
dependencies: [phase-01, phase-02, phase-03, phase-04, phase-05, phase-06, phase-07, phase-08]
---

# Phase 09: Testing & Polish

## Context

Final phase: manual testing checklist, bug fixes, performance optimization, accessibility, and preparation for Chrome Web Store submission.

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-10 |
| Priority | P2 |
| Status | pending |
| Effort | 3h |
| Dependencies | All phases completed |

## Requirements

1. Manual testing on multiple sites
2. Bug fixes from testing
3. Performance optimization
4. Accessibility improvements
5. Error handling polish
6. Chrome Web Store assets

## Implementation Steps

### Step 1: Testing Checklist (Manual)

**File:** `docs/testing-checklist.md`
```markdown
# Vocabulary Extension - Testing Checklist

## Installation
- [ ] Extension loads without errors in chrome://extensions
- [ ] All permissions granted correctly
- [ ] Icons display at all sizes (16, 48, 128)

## Popup UI
- [ ] Popup opens when clicking extension icon
- [ ] All three tabs (Lookup, Words, Review) accessible
- [ ] Tab switching works smoothly
- [ ] Settings link opens options page
- [ ] Popup closes when clicking outside

## Authentication
- [ ] Google Sign In button works
- [ ] OAuth popup appears and completes
- [ ] User avatar/email displays after sign in
- [ ] Sign Out clears user state
- [ ] Auth persists after browser restart

## Word Lookup
- [ ] Context menu appears on text selection
- [ ] "Look up" triggers lookup correctly
- [ ] Manual input in popup works
- [ ] English words show dictionary definitions
- [ ] Vietnamese words show English translation
- [ ] Audio pronunciation plays (dictionary audio or TTS fallback)
- [ ] TTS works when dictionary audio unavailable
- [ ] Tooltip appears near selection
- [ ] Tooltip closes on click outside
- [ ] "Save" button works

## Vocabulary Storage
- [ ] Saved words appear in Words tab
- [ ] Search filters correctly
- [ ] Sort (recent/alpha) works
- [ ] Click opens word detail
- [ ] Edit mode allows changes
- [ ] Save persists edits
- [ ] Delete removes word
- [ ] Export creates valid JSON
- [ ] Import adds new words

## Flashcard Review
- [ ] Review tab shows due cards
- [ ] New words included in queue
- [ ] Card flip animation works
- [ ] Rating buttons (1-4) work
- [ ] Keyboard shortcuts work
- [ ] Progress bar updates
- [ ] Session complete shows stats
- [ ] "Review Again" restarts session
- [ ] Stats display accurately
- [ ] Audio plays on flashcard (dictionary or TTS)

## Gamification
- [ ] Streak increments on consecutive days
- [ ] Streak resets after missing a day
- [ ] Points awarded for reviews
- [ ] Streak bonus multiplier works
- [ ] Achievements unlock correctly
- [ ] Achievement toast appears on unlock
- [ ] Compact stats bar displays in popup
- [ ] Full stats tab shows all data
- [ ] Gamification data syncs to Firestore

## Sync
- [ ] Words sync to Firestore on save
- [ ] Words load from Firestore on sign in
- [ ] Settings persist across devices
- [ ] Offline changes sync when online

## Notifications
- [ ] Review reminder appears when due
- [ ] Clicking notification opens popup
- [ ] Notifications respect enabled setting

## Options Page
- [ ] All settings display correctly
- [ ] Language settings save
- [ ] Daily goal setting saves
- [ ] Notification toggle works
- [ ] Delete all requires confirmation
- [ ] About section shows version

## Cross-site Testing
Test on these popular sites:
- [ ] google.com
- [ ] wikipedia.org
- [ ] medium.com
- [ ] reddit.com
- [ ] twitter.com/x.com
- [ ] youtube.com (comments)
- [ ] GitHub (README files)

## Edge Cases
- [ ] Empty word list shows helpful message
- [ ] No internet shows offline message
- [ ] Invalid word shows error gracefully
- [ ] Very long words/definitions truncate
- [ ] Special characters handled
- [ ] Multiple rapid clicks don't break UI
```

### Step 2: Error Handling Improvements (45min)

**File:** `src/shared/errors.ts`
```typescript
export class VocabError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message)
    this.name = 'VocabError'
  }
}

export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_FAILED: 'AUTH_FAILED',
  SYNC_FAILED: 'SYNC_FAILED',
  LOOKUP_FAILED: 'LOOKUP_FAILED',
  STORAGE_FULL: 'STORAGE_FULL',
  INVALID_DATA: 'INVALID_DATA',
} as const

export function handleError(error: unknown): VocabError {
  if (error instanceof VocabError) {
    return error
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new VocabError(
        'Network error. Please check your connection.',
        ErrorCodes.NETWORK_ERROR
      )
    }

    // Auth errors
    if (error.message.includes('auth') || error.message.includes('credential')) {
      return new VocabError(
        'Authentication failed. Please try signing in again.',
        ErrorCodes.AUTH_FAILED
      )
    }

    return new VocabError(error.message, 'UNKNOWN_ERROR')
  }

  return new VocabError('An unexpected error occurred', 'UNKNOWN_ERROR')
}
```

**File:** `src/popup/components/ErrorBoundary.tsx`
```typescript
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 text-center">
            <p className="text-red-600 font-medium">Something went wrong</p>
            <p className="text-gray-500 text-sm mt-2">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Try Again
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
```

### Step 3: Loading States (30min)

**File:** `src/popup/components/LoadingSpinner.tsx`
```typescript
interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: Props) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  }

  return (
    <div
      className={`
        animate-spin rounded-full
        border-blue-600 border-t-transparent
        ${sizeClasses[size]}
        ${className}
      `}
    />
  )
}
```

**File:** `src/popup/components/Skeleton.tsx`
```typescript
interface Props {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({ className = '', variant = 'text' }: Props) {
  const baseClasses = 'animate-pulse bg-gray-200'

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
  }

  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
}

// Usage: <Skeleton className="w-full h-20" variant="rectangular" />
```

### Step 4: Accessibility Improvements (30min)

**File:** `src/shared/a11y.ts`
```typescript
// ARIA labels and keyboard navigation helpers

export const AriaLabels = {
  LOOKUP_INPUT: 'Enter a word to look up',
  SEARCH_INPUT: 'Search saved words',
  FLIP_CARD: 'Press Space or Enter to flip card',
  RATING_BUTTONS: 'Rate how well you knew this word',
  PLAY_AUDIO: 'Play pronunciation',
  SAVE_WORD: 'Save word to vocabulary',
  DELETE_WORD: 'Delete this word',
}

// Keyboard handler for flashcard
export function handleCardKeyboard(
  e: React.KeyboardEvent,
  flipped: boolean,
  onFlip: () => void,
  onRate: (rating: 'again' | 'hard' | 'good' | 'easy') => void
) {
  if (!flipped && (e.key === ' ' || e.key === 'Enter')) {
    e.preventDefault()
    onFlip()
    return
  }

  if (flipped) {
    const keyMap: Record<string, 'again' | 'hard' | 'good' | 'easy'> = {
      '1': 'again',
      '2': 'hard',
      '3': 'good',
      '4': 'easy',
    }

    if (keyMap[e.key]) {
      e.preventDefault()
      onRate(keyMap[e.key])
    }
  }
}
```

### Step 5: Performance Optimization (30min)

**File:** `src/shared/performance.ts`
```typescript
// Debounce for search input
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Memoize expensive calculations
export function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const cache = new Map()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

// Lazy load components
export const lazyImport = <T extends { default: React.ComponentType }>(
  factory: () => Promise<T>
) => {
  return React.lazy(factory)
}
```

### Step 6: Chrome Web Store Assets (30min)

**Required assets:**

1. **Icons** (already created in Phase 02):
   - `icons/icon16.png` - 16x16
   - `icons/icon48.png` - 48x48
   - `icons/icon128.png` - 128x128

2. **Screenshots** (create manually):
   - `store/screenshot1.png` - Popup lookup (1280x800)
   - `store/screenshot2.png` - Word list (1280x800)
   - `store/screenshot3.png` - Flashcard review (1280x800)
   - `store/screenshot4.png` - Options page (1280x800)

3. **Promotional images**:
   - `store/promo-small.png` - 440x280 (small tile)
   - `store/promo-large.png` - 920x680 (large tile, optional)
   - `store/promo-marquee.png` - 1400x560 (marquee, optional)

4. **Store listing text**:

**File:** `store/listing.md`
```markdown
# Vocabulary Extension

## Short Description (132 chars max)
Learn vocabulary with flashcards and spaced repetition. Look up words instantly, save them, and review with the SM-2 algorithm.

## Detailed Description
Vocabulary Extension helps you learn new words efficiently using proven spaced repetition techniques.

**Features:**
- Quick word lookup via right-click context menu
- English dictionary definitions with pronunciation
- English/Vietnamese translation support
- Save words to your personal vocabulary
- Review with SM-2 spaced repetition flashcards
- Sync across devices with Google account
- Track your learning progress

**How it works:**
1. Select any word on a webpage
2. Right-click and choose "Look up"
3. Save interesting words to your vocabulary
4. Review daily with smart flashcards
5. Master vocabulary through spaced repetition

**Privacy:**
- Your data stays private
- Sign in with Google to sync (optional)
- No ads, no tracking

Perfect for language learners, students, and anyone wanting to expand their vocabulary!

## Category
Productivity / Education

## Language
English, Vietnamese
```

### Step 7: Build & Package Script (15min)

**File:** `scripts/build.sh` (or `build.ps1` for Windows)
```bash
#!/bin/bash
# Build script for Chrome Web Store submission

# Clean previous builds
rm -rf dist
rm -f vocabulary-extension.zip

# Build production
npm run build

# Create zip for Chrome Web Store
cd dist
zip -r ../vocabulary-extension.zip .
cd ..

echo "Build complete! Upload vocabulary-extension.zip to Chrome Web Store"
```

**Update:** `package.json`
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "package": "npm run build && cd dist && zip -r ../vocabulary-extension.zip ."
  }
}
```

## Success Criteria

- [ ] All tests in checklist pass
- [ ] No console errors in production build
- [ ] Extension size < 5MB
- [ ] Popup loads in < 500ms
- [ ] All Chrome Web Store assets created
- [ ] Store listing text finalized
- [ ] Build script creates valid .zip

## Final Checklist Before Submission

- [ ] Remove all `console.log` statements (except errors)
- [ ] Verify manifest permissions are minimal
- [ ] Test in Chrome, Edge, and Brave
- [ ] Privacy policy URL set (if required)
- [ ] Screenshots are high quality
- [ ] Version number updated
- [ ] CHANGELOG.md updated

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Store rejection | High | Follow Chrome Web Store policies carefully |
| Performance issues on slow sites | Medium | Test on heavy sites, optimize selectors |
| Memory leaks | Medium | Use React DevTools profiler |

## Output Files

```
docs/
└── testing-checklist.md

src/shared/
├── errors.ts
├── a11y.ts
└── performance.ts

src/popup/components/
├── ErrorBoundary.tsx
├── LoadingSpinner.tsx
└── Skeleton.tsx

store/
├── listing.md
├── screenshot1.png (manual)
├── screenshot2.png (manual)
├── screenshot3.png (manual)
├── screenshot4.png (manual)
└── promo-small.png (manual)

scripts/
└── build.sh

vocabulary-extension.zip (generated)
```
