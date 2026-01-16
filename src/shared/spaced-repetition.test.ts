import { describe, it, expect } from 'vitest'
import {
  calculateNextReview,
  getIntervalDescription,
  getPredictedIntervals,
  calculateReviewPoints,
  isCardLearned,
  type Quality
} from './spaced-repetition'
import type { FlashcardData } from '@/types'

// Helper to create test flashcard
const createCard = (overrides: Partial<FlashcardData> = {}): FlashcardData => ({
  wordId: 'test-id',
  repetitions: 0,
  easinessFactor: 2.5,
  interval: 1,
  nextReview: Date.now(),
  ...overrides
})

describe('calculateNextReview', () => {
  describe('quality < 3 (failure)', () => {
    it('resets repetitions and interval on complete blackout (quality 1)', () => {
      const card = createCard({ repetitions: 3, interval: 10 })
      const result = calculateNextReview(card, 1)

      expect(result.repetitions).toBe(0)
      expect(result.interval).toBe(1)
    })

    it('resets on incorrect response (quality 2)', () => {
      const card = createCard({ repetitions: 5, interval: 30, easinessFactor: 2.8 })
      const result = calculateNextReview(card, 2)

      expect(result.repetitions).toBe(0)
      expect(result.interval).toBe(1)
    })
  })

  describe('quality >= 3 (success)', () => {
    it('sets interval to 1 for first successful review', () => {
      const card = createCard({ repetitions: 0 })
      const result = calculateNextReview(card, 3)

      expect(result.repetitions).toBe(1)
      expect(result.interval).toBe(1)
    })

    it('sets interval to 6 for second successful review', () => {
      const card = createCard({ repetitions: 1, interval: 1 })
      const result = calculateNextReview(card, 4)

      expect(result.repetitions).toBe(2)
      expect(result.interval).toBe(6)
    })

    it('multiplies interval by EF for subsequent reviews', () => {
      const card = createCard({ repetitions: 2, interval: 6, easinessFactor: 2.5 })
      const result = calculateNextReview(card, 5)

      expect(result.repetitions).toBe(3)
      expect(result.interval).toBe(15) // 6 * 2.5 = 15
    })
  })

  describe('easiness factor adjustments', () => {
    it('increases EF for perfect response (quality 5)', () => {
      const card = createCard({ easinessFactor: 2.5 })
      const result = calculateNextReview(card, 5)

      expect(result.easinessFactor).toBeGreaterThan(2.5)
    })

    it('decreases EF for difficult response (quality 3)', () => {
      const card = createCard({ easinessFactor: 2.5 })
      const result = calculateNextReview(card, 3)

      expect(result.easinessFactor).toBeLessThan(2.5)
    })

    it('never drops EF below 1.3', () => {
      const card = createCard({ easinessFactor: 1.3, repetitions: 5, interval: 10 })
      const result = calculateNextReview(card, 3)

      expect(result.easinessFactor).toBeGreaterThanOrEqual(1.3)
    })
  })

  describe('edge cases', () => {
    it('handles missing/corrupted card data with safe defaults', () => {
      const corruptedCard = { wordId: 'test' } as FlashcardData
      const result = calculateNextReview(corruptedCard, 4)

      expect(result.repetitions).toBeGreaterThanOrEqual(0)
      expect(result.easinessFactor).toBeGreaterThanOrEqual(1.3)
      expect(result.interval).toBeGreaterThanOrEqual(1)
    })

    it('clamps quality to valid range 1-5', () => {
      const card = createCard()
      // Pass invalid quality (should be clamped)
      const result = calculateNextReview(card, 10 as Quality)

      // Should behave like quality 5
      expect(result.repetitions).toBe(1)
    })

    it('caps interval at 3650 days (~10 years)', () => {
      const card = createCard({
        repetitions: 100,
        interval: 2000,
        easinessFactor: 2.5
      })
      const result = calculateNextReview(card, 5)

      expect(result.interval).toBeLessThanOrEqual(3650)
    })
  })

  describe('nextReview timestamp', () => {
    it('sets nextReview to future timestamp', () => {
      const now = Date.now()
      const card = createCard()
      const result = calculateNextReview(card, 4)

      expect(result.nextReview).toBeGreaterThan(now)
    })

    it('nextReview is interval days in the future', () => {
      const card = createCard({ repetitions: 2, interval: 6, easinessFactor: 2.5 })
      const result = calculateNextReview(card, 5)

      const expectedMs = result.interval * 24 * 60 * 60 * 1000
      const actualMs = result.nextReview - Date.now()

      // Allow 1 second tolerance for timing
      expect(actualMs).toBeCloseTo(expectedMs, -3)
    })
  })
})

