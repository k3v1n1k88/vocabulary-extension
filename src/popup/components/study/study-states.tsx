/**
 * Study session state components.
 * Empty state and completion state UI.
 */

interface StudyEmptyStateProps {
  hasWords: boolean
  onBrowseVocabulary: () => void
}

/**
 * Shown when no cards are due for review.
 */
export function StudyEmptyState({ hasWords, onBrowseVocabulary }: StudyEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="font-semibold text-gray-800 mb-2">All caught up!</h3>
      <p className="text-sm text-gray-500 mb-4">
        {hasWords ? 'No cards due for review right now' : 'Add words to start studying'}
      </p>
      <button
        onClick={onBrowseVocabulary}
        className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
      >
        Browse Vocabulary
      </button>
    </div>
  )
}

interface SessionCompleteProps {
  cardsReviewed: number
  onBackToDashboard: () => void
}

/**
 * Shown when study session is complete.
 */
export function SessionComplete({ cardsReviewed, onBackToDashboard }: SessionCompleteProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="font-semibold text-gray-800 mb-2">Session Complete!</h3>
      <p className="text-sm text-gray-500 mb-4">
        You reviewed {cardsReviewed} card{cardsReviewed > 1 ? 's' : ''}
      </p>
      <button
        onClick={onBackToDashboard}
        className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  )
}
