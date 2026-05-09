/* global DOMRect */
import { describe, it, expect, beforeEach } from 'vitest'
import { adjustForViewportVertical } from './tooltip-positioning'

const setViewport = (innerHeight: number, scrollY: number): void => {
  Object.defineProperty(window, 'innerHeight', { value: innerHeight, writable: true })
  Object.defineProperty(window, 'scrollY', { value: scrollY, writable: true })
}

const mockRect = (overrides: Partial<DOMRect> = {}): DOMRect => ({
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  toJSON: () => ({}),
  ...overrides
}) as DOMRect

describe('adjustForViewportVertical', () => {
  beforeEach(() => {
    setViewport(800, 0)
  })

  it('returns position unchanged when tooltip fits below selection', () => {
    const position = { left: 100, top: 100 }
    const selectionRect = mockRect({ top: 50 })
    const result = adjustForViewportVertical(position, 200, selectionRect)
    expect(result).toEqual(position)
  })

  it('flips above selection when tooltip overflows below but fits above', () => {
    const position = { left: 100, top: 700 }
    const selectionRect = mockRect({ top: 680 })
    const result = adjustForViewportVertical(position, 200, selectionRect)
    expect(result).toEqual({ left: 100, top: 680 - 200 - 10 })
  })

  it('clamps to viewport top when neither below nor above fits', () => {
    const position = { left: 100, top: 700 }
    const selectionRect = mockRect({ top: 100 })
    const result = adjustForViewportVertical(position, 900, selectionRect)
    expect(result).toEqual({ left: 100, top: 10 })
  })

  it('clamps without flipping when selectionRect is null', () => {
    const position = { left: 100, top: 700 }
    const result = adjustForViewportVertical(position, 200, null)
    expect(result).toEqual({ left: 100, top: 10 })
  })

  it('honors a non-zero scrollY when clamping', () => {
    setViewport(800, 500)
    const position = { left: 100, top: 1300 }
    const result = adjustForViewportVertical(position, 200, null)
    expect(result).toEqual({ left: 100, top: 510 })
  })

  it('clamps when selection is below viewport (flip would land off-screen)', () => {
    // viewport 0..790, selection at top=2000 (way below view).
    // naive flip: 2000 - 200 - 10 = 1790, which is below viewportBottom=790.
    // Must clamp to scrollY + margin = 10.
    setViewport(800, 0)
    const position = { left: 100, top: 700 }
    const selectionRect = mockRect({ top: 2000 })
    const result = adjustForViewportVertical(position, 200, selectionRect)
    expect(result).toEqual({ left: 100, top: 10 })
  })
})
