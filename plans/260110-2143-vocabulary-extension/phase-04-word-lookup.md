---
phase: 04
title: "Word Lookup Feature"
status: pending
priority: P1
effort: 5h
dependencies: [phase-02, phase-03]
---

# Phase 04: Word Lookup Feature

## Context

Implement word lookup via context menu and popup input. Create dictionary API abstraction supporting Free Dictionary API and Google Translate (for Vietnamese). Display results in tooltip/popup with save option.

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-10 |
| Priority | P1 (Core Feature) |
| Status | pending |
| Effort | 5h |
| Dependencies | Phase 02, 03 completed |

## Requirements

1. Context menu "Look up" triggers word lookup
2. Manual input in popup for word lookup
3. Dictionary API abstraction (pluggable sources)
4. Free Dictionary API for English definitions
5. Google Translate API for EN<>VN translation
6. Tooltip/popup showing definition + translation
7. "Save to vocabulary" button in results
8. **Audio pronunciation** - Text-to-speech for English words using Web Speech API

## Implementation Steps

### Step 1: Dictionary API Types (15min)

**File:** `src/types/dictionary.ts`
```typescript
export interface DictionaryResult {
  word: string
  phonetic?: string
  phonetics?: Array<{
    text?: string
    audio?: string
  }>
  meanings: Array<{
    partOfSpeech: string
    definitions: Array<{
      definition: string
      example?: string
      synonyms?: string[]
      antonyms?: string[]
    }>
  }>
  sourceUrl?: string
}

export interface TranslationResult {
  sourceText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  confidence?: number
}

export interface LookupResult {
  word: string
  dictionary?: DictionaryResult
  translation?: TranslationResult
  error?: string
}
```

### Step 2: Dictionary Service Abstraction (30min)

**File:** `src/shared/dictionary/index.ts`
```typescript
import type { DictionaryResult, TranslationResult, LookupResult } from '../../types/dictionary'
import { fetchFreeDictionary } from './free-dictionary'
import { translateText, detectLanguage } from './google-translate'

export interface DictionaryProvider {
  lookup(word: string): Promise<DictionaryResult | null>
}

export interface TranslationProvider {
  translate(text: string, from: string, to: string): Promise<TranslationResult>
}

// Main lookup function combining dictionary + translation
export async function lookupWord(
  word: string,
  options: {
    nativeLanguage?: 'en' | 'vi'
    learningLanguage?: 'en' | 'vi'
  } = {}
): Promise<LookupResult> {
  const { nativeLanguage = 'vi', learningLanguage = 'en' } = options
  const trimmedWord = word.trim().toLowerCase()

  const result: LookupResult = { word: trimmedWord }

  try {
    // Detect language of input
    const detectedLang = await detectLanguage(trimmedWord)
    const isEnglish = detectedLang === 'en'

    // Parallel fetch: dictionary (for English) + translation
    const promises: Promise<unknown>[] = []

    // English dictionary lookup
    if (isEnglish) {
      promises.push(
        fetchFreeDictionary(trimmedWord)
          .then((dict) => {
            result.dictionary = dict ?? undefined
          })
          .catch(() => {})
      )
    }

    // Translation (always, for bilingual support)
    const translateFrom = isEnglish ? 'en' : 'vi'
    const translateTo = isEnglish ? 'vi' : 'en'

    promises.push(
      translateText(trimmedWord, translateFrom, translateTo)
        .then((trans) => {
          result.translation = trans
        })
        .catch(() => {})
    )

    await Promise.all(promises)

    // If no results at all, set error
    if (!result.dictionary && !result.translation) {
      result.error = 'No results found'
    }

    return result
  } catch (error) {
    return {
      word: trimmedWord,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export { fetchFreeDictionary, translateText, detectLanguage }
```

### Step 3: Free Dictionary API (30min)

