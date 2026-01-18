import { describe, it, expect } from 'vitest'
import {
  parseSettings,
  parseVocabData,
  parseStatsData,
  getDueCards,
  getRandomWordPreview,
  type NotificationData
} from './notification-helpers'

describe('parseSettings', () => {
  it('returns null when settings-storage key is missing', () => {
    const result = parseSettings({})
    expect(result).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    const result = parseSettings({ 'settings-storage': 'invalid-json' })
    expect(result).toBeNull()
  })

  it('returns null when state.settings is missing', () => {
    const result = parseSettings({
      'settings-storage': JSON.stringify({ other: 'data' })
    })
    expect(result).toBeNull()
  })

  it('parses valid settings', () => {
    const settings = {
      notificationsEnabled: true,
      reminderInterval: 30
    }
    const result = parseSettings({
      'settings-storage': JSON.stringify({ state: { settings } })
    })
    expect(result).toEqual(settings)
  })
})

describe('parseVocabData', () => {
  it('returns empty arrays when vocabulary-storage is missing', () => {
    const result = parseVocabData({})
    expect(result).toEqual({ words: [], flashcards: [] })
  })

  it('returns empty arrays for invalid JSON', () => {
    const result = parseVocabData({ 'vocabulary-storage': 'invalid' })
    expect(result).toEqual({ words: [], flashcards: [] })
  })

  it('parses valid vocabulary data', () => {
    const words = [{ id: '1', word: 'test', definition: 'a test' }]
    const flashcards = [['1', { nextReview: 123456 }]]
    const result = parseVocabData({
      'vocabulary-storage': JSON.stringify({
        state: { words, flashcards }
      })
    })
    expect(result.words).toEqual(words)
    expect(result.flashcards).toEqual(flashcards)
  })

  it('handles missing state fields gracefully', () => {
    const result = parseVocabData({
      'vocabulary-storage': JSON.stringify({ state: {} })
    })
    expect(result).toEqual({ words: [], flashcards: [] })
  })
})

describe('parseStatsData', () => {
  it('returns zero streak when stats-storage is missing', () => {
    const result = parseStatsData({})
    expect(result).toEqual({ streak: 0 })
  })

  it('returns zero streak for invalid JSON', () => {
    const result = parseStatsData({ 'stats-storage': 'invalid' })
    expect(result).toEqual({ streak: 0 })
  })

  it('parses valid stats data', () => {
    const result = parseStatsData({
      'stats-storage': JSON.stringify({
        state: { stats: { currentStreak: 7 } }
      })
    })
    expect(result).toEqual({ streak: 7 })
  })

  it('handles missing currentStreak', () => {
    const result = parseStatsData({
      'stats-storage': JSON.stringify({ state: { stats: {} } })
    })
    expect(result).toEqual({ streak: 0 })
  })
})

describe('getDueCards', () => {
  it('returns empty array for empty input', () => {
    const result = getDueCards([])
    expect(result).toEqual([])
  })

  it('filters cards due for review', () => {
    const now = Date.now()
    const flashcards: Array<[string, { nextReview: number }]> = [
      ['1', { nextReview: now - 1000 }], // due (past)
      ['2', { nextReview: now + 100000 }], // not due (future)
      ['3', { nextReview: now - 50000 }] // due (past)
    ]
    const result = getDueCards(flashcards)
    expect(result).toHaveLength(2)
    expect(result.map(([id]) => id)).toEqual(['1', '3'])
  })

  it('includes cards due at exactly now', () => {
    const now = Date.now()
    const flashcards: Array<[string, { nextReview: number }]> = [
      ['1', { nextReview: now }]
    ]
    const result = getDueCards(flashcards)
    expect(result).toHaveLength(1)
  })
})

describe('getRandomWordPreview', () => {
  const words: NotificationData['words'] = [
    { id: '1', word: 'apple', definition: 'a fruit', vietnameseTranslation: 'quả táo' },
    { id: '2', word: 'banana', definition: 'yellow fruit' },
    { id: '3', word: 'cherry', definition: 'red fruit', vietnameseTranslation: 'quả anh đào' }
  ]

  it('returns undefined for empty words array', () => {
    const result = getRandomWordPreview([], [])
    expect(result).toBeUndefined()
  })

  it('returns word preview from due cards when available', () => {
    const dueCards: NotificationData['dueCards'] = [['1', { nextReview: 0 }]]
    const result = getRandomWordPreview(words, dueCards)

    // Should return the due card's word
    expect(result).toBeDefined()
    expect(result?.word).toBe('apple')
    expect(result?.definition).toBe('a fruit')
    expect(result?.translation).toBe('quả táo')
  })

  it('falls back to random word when no due cards', () => {
    const result = getRandomWordPreview(words, [])
    expect(result).toBeDefined()
    expect(['apple', 'banana', 'cherry']).toContain(result?.word)
  })

  it('handles word without translation', () => {
    const dueCards: NotificationData['dueCards'] = [['2', { nextReview: 0 }]]
    const result = getRandomWordPreview(words, dueCards)

    expect(result).toBeDefined()
    expect(result?.word).toBe('banana')
    expect(result?.translation).toBeUndefined()
  })

  it('falls back to random word when due card not found in words', () => {
    const dueCards: NotificationData['dueCards'] = [['999', { nextReview: 0 }]]
    const result = getRandomWordPreview(words, dueCards)

    // Should fall back to random word since id '999' doesn't exist
    expect(result).toBeDefined()
    expect(['apple', 'banana', 'cherry']).toContain(result?.word)
  })
})
