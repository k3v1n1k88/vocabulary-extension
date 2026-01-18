/* global Element, XPathResult */
/**
 * Highlight Storage Module
 * Handles persistence of text highlights using chrome.storage.local.
 * Stores highlights keyed by URL for efficient retrieval on page load.
 */

import type { TextHighlight, HighlightStorage } from '@/types'

const STORAGE_KEY = 'text-highlights'

/**
 * Generate unique ID for highlight.
 */
export function generateHighlightId(): string {
  return `hl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Get XPath for a DOM node.
 */
export function getXPath(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode!
  }

  const parts: string[] = []
  let current: Node | null = node

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    const element = current as Element
    let index = 1
    let sibling = element.previousSibling

    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
        index++
      }
      sibling = sibling.previousSibling
    }

    const tagName = element.nodeName.toLowerCase()
    parts.unshift(`${tagName}[${index}]`)
    current = element.parentNode
  }

  return '/' + parts.join('/')
}

/**
 * Find node by XPath.
 */
export function getNodeByXPath(xpath: string): Node | null {
  try {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    )
    return result.singleNodeValue
  } catch {
    return null
  }
}

/**
 * Get current page URL (normalized - without hash).
 */
export function getCurrentUrl(): string {
  return window.location.origin + window.location.pathname
}

/**
 * Save highlight to storage.
 */
export async function saveHighlight(highlight: TextHighlight): Promise<boolean> {
  try {
    const storage = await getHighlightStorage()
    const url = highlight.url

    if (!storage[url]) {
      storage[url] = []
    }

    storage[url].push(highlight)
    await chrome.storage.local.set({ [STORAGE_KEY]: storage })
    return true
  } catch (error) {
    console.error('[VocabExt] Failed to save highlight:', error)
    return false
  }
}

/**
 * Get all highlights for current page.
 */
export async function getHighlightsForPage(url?: string): Promise<TextHighlight[]> {
  try {
    const storage = await getHighlightStorage()
    const pageUrl = url || getCurrentUrl()
    return storage[pageUrl] || []
  } catch (error) {
    console.error('[VocabExt] Failed to get highlights:', error)
    return []
  }
}

/**
 * Delete highlight by ID.
 */
export async function deleteHighlight(highlightId: string): Promise<boolean> {
  try {
    const storage = await getHighlightStorage()
    const url = getCurrentUrl()

    if (storage[url]) {
      storage[url] = storage[url].filter(h => h.id !== highlightId)

      // Clean up empty URL entries
      if (storage[url].length === 0) {
        delete storage[url]
      }

      await chrome.storage.local.set({ [STORAGE_KEY]: storage })
    }
    return true
  } catch (error) {
    console.error('[VocabExt] Failed to delete highlight:', error)
    return false
  }
}

/**
 * Get entire highlight storage.
 */
async function getHighlightStorage(): Promise<HighlightStorage> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    return result[STORAGE_KEY] || {}
  } catch {
    return {}
  }
}

/**
 * Clear all highlights for current page.
 */
export async function clearPageHighlights(): Promise<boolean> {
  try {
    const storage = await getHighlightStorage()
    const url = getCurrentUrl()

    delete storage[url]
    await chrome.storage.local.set({ [STORAGE_KEY]: storage })
    return true
  } catch (error) {
    console.error('[VocabExt] Failed to clear highlights:', error)
    return false
  }
}
