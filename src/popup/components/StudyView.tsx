import { useState, useEffect } from 'react'
import { useVocabularyStore, useStatsStore, useUIStore } from '@/shared/store'
import { calculateNextReview, calculateReviewPoints, type Quality } from '@/shared/spaced-repetition'
import { playPronunciation } from '@/shared/tts'
import type { Word, FlashcardData } from '@/types'

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

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleRating = (quality: Quality) => {
    if (!dueCards[currentIndex] || !currentWord) return

    const card = dueCards[currentIndex]
    const result = calculateNextReview(card, quality)

    // Update flashcard in store
    updateFlashcard(card.wordId, {
      ...result,
      quality
    })

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

    // Move to next card
    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
      const nextWord = getWordById(dueCards[currentIndex + 1].wordId)
      setCurrentWord(nextWord || null)
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
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-800 mb-2">All caught up!</h3>
        <p className="text-sm text-gray-500 mb-4">
          {words.length === 0
            ? 'Add words to start studying'
            : 'No cards due for review right now'}
        </p>
        <button
          onClick={() => setActiveTab('vocabulary')}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          Browse Vocabulary
        </button>
      </div>
    )
  }

  // Session complete
  if (sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-800 mb-2">Session Complete!</h3>
        <p className="text-sm text-gray-500 mb-4">
          You reviewed {dueCards.length} card{dueCards.length > 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Progress header */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>{currentIndex + 1} / {dueCards.length}</span>
        </div>
        <div className="flex items-center gap-1 text-streak-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">+{stats.currentStreak} streak</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / dueCards.length) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      {currentWord && (
        <div
          className="flip-card cursor-pointer"
          onClick={handleFlip}
        >
          <div className={`flip-card-inner relative h-56 ${isFlipped ? 'flipped' : ''}`}>
            {/* Front */}
            <div className="flip-card-front absolute inset-0 bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col items-center justify-center backface-hidden">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentWord.word}</h2>
              {currentWord.pronunciation && (
                <span className="text-gray-500 text-sm mb-3">{currentWord.pronunciation}</span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlayAudio()
                }}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-primary-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
              {currentWord.partOfSpeech && (
                <span className="mt-3 px-3 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                  {currentWord.partOfSpeech}
                </span>
              )}
              <p className="text-xs text-gray-400 mt-4">Tap to reveal answer</p>
            </div>

            {/* Back */}
            <div className="flip-card-back absolute inset-0 bg-white rounded-xl shadow-md border border-gray-100 p-6 overflow-y-auto backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
              <p className="text-gray-800 mb-3">{currentWord.definition}</p>
              {currentWord.vietnameseTranslation && (
                <div className="bg-amber-50 p-3 rounded-lg mb-3">
                  <span className="text-xs text-amber-700 font-medium">Tiếng Việt</span>
                  <p className="text-amber-900">{currentWord.vietnameseTranslation}</p>
                </div>
              )}
              {currentWord.examples?.[0] && (
                <p className="text-sm text-gray-500 italic border-l-2 border-gray-200 pl-3">
                  "{currentWord.examples[0]}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rating prompt */}
      <p className="text-center text-sm text-gray-500">How well did you know this?</p>

      {/* Rating buttons */}
      <div className="grid grid-cols-3 gap-2">
        <RatingButton quality={1} label="Hard" sublabel="< 1 min" color="error" onClick={handleRating} />
        <RatingButton quality={3} label="Good" sublabel="10 min" color="success" onClick={handleRating} />
        <RatingButton quality={5} label="Easy" sublabel="4 days" color="primary" onClick={handleRating} />
      </div>
    </div>
  )
}

interface RatingButtonProps {
  quality: Quality
  label: string
  sublabel: string
  color: 'error' | 'success' | 'primary'
  onClick: (quality: Quality) => void
}

function RatingButton({ quality, label, sublabel, color, onClick }: RatingButtonProps) {
  const colorClasses = {
    error: 'bg-error-50 text-error-600 hover:bg-error-100',
    success: 'bg-success-50 text-success-600 hover:bg-success-100',
    primary: 'bg-primary-50 text-primary-600 hover:bg-primary-100'
  }

  return (
    <button
      onClick={() => onClick(quality)}
      className={`p-3 rounded-xl transition-colors ${colorClasses[color]}`}
    >
      <div className="font-medium">{label}</div>
      <div className="text-xs opacity-75">{sublabel}</div>
    </button>
  )
}
