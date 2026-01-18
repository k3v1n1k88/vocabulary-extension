/* global Text, NodeFilter, HTMLSpanElement, Element */
/**
 * Highlight Renderer Module
 * Handles DOM manipulation for creating and restoring text highlights.
 */

import type { TextHighlight } from '@/types'
import {
  generateHighlightId,
  getXPath,
  getNodeByXPath,
  getCurrentUrl,
  saveHighlight,
  getHighlightsForPage,
  deleteHighlight
} from './highlight-storage'

const HIGHLIGHT_CLASS = 'vocab-text-highlight'
const HIGHLIGHT_DATA_ATTR = 'data-highlight-id'

/**
 * Create highlight from a Range object (used when selection may be cleared).
 */
export async function highlightRange(
  range: Range,
  color: string
): Promise<TextHighlight | null> {
  if (!range) return null

  const selectedText = range.toString().trim()
  if (!selectedText) return null

  // Get the text node and offset
  const startContainer = range.startContainer
  if (startContainer.nodeType !== Node.TEXT_NODE) {
    console.warn('[VocabExt] Cannot highlight: range start is not a text node')
    return null
  }

  const xpath = getXPath(startContainer)
  const textOffset = range.startOffset

  // Create highlight data
  const highlight: TextHighlight = {
    id: generateHighlightId(),
    text: selectedText,
    url: getCurrentUrl(),
    xpath,
    textOffset,
    textLength: selectedText.length,
    color,
    createdAt: Date.now()
  }

  // Apply visual highlight
  const success = applyHighlight(range, highlight)
  if (!success) return null

  // Save to storage
  await saveHighlight(highlight)

  return highlight
}

/**
 * Create highlight for current selection.
 */
