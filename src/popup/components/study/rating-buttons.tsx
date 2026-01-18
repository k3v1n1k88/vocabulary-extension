/**
 * Rating Buttons Component.
 * Quality rating buttons for spaced repetition review.
 */

import type { Quality } from '@/shared/spaced-repetition'

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

interface RatingButtonsProps {
  onRate: (quality: Quality) => void
}

/**
 * Grid of rating buttons for study session.
 */
export function RatingButtons({ onRate }: RatingButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <RatingButton quality={1} label="Hard" sublabel="< 1 min" color="error" onClick={onRate} />
      <RatingButton quality={3} label="Good" sublabel="10 min" color="success" onClick={onRate} />
      <RatingButton quality={5} label="Easy" sublabel="4 days" color="primary" onClick={onRate} />
    </div>
  )
}
