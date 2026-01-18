/**
 * Study Progress Components.
 * Header showing progress and streak, navigation buttons.
 */

interface StudyProgressHeaderProps {
  currentIndex: number
  totalCards: number
  streak: number
}

/**
 * Progress header showing card count and streak.
 */
export function StudyProgressHeader({ currentIndex, totalCards, streak }: StudyProgressHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>{currentIndex + 1} / {totalCards}</span>
        </div>
        <div className="flex items-center gap-1 text-streak-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">+{streak} streak</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
        />
      </div>
    </>
  )
}

interface StudyNavigationProps {
  currentIndex: number
  totalCards: number
  onBack: () => void
  onSkip: () => void
}

/**
 * Back/Skip navigation buttons.
 */
export function StudyNavigation({ currentIndex, totalCards, onBack, onSkip }: StudyNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onBack}
        disabled={currentIndex === 0}
        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <p className="text-sm text-gray-500">How well did you know this?</p>

      <button
        onClick={onSkip}
        disabled={currentIndex >= totalCards - 1}
        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Skip
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
