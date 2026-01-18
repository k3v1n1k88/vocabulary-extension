/**
 * Tooltip Positioning Module
 * Handles tooltip position calculation and viewport adjustments.
 */

import { getSavedTooltipPosition } from './floating-menu'

export interface TooltipPosition {
  left: number
  top: number
}

/**
 * Get the maximum tooltip width based on viewport size.
 * Responsive: wider on large screens.
 */
export function getMaxTooltipWidth(isTranslation: boolean = false): number {
  if (isTranslation) {
    return window.innerWidth >= 1200 ? 600 : 520
  }
  return window.innerWidth >= 1200 ? 500 : 450
}

/**
 * Calculate tooltip position.
 * Priority: saved position > selection position > viewport center fallback.
 */
export function calculateTooltipPosition(): TooltipPosition {
  // Try saved position first (from floating menu)
  const savedPosition = getSavedTooltipPosition()
  if (savedPosition) {
    return { left: savedPosition.left, top: savedPosition.top }
  }

  // Try current text selection
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const rect = selection.getRangeAt(0).getBoundingClientRect()
    return {
      left: rect.left + window.scrollX,
      top: rect.bottom + window.scrollY + 10
    }
  }

  // Fallback: center of viewport
  return {
    left: window.innerWidth / 2 - 200,
    top: window.innerHeight / 3 + window.scrollY
  }
}

/**
 * Adjust position to keep tooltip within viewport.
 */
export function adjustForViewport(position: TooltipPosition, maxWidth: number): TooltipPosition {
  let { left, top } = position

  // Prevent overflow on right side
  if (left + maxWidth > window.innerWidth) {
    left = Math.max(10, window.innerWidth - maxWidth - 20)
  }

  // Prevent overflow on left side
  if (left < 10) {
    left = 10
  }

  return { left, top }
}

/**
 * Get final tooltip position with all adjustments applied.
 */
export function getFinalTooltipPosition(isTranslation: boolean = false): TooltipPosition {
  const position = calculateTooltipPosition()
  const maxWidth = getMaxTooltipWidth(isTranslation)
  return adjustForViewport(position, maxWidth)
}