export async function highlightSelection(
  selection: Selection,
  color: string
): Promise<TextHighlight | null> {
  if (!selection || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  const result = await highlightRange(range, color)

  // Clear selection after highlight
  if (result) {
    selection.removeAllRanges()
  }

  return result
}

/**
 * Create remove button element for highlight.
 */
function createRemoveButton(highlightId: string): HTMLSpanElement {
  const btn = document.createElement('span')
  btn.className = 'vocab-highlight-remove'
  btn.title = 'Remove highlight'
  btn.setAttribute('data-remove-highlight', highlightId)
  // Use SVG icon for better appearance
  btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>`
  return btn
}

/**
 * Apply visual highlight to a range.
 */
function applyHighlight(range: Range, highlight: TextHighlight): boolean {
  try {
    const highlightSpan = createHighlightSpan(highlight)

    // Add remove button
    const removeBtn = createRemoveButton(highlight.id)

    // Wrap the selected content
    range.surroundContents(highlightSpan)
    highlightSpan.appendChild(removeBtn)
    return true
  } catch {
    // surroundContents fails if selection crosses element boundaries
    // Use alternative method that handles multi-paragraph selections
    return applyHighlightAlternative(range, highlight)
  }
}

/**
 * Get all text nodes within a range.
 */
function getTextNodesInRange(range: Range): Text[] {
  const textNodes: Text[] = []
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Check if this text node is within our range
        const nodeRange = document.createRange()
        nodeRange.selectNodeContents(node)

        // Check if ranges intersect
        const startsBeforeEnd = range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
        const endsAfterStart = range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0

        if (startsBeforeEnd && endsAfterStart) {
          // Check if text has actual content
          if (node.textContent && node.textContent.trim().length > 0) {
            return NodeFilter.FILTER_ACCEPT
          }
        }
        return NodeFilter.FILTER_REJECT
      }
    }
  )

  let node = walker.nextNode()
  while (node) {
    textNodes.push(node as Text)
    node = walker.nextNode()
  }

  return textNodes
}

/**
 * Create a highlight span element.
 */
function createHighlightSpan(highlight: TextHighlight): HTMLSpanElement {
  const span = document.createElement('span')
  span.className = HIGHLIGHT_CLASS
  span.setAttribute(HIGHLIGHT_DATA_ATTR, highlight.id)
  span.style.cssText = `
    background-color: ${highlight.color};
    border-radius: 2px;
    padding: 0 2px;
  `
  return span
}

/**
 * Alternative highlight method for cross-element selections.
 * Wraps each text node individually to handle multi-paragraph selections.
 */
function applyHighlightAlternative(range: Range, highlight: TextHighlight): boolean {
  try {
    const textNodes = getTextNodesInRange(range)

    if (textNodes.length === 0) {
      console.warn('[VocabExt] No text nodes found in selection')
      return false
    }

    // Process each text node
    const highlightSpans: HTMLSpanElement[] = []

    for (let i = 0; i < textNodes.length; i++) {
      const textNode = textNodes[i]
      const isFirst = i === 0
      const isLast = i === textNodes.length - 1

      // Determine start and end offsets for this text node
      let startOffset = 0
      let endOffset = textNode.length

      if (isFirst && textNode === range.startContainer) {
        startOffset = range.startOffset
      }
      if (isLast && textNode === range.endContainer) {
        endOffset = range.endOffset
      }

      // Skip if no actual text to highlight
      const textToHighlight = textNode.textContent?.substring(startOffset, endOffset)
      if (!textToHighlight || textToHighlight.trim().length === 0) {
        continue
      }

      // Create range for this specific text portion
      const nodeRange = document.createRange()
      nodeRange.setStart(textNode, startOffset)
      nodeRange.setEnd(textNode, endOffset)

      // Create and apply highlight span
      const highlightSpan = createHighlightSpan(highlight)
      nodeRange.surroundContents(highlightSpan)
      highlightSpans.push(highlightSpan)
    }

    // Add remove button to the last highlight span
    if (highlightSpans.length > 0) {
      const lastSpan = highlightSpans[highlightSpans.length - 1]
      const removeBtn = createRemoveButton(highlight.id)
      lastSpan.appendChild(removeBtn)
    }

    return highlightSpans.length > 0
  } catch (error) {
    console.error('[VocabExt] Failed to apply highlight:', error)
    return false
  }
}

/**
 * Remove highlight from DOM by ID.
 * Handles multi-span highlights (from multi-paragraph selections).
 */
export async function removeHighlight(highlightId: string): Promise<void> {
  // Find ALL spans with this highlight ID (multi-paragraph highlights have multiple)
  const highlightEls = document.querySelectorAll(`[${HIGHLIGHT_DATA_ATTR}="${highlightId}"]`)

  highlightEls.forEach(highlightEl => {
    // Unwrap: move children out and remove the span
    const parent = highlightEl.parentNode
    // Clone children to avoid modifying while iterating
    const children = Array.from(highlightEl.childNodes)
    children.forEach(child => {
      // Skip remove button
      if (child.nodeType === Node.ELEMENT_NODE &&
          (child as Element).classList?.contains('vocab-highlight-remove')) {
        return
      }
      parent?.insertBefore(child, highlightEl)
    })
    highlightEl.remove()
  })

  await deleteHighlight(highlightId)
}

/**
 * Restore all highlights for current page on load.
 */
export async function restoreHighlights(): Promise<void> {
  const highlights = await getHighlightsForPage()

  for (const highlight of highlights) {
    restoreSingleHighlight(highlight)
  }
}

/**
 * Restore a single highlight.
 */
function restoreSingleHighlight(highlight: TextHighlight): boolean {
  try {
    const node = getNodeByXPath(highlight.xpath)
    if (!node) {
      console.warn('[VocabExt] Could not find node for highlight:', highlight.id)
      return false
    }

    // Find the text node
    let textNode: Text | null = null

    if (node.nodeType === Node.TEXT_NODE) {
      textNode = node as Text
    } else {
      // Search for text node containing our text
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
      let current = walker.nextNode()

      while (current) {
        if (current.textContent?.includes(highlight.text)) {
          textNode = current as Text
          break
        }
        current = walker.nextNode()
      }
    }

    if (!textNode || !textNode.textContent) {
      console.warn('[VocabExt] Could not find text node for highlight:', highlight.id)
      return false
    }

    // Find the text within the node
    const textContent = textNode.textContent
    const textIndex = textContent.indexOf(highlight.text)

    if (textIndex === -1) {
      console.warn('[VocabExt] Highlight text not found in node:', highlight.id)
      return false
    }

    // Create range and apply highlight
    const range = document.createRange()
    range.setStart(textNode, textIndex)
    range.setEnd(textNode, textIndex + highlight.text.length)

    applyHighlight(range, highlight)
    return true
  } catch (error) {
    console.error('[VocabExt] Failed to restore highlight:', highlight.id, error)
    return false
  }
}

/**
 * Add click handler for removing highlights.
 */
export function initHighlightClickHandlers(): void {
  // Handle click on remove button
  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement

    // Check if clicked on remove button
    if (target.classList.contains('vocab-highlight-remove')) {
      e.preventDefault()
      e.stopPropagation()
      const highlightId = target.getAttribute('data-remove-highlight')
      if (highlightId) {
        await removeHighlight(highlightId)
      }
    }
  })

  // Keep double-click as backup removal method
  document.addEventListener('dblclick', async (e) => {
    const target = e.target as HTMLElement
    const highlightEl = target.closest(`.${HIGHLIGHT_CLASS}`)

    if (highlightEl && !target.classList.contains('vocab-highlight-remove')) {
      const highlightId = highlightEl.getAttribute(HIGHLIGHT_DATA_ATTR)
      if (highlightId && confirm('Remove this highlight?')) {
        await removeHighlight(highlightId)
      }
    }
  })
}

/**
 * Clear all highlights on current page.
 */
export async function clearAllHighlights(): Promise<number> {
  const highlights = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`)
  let count = 0

  for (const highlightEl of highlights) {
    const highlightId = highlightEl.getAttribute(HIGHLIGHT_DATA_ATTR)
    if (highlightId) {
      await removeHighlight(highlightId)
      count++
    }
  }

  return count
}