**File:** `src/shared/dictionary/free-dictionary.ts`
```typescript
import type { DictionaryResult } from '../../types/dictionary'

const FREE_DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en'

export async function fetchFreeDictionary(word: string): Promise<DictionaryResult | null> {
  try {
    const response = await fetch(`${FREE_DICTIONARY_API}/${encodeURIComponent(word)}`)

    if (!response.ok) {
      if (response.status === 404) {
        return null // Word not found
      }
      throw new Error(`Dictionary API error: ${response.status}`)
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      return null
    }

    // Take first result
    const entry = data[0]

    return {
      word: entry.word,
      phonetic: entry.phonetic || entry.phonetics?.[0]?.text,
      phonetics: entry.phonetics?.map((p: { text?: string; audio?: string }) => ({
        text: p.text,
        audio: p.audio,
      })),
      meanings: entry.meanings?.map((m: {
        partOfSpeech: string
        definitions: Array<{ definition: string; example?: string; synonyms?: string[]; antonyms?: string[] }>
      }) => ({
        partOfSpeech: m.partOfSpeech,
        definitions: m.definitions?.slice(0, 3).map((d) => ({
          definition: d.definition,
          example: d.example,
          synonyms: d.synonyms?.slice(0, 5),
          antonyms: d.antonyms?.slice(0, 5),
        })),
      })),
      sourceUrl: entry.sourceUrls?.[0],
    }
  } catch (error) {
    console.error('[Dictionary] Free Dictionary error:', error)
    return null
  }
}
```

### Step 4: Google Translate Service (45min)

**File:** `src/shared/dictionary/google-translate.ts`
```typescript
import type { TranslationResult } from '../../types/dictionary'

// Using Google Translate's free endpoint (unofficial but works for small-scale use)
// For production, use official Cloud Translation API with API key
const TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single'

export async function translateText(
  text: string,
  from: string,
  to: string
): Promise<TranslationResult> {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: from,
    tl: to,
    dt: 't',
    q: text,
  })

  const response = await fetch(`${TRANSLATE_API}?${params}`)

  if (!response.ok) {
    throw new Error(`Translation error: ${response.status}`)
  }

  const data = await response.json()

  // Response format: [[["translated","original",null,null,confidence]]...]
  const translatedText = data[0]?.map((item: string[]) => item[0]).join('') || ''

  return {
    sourceText: text,
    translatedText,
    sourceLanguage: from,
    targetLanguage: to,
  }
}

export async function detectLanguage(text: string): Promise<string> {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: 'en',
    dt: 't',
    q: text,
  })

  const response = await fetch(`${TRANSLATE_API}?${params}`)
  const data = await response.json()

  // Detected language is at index [2]
  return data[2] || 'en'
}
```

### Step 4.5: Text-to-Speech Service (20min)

**File:** `src/shared/tts.ts`
```typescript
/**
 * Text-to-Speech using Web Speech API
 * Free, built-in browser API - no external dependencies
 */

let currentUtterance: SpeechSynthesisUtterance | null = null

export interface TTSOptions {
  lang?: string // 'en-US', 'en-GB', 'vi-VN'
  rate?: number // 0.1 to 10, default 1
  pitch?: number // 0 to 2, default 1
  volume?: number // 0 to 1, default 1
}

export function speak(text: string, options: TTSOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    // Cancel any ongoing speech
    if (currentUtterance) {
      speechSynthesis.cancel()
    }

    // Check API availability
    if (!('speechSynthesis' in window)) {
      reject(new Error('Text-to-speech not supported in this browser'))
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = options.lang || 'en-US'
    utterance.rate = options.rate || 1
    utterance.pitch = options.pitch || 1
    utterance.volume = options.volume || 1

    utterance.onend = () => {
      currentUtterance = null
      resolve()
    }

    utterance.onerror = (event) => {
      currentUtterance = null
      reject(new Error(`TTS error: ${event.error}`))
    }

    currentUtterance = utterance
    speechSynthesis.speak(utterance)
  })
}

export function stopSpeaking(): void {
  if (currentUtterance) {
    speechSynthesis.cancel()
    currentUtterance = null
  }
}

export function isSpeaking(): boolean {
  return speechSynthesis.speaking
}

// Get available voices for a language
export function getVoices(lang?: string): SpeechSynthesisVoice[] {
  const voices = speechSynthesis.getVoices()
  if (!lang) return voices
  return voices.filter((v) => v.lang.startsWith(lang))
}
```

