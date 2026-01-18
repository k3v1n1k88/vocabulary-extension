import { useState, useEffect } from 'react'
import { useVocabularyStore, useStatsStore, useUIStore } from '@/shared/store'
import { calculateNextReview, calculateReviewPoints, type Quality } from '@/shared/spaced-repetition'
import { playPronunciation } from '@/shared/tts'
import type { Word, FlashcardData } from '@/types'
import {
  StudyEmptyState,
  SessionComplete,
  Flashcard,
  StudyProgressHeader,
  StudyNavigation,
  RatingButtons
} from './study'

export default function StudyView() {
  const { words, getDueCards, updateFlashcard, getWordById } = useVocabularyStore()
  const { stats, incrementStreak, addXP, updateStats } = useStatsStore()
  const { setActiveTab } = useUIStore()

  const [dueCards, setDueCards] = useState<FlashcardData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [currentWord, setCurrentWord] = useState<Word | null>(null)

  useEffect(() => {
    const cards = getDueCards()
    setDueCards(cards)
    if (cards.length > 0) {
      const word = getWordById(cards[0].wordId)
      setCurrentWord(word || null)
    }
  }, [getDueCards, getWordById])

  const navigateToCard = (index: number) => {
    setCurrentIndex(index)
    setIsFlipped(false)
    const word = getWordById(dueCards[index].wordId)
    setCurrentWord(word || null)
  }

  const handleRating = (quality: Quality) => {
    if (!dueCards[currentIndex] || !currentWord) return

    const card = dueCards[currentIndex]
    const result = calculateNextReview(card, quality)

    // Update flashcard in store
    updateFlashcard(card.wordId, { ...result, quality })

    // Update stats
    const points = calculateReviewPoints(quality, stats.currentStreak)
    addXP(points)
    incrementStreak()
    updateStats({
      totalReviews: stats.totalReviews + 1,
      accuracy: quality >= 3
        ? Math.round(((stats.accuracy * stats.totalReviews) + 100) / (stats.totalReviews + 1))
        : Math.round(((stats.accuracy * stats.totalReviews)) / (stats.totalReviews + 1))
    })

    // Move to next card or complete session
    if (currentIndex < dueCards.length - 1) {
      navigateToCard(currentIndex + 1)
    } else {
      setSessionComplete(true)
    }
  }

  const handlePlayAudio = () => {
    if (currentWord) {
      playPronunciation(currentWord.word, currentWord.audioUrl)
    }
  }

  // No cards to review
  if (dueCards.length === 0 || words.length === 0) {
    return (
      <StudyEmptyState
        hasWords={words.length > 0}
        onBrowseVocabulary={() => setActiveTab('vocabulary')}
      />
    )
  }

  // Session complete
  if (sessionComplete) {
    return (
      <SessionComplete
        cardsReviewed={dueCards.length}
        onBackToDashboard={() => setActiveTab('dashboard')}
      />
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <StudyProgressHeader
        currentIndex={currentIndex}
        totalCards={dueCards.length}
        streak={stats.currentStreak}
      />

      {currentWord && (
        <Flashcard
          word={currentWord}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped(!isFlipped)}
          onPlayAudio={handlePlayAudio}
        />
      )}

      <StudyNavigation
        currentIndex={currentIndex}
        totalCards={dueCards.length}
        onBack={() => currentIndex > 0 && navigateToCard(currentIndex - 1)}
        onSkip={() => currentIndex < dueCards.length - 1 && navigateToCard(currentIndex + 1)}
      />

      <RatingButtons onRate={handleRating} />
    </div>
  )
}