describe('getIntervalDescription', () => {
  it('returns "< 1 min" for interval < 1', () => {
    expect(getIntervalDescription(0)).toBe('< 1 min')
    expect(getIntervalDescription(0.5)).toBe('< 1 min')
  })

  it('returns "1 day" for interval of 1', () => {
    expect(getIntervalDescription(1)).toBe('1 day')
  })

  it('returns days for interval 2-6', () => {
    expect(getIntervalDescription(3)).toBe('3 days')
    expect(getIntervalDescription(6)).toBe('6 days')
  })

  it('returns weeks for interval 7-29', () => {
    expect(getIntervalDescription(7)).toBe('1 week')
    expect(getIntervalDescription(14)).toBe('2 weeks')
    expect(getIntervalDescription(21)).toBe('3 weeks')
  })

  it('returns months for interval 30-364', () => {
    expect(getIntervalDescription(30)).toBe('1 month')
    expect(getIntervalDescription(60)).toBe('2 months')
    expect(getIntervalDescription(180)).toBe('6 months')
  })

  it('returns years for interval >= 365', () => {
    expect(getIntervalDescription(365)).toBe('1 year')
    expect(getIntervalDescription(730)).toBe('2 years')
  })
})

describe('getPredictedIntervals', () => {
  it('returns predictions for all quality levels', () => {
    const card = createCard()
    const predictions = getPredictedIntervals(card)

    expect(predictions).toHaveProperty('1')
    expect(predictions).toHaveProperty('2')
    expect(predictions).toHaveProperty('3')
    expect(predictions).toHaveProperty('4')
    expect(predictions).toHaveProperty('5')
  })

  it('returns string descriptions', () => {
    const card = createCard()
    const predictions = getPredictedIntervals(card)

    Object.values(predictions).forEach((prediction) => {
      expect(typeof prediction).toBe('string')
    })
  })
})

describe('calculateReviewPoints', () => {
  it('awards more points for higher quality', () => {
    const streak = 0

    expect(calculateReviewPoints(1, streak)).toBeLessThan(calculateReviewPoints(3, streak))
    expect(calculateReviewPoints(3, streak)).toBeLessThan(calculateReviewPoints(5, streak))
  })

  it('applies streak multiplier', () => {
    const quality: Quality = 5

    const pointsNoStreak = calculateReviewPoints(quality, 0)
    const pointsWithStreak = calculateReviewPoints(quality, 5)

    expect(pointsWithStreak).toBeGreaterThan(pointsNoStreak)
  })

  it('caps streak multiplier at 2x', () => {
    const quality: Quality = 5

    const pointsMaxStreak = calculateReviewPoints(quality, 100)
    const pointsOverMaxStreak = calculateReviewPoints(quality, 1000)

    expect(pointsMaxStreak).toBe(pointsOverMaxStreak)
  })

  it('returns integer points', () => {
    for (const q of [1, 2, 3, 4, 5] as Quality[]) {
      for (const s of [0, 1, 5, 10]) {
        const points = calculateReviewPoints(q, s)
        expect(Number.isInteger(points)).toBe(true)
      }
    }
  })
})

describe('isCardLearned', () => {
  it('returns false for new card', () => {
    const card = createCard({ repetitions: 0, interval: 1 })
    expect(isCardLearned(card)).toBe(false)
  })

  it('returns false for card with high reps but low interval', () => {
    const card = createCard({ repetitions: 5, interval: 10 })
    expect(isCardLearned(card)).toBe(false)
  })

  it('returns false for card with high interval but low reps', () => {
    const card = createCard({ repetitions: 2, interval: 30 })
    expect(isCardLearned(card)).toBe(false)
  })

  it('returns true for card with reps >= 3 and interval >= 21', () => {
    const card = createCard({ repetitions: 3, interval: 21 })
    expect(isCardLearned(card)).toBe(true)
  })

  it('returns true for well-learned card', () => {
    const card = createCard({ repetitions: 10, interval: 60 })
    expect(isCardLearned(card)).toBe(true)
  })
})
