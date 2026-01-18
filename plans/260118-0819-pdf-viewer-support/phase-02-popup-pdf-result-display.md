# Phase 02: Popup PDF Result Display

## Context

- Parent: [plan.md](./plan.md)
- Depends on: [phase-01-pdf-detection-and-routing.md](./phase-01-pdf-detection-and-routing.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-18 |
| Priority | P2 |
| Implementation | pending |
| Review | pending |

## Description

Create popup component to display PDF lookup results and integrate with existing popup UI.

## Key Insights

1. Popup should check session storage on mount for pending PDF results
2. Display should match existing tooltip style for consistency
3. User should be able to save words to vocabulary
4. Result should clear after being displayed/dismissed

## Requirements

- Check for PDF lookup result on popup open
- Display word/translation with same info as tooltip
- Allow saving word to vocabulary
- Allow audio playback
- Dismiss/clear result after viewing

## Related Code Files

| File | Purpose |
|------|---------|
| `src/popup/App.tsx` | Main popup component |
| `src/popup/components/Dashboard.tsx` | Dashboard tab |
| `src/content/content-script.ts:684-783` | Tooltip HTML generation (reference) |
| `src/shared/store.ts` | Zustand stores |

## Architecture

```
[Popup Opens]
      ↓
[useEffect: Check session storage]
      ↓
[pdfLookupResult found?]
      ↓
  ┌───┴───┐
  ↓       ↓
 Yes      No
  ↓       ↓
[Show     [Normal
Modal]    View]
```

## Implementation Steps

### Step 1: Create PdfLookupResult component

Create `src/popup/components/PdfLookupResult.tsx`:

```typescript
import { useState } from 'react'
import type { Word, TranslationResult, PdfLookupResult as PdfResult } from '@/types'

interface Props {
  result: PdfResult
  onClose: () => void
}

export default function PdfLookupResult({ result, onClose }: Props) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const isWord = result.type === 'word'
  const data = result.data

  const handleSave = async () => {
    if (!isWord || saved || saving) return
    setSaving(true)

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_WORD',
        payload: { word: data as Word }
      })
      if (response?.success) {
        setSaved(true)
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const handlePlayAudio = () => {
    const text = isWord ? (data as Word).word : (data as TranslationResult).originalText
    chrome.runtime.sendMessage({
      type: 'PLAY_AUDIO',
      payload: { text, lang: 'en' }
    })
  }

  const handleDismiss = async () => {
    await chrome.storage.session.remove('pdfLookupResult')
    onClose()
  }

  if (isWord) {
    const word = data as Word
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">{word.word}</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">PDF</span>
              </div>
              <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {word.pronunciation && (
              <span className="text-sm text-gray-500">{word.pronunciation}</span>
            )}
            {word.partOfSpeech && (
              <span className="ml-2 text-xs text-gray-400 italic">{word.partOfSpeech}</span>
            )}
          </div>

          <div className="p-4 space-y-3">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Definition</span>
              <p className="text-gray-800">{word.definition}</p>
            </div>

            {word.vietnameseTranslation && (
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Translation</span>
                <p className="text-gray-800">{word.vietnameseTranslation}</p>
              </div>
            )}

            {word.examples?.[0] && (
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Example</span>
                <p className="text-gray-600 italic">"{word.examples[0]}"</p>
              </div>
            )}

            {word.synonyms?.length > 0 && (
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Synonyms</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {word.synonyms.map((s, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 flex gap-2">
            <button
              onClick={handlePlayAudio}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-4-4m4 4l4-4" />
              </svg>
              Play
            </button>
            <button
              onClick={handleSave}
              disabled={saved || saving}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm rounded ${
                saved
                  ? 'bg-green-100 text-green-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save to Vocabulary'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Translation result
  const translation = data as TranslationResult
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-900 truncate max-w-[200px]">
                {translation.originalText.slice(0, 50)}
                {translation.originalText.length > 50 ? '...' : ''}
              </span>
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                {translation.isPhrase ? 'Phrase' : 'Word'}
              </span>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">PDF</span>
            </div>
            <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <span className="text-sm text-gray-500">
            {translation.sourceLanguage} → {translation.targetLanguage}
          </span>
        </div>

        <div className="p-4">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Translation</span>
          <p className="text-gray-800 mt-1 whitespace-pre-wrap">{translation.translatedText}</p>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={handlePlayAudio}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-4-4m4 4l4-4" />
            </svg>
            Play
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Step 2: Update App.tsx to check for PDF results

```typescript
// Add to App.tsx
import { useState, useEffect } from 'react'
import PdfLookupResult from './components/PdfLookupResult'
import type { PdfLookupResult as PdfResult } from '@/types'

export default function App() {
  const { activeTab } = useUIStore()
  const [pdfResult, setPdfResult] = useState<PdfResult | null>(null)

  // Check for PDF lookup result on mount
  useEffect(() => {
    const checkPdfResult = async () => {
      try {
        const result = await chrome.storage.session.get('pdfLookupResult')
        if (result.pdfLookupResult) {
          setPdfResult(result.pdfLookupResult)
        }
      } catch (error) {
        console.warn('Session storage not available:', error)
      }
    }
    checkPdfResult()

    // Also listen for changes (if popup already open when lookup happens)
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.pdfLookupResult?.newValue) {
        setPdfResult(changes.pdfLookupResult.newValue)
      }
    }
    chrome.storage.session?.onChanged.addListener(listener)

    return () => {
      chrome.storage.session?.onChanged.removeListener(listener)
    }
  }, [])

  const handleClosePdfResult = () => {
    setPdfResult(null)
  }

  return (
    <div className="popup-container bg-gray-50 flex flex-col">
      {/* PDF lookup result modal */}
      {pdfResult && (
        <PdfLookupResult result={pdfResult} onClose={handleClosePdfResult} />
      )}

      {/* ... rest of existing JSX ... */}
    </div>
  )
}
```

## Todo List

- [ ] Create `PdfLookupResult.tsx` component
- [ ] Add `useState` and `useEffect` imports to App.tsx
- [ ] Add PDF result state and effect to App.tsx
- [ ] Add PDF result modal render to App.tsx
- [ ] Style modal to match existing design system
- [ ] Test word display
- [ ] Test translation display
- [ ] Test save functionality

## Success Criteria

- [ ] PDF result modal appears when popup opens with pending result
- [ ] Word definitions display correctly
- [ ] Translations display correctly
- [ ] Save to vocabulary works
- [ ] Audio playback works
- [ ] Modal dismisses and clears storage

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Session storage API unavailable | Medium | Low | Try/catch with fallback |
| Audio fails in popup context | Low | Low | Error handling exists |

## Security Considerations

- Data already sanitized by lookup APIs
- No XSS risk as using React (auto-escaped)

## Next Steps

After this phase, proceed to Phase 03 for testing and edge case handling.
