import type { FlashcardData } from '@/types'

/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Quality grades:
 * 1 = Complete blackout, no recall
 * 2 = Incorrect response, but upon seeing correct answer, felt familiar
 * 3 = Correct response with serious difficulty
 * 4 = Correct response after hesitation
 * 5 = Perfect response
 */

export type Quality = 1 | 2 | 3 | 4 | 5

export interface ReviewResult {
  repetitions: number
  easinessFactor: number
  interval: number
  nextReview: number
}

/**
 * Calculate next review using SM-2 algorithm
 */
export function calculateNextReview(
  card: FlashcardData,
  quality: Quality
): ReviewResult {
  // Runtime validation: clamp quality to valid range 1-5
  const validQuality = Math.max(1, Math.min(5, Math.round(quality))) as Quality

  let { repetitions, easinessFactor, interval } = card

  // Quality < 3 means failure - reset
  if (validQuality < 3) {
    repetitions = 0
    interval = 1
  } else {
    // Calculate new interval
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easinessFactor)
    }

    // Increment repetitions for successful recall
    repetitions++

    // Update easiness factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easinessFactor =
      easinessFactor + (0.1 - (5 - validQuality) * (0.08 + (5 - validQuality) * 0.02))

    // EF should not fall below 1.3
    easinessFactor = Math.max(1.3, easinessFactor)
  }

  // Calculate next review timestamp
  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000

  return {
    repetitions,
    easinessFactor,
    interval,
    nextReview
  }
}

/**
 * Get human-readable interval description
 */
export function getIntervalDescription(interval: number): string {
  if (interval < 1) {
    return '< 1 min'
  } else if (interval === 1) {
    return '1 day'
  } else if (interval < 7) {
    return `${interval} days`
  } else if (interval < 30) {
    const weeks = Math.round(interval / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''}`
  } else if (interval < 365) {
    const months = Math.round(interval / 30)
    return `${months} month${months > 1 ? 's' : ''}`
  } else {
    const years = Math.round(interval / 365)
    return `${years} year${years > 1 ? 's' : ''}`
  }
}

/**
 * Calculate predicted intervals for each quality level
 * Used for showing "Hard: < 1 min", "Good: 10 min", "Easy: 4 days" buttons
 */
export function getPredictedIntervals(card: FlashcardData): Record<Quality, string> {
  const predictions: Record<Quality, string> = {
    1: '< 1 min',
    2: '< 1 min',
    3: '1 day',
    4: '10 min',
    5: '4 days'
  }

  // Calculate actual predictions based on card state
  for (const q of [1, 2, 3, 4, 5] as Quality[]) {
    const result = calculateNextReview(card, q)
    predictions[q] = getIntervalDescription(result.interval)
  }

  return predictions
}

/**
 * Calculate points earned for a review
 * Better quality = more points
 * Streak multiplier applied
 */
export function calculateReviewPoints(quality: Quality, streak: number): number {
  const basePoints: Record<Quality, number> = {
    1: 1,
    2: 2,
    3: 3,
    4: 5,
    5: 7
  }

  const points = basePoints[quality]
  const streakMultiplier = Math.min(1 + streak * 0.1, 2) // Max 2x multiplier

  return Math.round(points * streakMultiplier)
}

/**
 * Check if a card is considered "learned"
 * A card is learned when it has been reviewed successfully 3+ times
 * and has an interval of at least 21 days
 */
export function isCardLearned(card: FlashcardData): boolean {
  return card.repetitions >= 3 && card.interval >= 21
}