### Step 5: Lookup Result Component (45min)

**File:** `src/popup/components/LookupResult.tsx`
```typescript
import { useState } from 'react'
import type { LookupResult } from '../../types/dictionary'
import type { Word } from '../../types'
import { useVocabStore } from '../../shared/store'
import { saveWord as saveWordToFirestore } from '../../shared/firestore'
import { speak, stopSpeaking, isSpeaking } from '../../shared/tts'

interface Props {
  result: LookupResult
  onSave?: () => void
}

export function LookupResultCard({ result, onSave }: Props) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const { user, addWord } = useVocabStore()

  const { word, dictionary, translation, error } = result

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  const handleSave = async () => {
    if (!user || saved) return

    setSaving(true)
    try {
      const newWord: Word = {
        id: crypto.randomUUID(),
        term: word,
        definition: dictionary?.meanings[0]?.definitions[0]?.definition || '',
        translation: translation?.translatedText,
        example: dictionary?.meanings[0]?.definitions[0]?.example,
        phonetic: dictionary?.phonetic,
        audio: dictionary?.phonetics?.find((p) => p.audio)?.audio,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      // Save to local store
      addWord(newWord)

      // Sync to Firestore if logged in
      if (user) {
        await saveWordToFirestore(user.uid, newWord)
      }

      setSaved(true)
      onSave?.()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  // Play audio - prefer dictionary audio URL, fallback to TTS
  const playAudio = async () => {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
      return
    }

    const audioUrl = dictionary?.phonetics?.find((p) => p.audio)?.audio
    if (audioUrl) {
      // Use dictionary audio if available
      new Audio(audioUrl).play()
    } else {
      // Fallback to Web Speech API TTS
      setSpeaking(true)
      try {
        await speak(word, { lang: 'en-US' })
      } catch (err) {
        console.error('TTS failed:', err)
      } finally {
        setSpeaking(false)
      }
    }
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{word}</h3>
            {dictionary?.phonetic && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500 text-sm">{dictionary.phonetic}</span>
                <button
                  onClick={playAudio}
                  className={`text-blue-600 hover:text-blue-800 ${speaking ? 'animate-pulse' : ''}`}
                  title="Play pronunciation"
                  aria-label="Play pronunciation"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                </button>
              </div>
            )}
            {/* Show TTS button even without phonetic */}
            {!dictionary?.phonetic && (
              <button
                onClick={playAudio}
                className={`mt-1 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 ${speaking ? 'animate-pulse' : ''}`}
                title="Play pronunciation"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
                Listen
              </button>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || saved || !user}
            className={`px-3 py-1 text-sm rounded ${
              saved
                ? 'bg-green-100 text-green-700'
                : saving
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Translation */}
      {translation && (
        <div className="p-4 border-b bg-blue-50">
          <p className="text-sm text-gray-500">Translation</p>
          <p className="text-lg text-blue-800">{translation.translatedText}</p>
        </div>
      )}

      {/* Dictionary Definitions */}
      {dictionary?.meanings && (
        <div className="p-4 space-y-4">
          {dictionary.meanings.map((meaning, idx) => (
            <div key={idx}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {meaning.partOfSpeech}
              </p>
              <ul className="mt-2 space-y-2">
                {meaning.definitions.map((def, defIdx) => (
                  <li key={defIdx} className="text-sm">
                    <p className="text-gray-800">{def.definition}</p>
                    {def.example && (
                      <p className="mt-1 text-gray-500 italic">"{def.example}"</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* No user warning */}
      {!user && (
        <div className="p-3 bg-yellow-50 border-t text-xs text-yellow-700">
          Sign in to save words to your vocabulary
        </div>
      )}
    </div>
  )
}
```

### Step 6: Update Popup Lookup Tab (30min)

**File:** `src/popup/components/LookupTab.tsx`
```typescript
import { useState, useCallback } from 'react'
import { lookupWord } from '../../shared/dictionary'
import type { LookupResult } from '../../types/dictionary'
import { LookupResultCard } from './LookupResult'
import { useVocabStore } from '../../shared/store'

export function LookupTab() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LookupResult | null>(null)
  const { settings } = useVocabStore()

  const handleLookup = useCallback(async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const res = await lookupWord(query, {
        nativeLanguage: settings.nativeLanguage,
        learningLanguage: settings.learningLanguage,
      })
      setResult(res)
    } catch (err) {
      setResult({
        word: query,
        error: err instanceof Error ? err.message : 'Lookup failed',
      })
    } finally {
      setLoading(false)
    }
  }, [query, settings])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup()
    }
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a word..."
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleLookup}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Look up'}
        </button>
      </div>

      {/* Instructions */}
      {!result && !loading && (
        <p className="text-gray-500 text-sm">
          Type a word above or right-click any text on a webpage to look it up.
        </p>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Result */}
      {result && !loading && <LookupResultCard result={result} />}
    </div>
  )
}
```

### Step 7: Content Script Tooltip (45min)

**File:** `src/content/tooltip.ts`
```typescript
import type { LookupResult } from '../types/dictionary'

let tooltipElement: HTMLElement | null = null

export function showTooltip(result: LookupResult, position: { x: number; y: number }) {
  hideTooltip()

  tooltipElement = document.createElement('div')
  tooltipElement.id = 'vocab-ext-tooltip'
  tooltipElement.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    max-width: 350px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    overflow: hidden;
  `

  // Position tooltip
  const left = Math.min(position.x, window.innerWidth - 370)
  const top = Math.min(position.y + 10, window.innerHeight - 300)
  tooltipElement.style.left = `${left}px`
  tooltipElement.style.top = `${top}px`

  // Build content
  tooltipElement.innerHTML = buildTooltipHTML(result)

  // Add event listeners
  document.body.appendChild(tooltipElement)

  // Close button
  tooltipElement.querySelector('[data-close]')?.addEventListener('click', hideTooltip)

  // Save button
  tooltipElement.querySelector('[data-save]')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'SAVE_WORD',
      payload: {
        word: result.word,
        definition: result.dictionary?.meanings[0]?.definitions[0]?.definition || '',
        translation: result.translation?.translatedText,
      },
    })
    const btn = tooltipElement?.querySelector('[data-save]') as HTMLElement
    if (btn) {
      btn.textContent = 'Saved!'
      btn.style.background = '#059669'
    }
  })

  // Close on click outside
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside)
  }, 100)
}

export function hideTooltip() {
  if (tooltipElement) {
    tooltipElement.remove()
    tooltipElement = null
  }
  document.removeEventListener('click', handleClickOutside)
}

function handleClickOutside(e: MouseEvent) {
  if (tooltipElement && !tooltipElement.contains(e.target as Node)) {
    hideTooltip()
  }
}

function buildTooltipHTML(result: LookupResult): string {
  const { word, dictionary, translation, error } = result

  if (error) {
    return `
      <div style="padding: 16px;">
        <p style="color: #dc2626; margin: 0;">${error}</p>
      </div>
    `
  }

  let html = `
    <div style="padding: 12px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: start;">
      <div>
        <strong style="font-size: 16px; color: #111827;">${word}</strong>
        ${dictionary?.phonetic ? `<span style="color: #6b7280; font-size: 13px; margin-left: 8px;">${dictionary.phonetic}</span>` : ''}
      </div>
      <button data-close style="background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 18px;">&times;</button>
    </div>
  `

  if (translation) {
    html += `
      <div style="padding: 12px 16px; background: #eff6ff; border-bottom: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #1e40af; font-size: 15px;">${translation.translatedText}</p>
      </div>
    `
  }

  if (dictionary?.meanings?.length) {
    const meaning = dictionary.meanings[0]
    const def = meaning.definitions[0]
    html += `
      <div style="padding: 12px 16px;">
        <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 11px; text-transform: uppercase;">${meaning.partOfSpeech}</p>
        <p style="margin: 0; color: #374151;">${def.definition}</p>
        ${def.example ? `<p style="margin: 8px 0 0 0; color: #6b7280; font-style: italic;">"${def.example}"</p>` : ''}
      </div>
    `
  }

  html += `
    <div style="padding: 12px 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end;">
      <button data-save style="background: #2563eb; color: white; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;">
        Save
      </button>
    </div>
  `

  return html
}
```

### Step 8: Update Content Script (30min)

**Update:** `src/content/content-script.ts`
```typescript
import type { Message } from '../background/service-worker'
import { showTooltip, hideTooltip } from './tooltip'
import { lookupWord } from '../shared/dictionary'

// Listen for messages from background
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (message.type === 'LOOKUP_WORD') {
    const payload = message.payload as { word: string }
    handleWordLookup(payload.word)
    sendResponse({ success: true })
  }
  return true
})

async function handleWordLookup(word: string) {
  // Get selection position for tooltip
  const selection = window.getSelection()
  let position = { x: 100, y: 100 }

  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    position = { x: rect.left, y: rect.bottom }
  }

  // Show loading tooltip
  showTooltip({ word, error: 'Loading...' }, position)

  try {
    const result = await lookupWord(word)
    showTooltip(result, position)
  } catch (error) {
    showTooltip(
      { word, error: error instanceof Error ? error.message : 'Lookup failed' },
      position
    )
  }
}

// Optional: Double-click to lookup
document.addEventListener('dblclick', async (e) => {
  const selection = window.getSelection()?.toString().trim()
  if (selection && selection.length > 0 && selection.length < 50 && /^[\w\s]+$/.test(selection)) {
    // Only single words or short phrases
    handleWordLookup(selection)
  }
})

export {}
```

## Success Criteria

- [ ] Context menu "Look up" works on selected text
- [ ] Popup input field performs lookup
- [ ] English words show dictionary definition
- [ ] Vietnamese words show English translation
- [ ] English words show Vietnamese translation
- [ ] Tooltip appears near selected text
- [ ] "Save" button adds word to vocabulary
- [ ] Audio pronunciation plays for English words (dictionary audio or TTS fallback)
- [ ] Web Speech API TTS works when dictionary audio unavailable

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Free Dictionary API rate limits | Medium | Cache results, add fallback API |
| Google Translate endpoint blocked | High | Use official API with key, or local dictionary |
| CORS issues | Medium | Route through background worker if needed |
| Tooltip z-index conflicts | Low | Use max z-index (2147483647) |

## Output Files

```
src/
├── types/dictionary.ts                    # Dictionary/translation types
├── shared/
│   ├── dictionary/
│   │   ├── index.ts                       # Main lookup function
│   │   ├── free-dictionary.ts             # Free Dictionary API
│   │   └── google-translate.ts            # Translation service
│   └── tts.ts                             # Text-to-speech service (Web Speech API)
├── popup/components/
│   ├── LookupResult.tsx                   # Result card with audio playback
│   └── LookupTab.tsx                      # Lookup tab with input
└── content/
    ├── content-script.ts                  # Updated with lookup handler
    └── tooltip.ts                         # Tooltip display logic
```
