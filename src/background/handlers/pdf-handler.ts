/**
 * PDF Handler Module
 * Handles PDF detection and lookup operations.
 * PDF pages can't have content scripts inject DOM, so we use side panel.
 */

import { lookupWordWithTranslation } from '@/shared/dictionary-api'
import { translateToTargetLanguage, isPhrase } from '@/shared/translation-service'
import type { PdfLookupResult } from '@/types'

/**
 * Detect if URL points to a PDF document.
 * Content scripts cannot inject into Chrome's native PDF viewer.
 */
export function isPdfUrl(url: string | undefined): boolean {
  if (!url) return false
  const lowerUrl = url.toLowerCase()
  return (
    lowerUrl.endsWith('.pdf') ||
    lowerUrl.includes('.pdf?') ||
    lowerUrl.includes('.pdf#') ||
    lowerUrl.includes('pdfviewer') ||
    lowerUrl.includes('/viewer.html?file=') ||
    lowerUrl.includes('/pdfjs/') ||
    (lowerUrl.startsWith('chrome-extension://') && lowerUrl.includes('pdf'))
  )
}

/**
 * Perform lookup and store result for side panel to display.
 * Called after side panel is already open.
 */
export async function performPdfLookup(text: string): Promise<void> {
  try {
    // Store loading state first
    await chrome.storage.session.set({
      pdfLookupResult: { type: 'loading', timestamp: Date.now(), text }
    })

    const isPhraseText = isPhrase(text)
    let result: PdfLookupResult

    if (isPhraseText) {
      const translation = await translateToTargetLanguage(text)
      result = { type: 'translation', timestamp: Date.now(), data: translation }
    } else {
      const wordData = await lookupWordWithTranslation(text)
      if (wordData) {
        result = { type: 'word', timestamp: Date.now(), data: wordData }
      } else {
        // Fallback to translation for unknown words
        const translation = await translateToTargetLanguage(text)
        result = { type: 'translation', timestamp: Date.now(), data: translation }
      }
    }

    // Store result for side panel to display
    await chrome.storage.session.set({ pdfLookupResult: result })
  } catch (error) {
    console.error('[VocabExt] PDF lookup failed:', error)
    await chrome.storage.session.set({
      pdfLookupResult: {
        type: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}
