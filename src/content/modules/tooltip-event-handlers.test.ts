/* global Element */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as handlersModule from './tooltip-event-handlers'
import {
  initEventHandlers,
  setupCloseButtonHandler,
  setupEscapeKeyHandler
} from './tooltip-event-handlers'

let mockTooltip: HTMLDivElement
let removeSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockTooltip = document.createElement('div')
  mockTooltip.id = 'vocabulary-tooltip'
  mockTooltip.innerHTML = `<button class="vocab-close-btn" aria-label="Close"></button>`
  document.body.appendChild(mockTooltip)
  removeSpy = vi.fn()
  const noop = (() => {}) as (...args: unknown[]) => void
  initEventHandlers(
    () => mockTooltip,
    removeSpy as unknown as () => void,
    noop as unknown as (text: string, isPhrase: boolean) => void,
    noop as unknown as Parameters<typeof initEventHandlers>[3]
  )
})

afterEach(() => {
  mockTooltip.remove()
})

describe('setupCloseButtonHandler', () => {
  it('calls removeTooltip when the close button is clicked', () => {
    const cleanup = setupCloseButtonHandler()
    const btn = mockTooltip.querySelector('.vocab-close-btn') as HTMLButtonElement
    btn.click()
    expect(removeSpy).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('cleanup detaches the click listener', () => {
    const cleanup = setupCloseButtonHandler()
    cleanup()
    const btn = mockTooltip.querySelector('.vocab-close-btn') as HTMLButtonElement
    btn.click()
    expect(removeSpy).not.toHaveBeenCalled()
  })

  it('returns a no-op cleanup when no close button exists', () => {
    mockTooltip.innerHTML = ''
    const cleanup = setupCloseButtonHandler()
    expect(typeof cleanup).toBe('function')
    cleanup()
    expect(removeSpy).not.toHaveBeenCalled()
  })

  it('still fires after the tooltip innerHTML is replaced (regression)', () => {
    const cleanup = setupCloseButtonHandler()
    // Simulate content update path (loading -> loaded) re-rendering inner HTML
    mockTooltip.innerHTML = `<div><button class="vocab-close-btn" aria-label="Close"></button></div>`
    const newBtn = mockTooltip.querySelector('.vocab-close-btn') as HTMLButtonElement
    newBtn.click()
    expect(removeSpy).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('fires when the click target is a child of the close button (e.g. inner SVG)', () => {
    mockTooltip.innerHTML = `<button class="vocab-close-btn" aria-label="Close"><svg><line/></svg></button>`
    const cleanup = setupCloseButtonHandler()
    const svgChild = mockTooltip.querySelector('line') as Element
    svgChild.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(removeSpy).toHaveBeenCalledTimes(1)
    cleanup()
  })
})

describe('setupEscapeKeyHandler', () => {
  it('calls removeTooltip when Escape is pressed', () => {
    const cleanup = setupEscapeKeyHandler()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(removeSpy).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('ignores non-Escape keys', () => {
    const cleanup = setupEscapeKeyHandler()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    expect(removeSpy).not.toHaveBeenCalled()
    cleanup()
  })

  it('cleanup detaches the document listener', () => {
    const cleanup = setupEscapeKeyHandler()
    cleanup()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(removeSpy).not.toHaveBeenCalled()
  })
})

describe('chrome-layer close button (Option A architecture)', () => {
  it('remains hittable after `.vocab-tooltip-content.outerHTML` replace', () => {
    // Simulate the new architecture: X is a sibling of .vocab-tooltip-content,
    // not a descendant. Content updates replace .vocab-tooltip-content.outerHTML
    // and the X must persist.
    mockTooltip.innerHTML = `
      <button class="vocab-close-btn" aria-label="Close"></button>
      <div class="vocab-tooltip-content">old content</div>
    `
    const cleanup = setupCloseButtonHandler()

    // Simulate content swap (loading -> loaded path)
    const contentEl = mockTooltip.querySelector('.vocab-tooltip-content') as HTMLElement
    contentEl.outerHTML = `<div class="vocab-tooltip-content">new content</div>`

    // X must still be present and still close the tooltip
    const stillThere = mockTooltip.querySelector('.vocab-close-btn') as HTMLButtonElement
    expect(stillThere).not.toBeNull()
    stillThere.click()
    expect(removeSpy).toHaveBeenCalledTimes(1)
    cleanup()
  })
})

describe('outside-click regression', () => {
  it('does not export setupOutsideClickHandler anymore', () => {
    expect((handlersModule as Record<string, unknown>).setupOutsideClickHandler).toBeUndefined()
  })

  it('clicking outside the tooltip does not close it', () => {
    setupCloseButtonHandler()
    setupEscapeKeyHandler()
    const outside = document.createElement('div')
    document.body.appendChild(outside)
    outside.click()
    expect(removeSpy).not.toHaveBeenCalled()
    outside.remove()
  })
})
