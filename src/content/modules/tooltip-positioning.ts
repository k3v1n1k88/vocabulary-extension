/* global DOMRect, requestAnimationFrame */
/**
 * Tooltip Positioning Module
 * Handles tooltip position calculation and viewport adjustments.
 */

import { getSavedTooltipPosition } from './floating-menu'

export interface TooltipPosition {
  left: number
  top: number
}

export interface PositionResult {
  position: TooltipPosition
  selectionRect: DOMRect | null
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
 * Returns the position AND the source selection rect (when sourced from a live
 * selection) so the caller can flip the tooltip above the selection if needed.
 */
export function calculateTooltipPosition(): PositionResult {
  // Try saved position first (from floating menu) — no selection rect available
  const savedPosition = getSavedTooltipPosition()
  if (savedPosition) {
    return {
      position: { left: savedPosition.left, top: savedPosition.top },
      selectionRect: null
    }
  }

  // Try current text selection
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const rect = selection.getRangeAt(0).getBoundingClientRect()
    return {
      position: {
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY + 10
      },
      selectionRect: rect
    }
  }

  // Fallback: center of viewport — no selection rect
  return {
    position: {
      left: window.innerWidth / 2 - 200,
      top: window.innerHeight / 3 + window.scrollY
    },
    selectionRect: null
  }
}

/**
 * Adjust position to keep tooltip within viewport horizontally.
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
 * Adjust top position so the tooltip stays within the viewport vertically.
 * If the tooltip overflows below, try flipping above the selection rect.
 * If neither side fits, clamp to the top of the visible viewport.
 */
export function adjustForViewportVertical(
  position: TooltipPosition,
  tooltipHeight: number,
  selectionRect: DOMRect | null,
  margin = 10
): TooltipPosition {
  const viewportBottom = window.scrollY + window.innerHeight - margin

  // Fits below — no change
  if (position.top + tooltipHeight <= viewportBottom) {
    return position
  }

  // Try flipping above the selection — must fit BOTH above the selection's
  // top edge AND within the viewport (a selection scrolled far below the
  // viewport could otherwise produce an off-screen flippedTop).
  if (selectionRect) {
    const flippedTop = selectionRect.top + window.scrollY - tooltipHeight - margin
    const fitsAbove = flippedTop >= window.scrollY + margin
    const fitsInViewport = flippedTop + tooltipHeight <= viewportBottom
    if (fitsAbove && fitsInViewport) {
      return { left: position.left, top: flippedTop }
    }
  }

  // Clamp to top of viewport — max-height CSS keeps it bounded
  return { left: position.left, top: window.scrollY + margin }
}

/**
 * Get final tooltip position with horizontal adjustment applied.
 * Vertical adjustment must run AFTER mount once tooltip height is known.
 */
export function getFinalTooltipPosition(isTranslation: boolean = false): PositionResult {
  const { position, selectionRect } = calculateTooltipPosition()
  const maxWidth = getMaxTooltipWidth(isTranslation)
  return {
    position: adjustForViewport(position, maxWidth),
    selectionRect
  }
}

/**
 * After the tooltip is mounted, measure its rendered height in the next
 * animation frame and apply vertical adjustment if it overflows the viewport.
 */
export function measureAndAdjustVertical(el: HTMLElement, selectionRect: DOMRect | null): void {
  requestAnimationFrame(() => {
    if (!el.isConnected) return
    const height = el.getBoundingClientRect().height
    const currentTop = parseFloat(el.style.top) || 0
    const adjusted = adjustForViewportVertical(
      { left: parseFloat(el.style.left) || 0, top: currentTop },
      height,
      selectionRect
    )
    if (adjusted.top !== currentTop) {
      el.style.top = `${adjusted.top}px`
    }
  })
}
