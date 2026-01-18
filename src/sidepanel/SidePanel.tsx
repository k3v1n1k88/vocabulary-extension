import { useState, useEffect, useRef } from 'react'
import type { Word, TranslationResult, PdfLookupResult, UserSettings } from '@/types'
import { SUPPORTED_LANGUAGES } from '@/types'

// Only word/translation results (not loading/error) for history
type HistoryItem = Extract<PdfLookupResult, { type: 'word' } | { type: 'translation' }>

// Reusable AI robot icon component
function AiRobotIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
      <circle cx="7.5" cy="14.5" r="1.5"/>
      <circle cx="16.5" cy="14.5" r="1.5"/>
    </svg>
  )
}

/**
 * Side Panel for displaying PDF lookup results.
 * Opens alongside PDF viewer for seamless vocabulary learning.
 */
export default function SidePanel() {
  const [result, setResult] = useState<PdfLookupResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<string | null>(null)
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    useLLMTranslation: false,
    targetLanguage: 'vi',
    sourceLanguage: 'en'
  })
  const [sourceLang, setSourceLang] = useState('en')
  const [targetLang, setTargetLang] = useState('vi')
  const [isRetranslating, setIsRetranslating] = useState(false)
  const [retranslateError, setRetranslateError] = useState<string | null>(null)

  // Load settings and result on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user settings
        const settingsData = await chrome.storage.local.get('settings-storage')
        if (settingsData['settings-storage']) {
          try {
            const parsed = JSON.parse(settingsData['settings-storage'])
            const userSettings = parsed?.state?.settings as UserSettings
            if (userSettings) {
              setSettings(userSettings)
              setSourceLang(userSettings.sourceLanguage || 'en')
              setTargetLang(userSettings.targetLanguage || 'vi')
            }
          } catch {
            console.warn('[VocabExt] Failed to parse settings')
          }
        }

        // Get current result
        const sessionData = await chrome.storage.session.get('pdfLookupResult')
        if (sessionData.pdfLookupResult) {
          setResult(sessionData.pdfLookupResult)
          // Add to history
          addToHistory(sessionData.pdfLookupResult)
        }

        // Get history
        const historyData = await chrome.storage.session.get('pdfLookupHistory')
        if (historyData.pdfLookupHistory) {
          setHistory(historyData.pdfLookupHistory)
        }
      } catch (error) {
        console.warn('[VocabExt] Failed to load sidepanel data:', error)
      }
    }
    loadData()

    // Listen for new results
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.pdfLookupResult?.newValue) {
        const newResult = changes.pdfLookupResult.newValue as PdfLookupResult
        setResult(newResult)
        // Only add word/translation to history (not loading/error states)
        if (newResult.type === 'word' || newResult.type === 'translation') {
          addToHistory(newResult)
        }
      }
    }

    chrome.storage.session?.onChanged.addListener(handleStorageChange)
    return () => {
      chrome.storage.session?.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  const addToHistory = async (item: PdfLookupResult) => {
    // Only handle word/translation types
    if (item.type !== 'word' && item.type !== 'translation') return

    const historyItem = item as HistoryItem
    setHistory(prev => {
      // Avoid duplicates based on content
      const itemKey = historyItem.type === 'word'
        ? historyItem.data.word
        : historyItem.data.originalText
      const filtered = prev.filter(h => {
        const hKey = h.type === 'word'
          ? h.data.word
          : h.data.originalText
        return hKey !== itemKey
      })
      const newHistory = [historyItem, ...filtered].slice(0, 20) // Keep last 20
      // Save to storage
      chrome.storage.session.set({ pdfLookupHistory: newHistory })
      return newHistory
    })
  }

  const handleSave = async (word: Word) => {
    if (saved.has(word.id) || saving === word.id) return
    setSaving(word.id)

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_WORD',
        payload: { word }
      })
      if (response?.success) {
        setSaved(prev => new Set([...prev, word.id]))
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(null)
    }
  }

  const handlePlayAudio = (text: string, lang: string = 'en') => {
    chrome.runtime.sendMessage({
      type: 'PLAY_AUDIO',
      payload: { text, lang }
    })
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const selectFromHistory = (item: PdfLookupResult) => {
    setResult(item)
  }

  const clearHistory = async () => {
    setHistory([])
    await chrome.storage.session.remove('pdfLookupHistory')
  }

  // Re-translate with new language settings
  const handleRetranslate = async (newSourceLang: string, newTargetLang: string) => {
    if (!result || (result.type !== 'word' && result.type !== 'translation')) return

    const originalText = result.type === 'word'
      ? result.data.word
      : result.data.originalText

    if (!originalText) return

    setIsRetranslating(true)
    setRetranslateError(null)
    try {
      if (settings.useLLMTranslation) {
        // AI mode: use TRANSLATE_TEXT with target language
        const response = await chrome.runtime.sendMessage({
          type: 'TRANSLATE_TEXT',
          payload: { text: originalText, targetLanguage: newTargetLang }
        })
        if (response?.success && response.data) {
          const newResult: PdfLookupResult = {
            type: 'translation',
            timestamp: Date.now(),
            data: response.data as TranslationResult
          }
          setResult(newResult)
          await chrome.storage.session.set({ pdfLookupResult: newResult })
        } else if (response?.error) {
          setRetranslateError(response.error)
        }
      } else {
        // Free API mode: use TRANSLATE_SWAP for language swap
        const response = await chrome.runtime.sendMessage({
          type: 'TRANSLATE_SWAP',
          payload: {
            text: originalText,
            sourceLangCode: newSourceLang,
            targetLangCode: newTargetLang
          }
        })
        if (response?.translatedText) {
          const newResult: PdfLookupResult = {
            type: 'translation',
            timestamp: Date.now(),
            data: {
              originalText,
              translatedText: response.translatedText,
              sourceLanguage: SUPPORTED_LANGUAGES.find(l => l.code === newSourceLang)?.name || newSourceLang,
              targetLanguage: SUPPORTED_LANGUAGES.find(l => l.code === newTargetLang)?.name || newTargetLang,
              sourceLangCode: newSourceLang,
              targetLangCode: newTargetLang,
              isPhrase: originalText.trim().includes(' '),
              isFreeTranslation: true
            }
          }
          setResult(newResult)
          await chrome.storage.session.set({ pdfLookupResult: newResult })
        } else if (response?.error) {
          setRetranslateError(response.error)
        }
      }
    } catch (error) {
      console.error('[VocabExt] Retranslate failed:', error)
      setRetranslateError(error instanceof Error ? error.message : 'Translation failed')
    } finally {
      setIsRetranslating(false)
    }
  }

  const handleSourceLangChange = (newLang: string) => {
    setSourceLang(newLang)
    handleRetranslate(newLang, targetLang)
  }

  const handleTargetLangChange = (newLang: string) => {
    setTargetLang(newLang)
    handleRetranslate(sourceLang, newLang)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/icons/icon-32.png" alt="" className="w-6 h-6" />
          <h1 className="text-sm font-semibold text-gray-800">Vocabulary Lookup</h1>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">PDF</span>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {result?.type === 'loading' ? (
          <div className="p-6 text-center">
            <div className="animate-spin w-8 h-8 mx-auto mb-3 border-2 border-primary-600 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-600">Looking up...</p>
            <p className="text-xs text-gray-400 mt-1 truncate px-4">"{result.text}"</p>
          </div>
        ) : result?.type === 'error' ? (
          <div className="p-6 text-center">
            {/* Check if error is query length limit - suggest AI mode */}
            {result.error?.includes('QUERY LENGTH LIMIT') ? (
              <>
                <svg className="w-10 h-10 mx-auto mb-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-amber-600 font-medium">Text too long for Free API</p>
                <p className="text-xs text-gray-500 mt-1">Free translation has a 500 character limit.</p>
                <p className="text-xs text-gray-600 mt-2">Switch to <span className="font-medium text-purple-600">AI Mode</span> for unlimited translation.</p>
                <button
                  onClick={() => {
                    chrome.runtime.sendMessage({
                      type: 'OPEN_OPTIONS_PAGE',
                      payload: { hash: 'settings-ai-translation' }
                    })
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors"
                  style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}
                >
                  <AiRobotIcon size={12} />
                  Enable AI Mode
                </button>
              </>
            ) : (
              <>
                <svg className="w-10 h-10 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-600">Lookup failed</p>
                <p className="text-xs text-gray-500 mt-1">{result.error}</p>
              </>
            )}
          </div>
        ) : result?.type === 'word' || result?.type === 'translation' ? (
          <ResultCard
            result={result}
            saved={saved}
            saving={saving}
            onSave={handleSave}
            onPlayAudio={handlePlayAudio}
            onCopy={handleCopy}
            sourceLang={sourceLang}
            targetLang={targetLang}
            onSourceLangChange={handleSourceLangChange}
            onTargetLangChange={handleTargetLangChange}
            isRetranslating={isRetranslating}
            retranslateError={retranslateError}
            useLLMTranslation={settings.useLLMTranslation || false}
          />
        ) : (
          <div className="p-6 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-sm">Select text in PDF and right-click</p>
            <p className="text-xs text-gray-400 mt-1">"Look up / Translate"</p>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="border-t border-gray-200 mt-2">
            <div className="px-4 py-2 flex items-center justify-between bg-gray-100">
              <span className="text-xs font-medium text-gray-600">Recent Lookups</span>
              <button
                onClick={clearHistory}
                className="text-[10px] text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {history.slice(0, 10).map((item) => {
                const itemKey = item.type === 'word'
                  ? item.data.id
                  : `${item.timestamp}-${item.data.originalText.slice(0, 20)}`
                return (
                  <HistoryItemComponent
                    key={itemKey}
                    item={item}
                    isActive={result === item}
                    onClick={() => selectFromHistory(item)}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Donate bar */}
      <div className="px-3 py-1.5 bg-gradient-to-r from-primary-50 to-success-50 border-t border-primary-100 flex justify-center gap-2">
        <a
          href="https://buymeacoffee.com/k3v1n1088"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] px-2 py-0.5 bg-[#FFDD00] text-gray-900 rounded font-medium hover:bg-[#ffed4a] transition-colors"
        >
          Buy me a coffee
        </a>
        <a
          href="https://paypal.me/k3v1n1k88"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] px-2 py-0.5 bg-[#0070ba] text-white rounded font-medium hover:bg-[#005ea6] transition-colors"
        >
          Donate PayPal
        </a>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Kevin Nguyen
          </span>
          <div className="flex items-center gap-1">
            <a
              href="https://chromewebstore.google.com/detail/vocabulary-builder/gjnopcfejkppaihaamfhdonlijjkfkdj"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-amber-500 px-1.5 py-0.5 rounded hover:bg-amber-50 transition-colors"
              title="Rate on Chrome Web Store"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Rate
            </a>
            <a
              href="https://github.com/k3v1n1k88/vocabulary-extension-issues/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
              title="Report an issue"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Issue
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Type for word or translation result only
type WordOrTranslationResult =
  | { type: 'word'; timestamp: number; data: Word }
  | { type: 'translation'; timestamp: number; data: TranslationResult }

// Result card component
function ResultCard({
  result,
  saved,
  saving,
  onSave,
  onPlayAudio,
  onCopy,
  sourceLang,
  targetLang,
  onSourceLangChange,
  onTargetLangChange,
  isRetranslating,
  retranslateError,
  useLLMTranslation
}: {
  result: WordOrTranslationResult
  saved: Set<string>
  saving: string | null
  onSave: (word: Word) => void
  onPlayAudio: (text: string, lang?: string) => void
  onCopy: (text: string) => void
  sourceLang: string
  targetLang: string
  onSourceLangChange: (lang: string) => void
  onTargetLangChange: (lang: string) => void
  isRetranslating: boolean
  retranslateError: string | null
  useLLMTranslation: boolean
}) {
  const isWord = result.type === 'word'

  if (isWord) {
    const word = result.data as Word
    const isSaved = saved.has(word.id)
    const isSaving = saving === word.id

    return (
      <div className="p-4 bg-white">
        {/* Word header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{word.word}</h2>
              <button
                onClick={() => onPlayAudio(word.word, 'en')}
                className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                title="Play pronunciation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {word.pronunciation && (
                <span className="text-sm text-gray-500">{word.pronunciation}</span>
              )}
              {word.partOfSpeech && (
                <span className="text-xs text-gray-400 italic">{word.partOfSpeech}</span>
              )}
            </div>
          </div>
          {/* AI/Free badge */}
          {word.isFreeTranslation === false ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-white rounded" style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
              <AiRobotIcon />
              AI
            </span>
          ) : word.isFreeTranslation === true ? (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">Free</span>
          ) : null}
        </div>

        {/* Definition */}
        <div className="mb-3">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Definition</span>
          <p className="text-sm text-gray-800 mt-0.5">{word.definition}</p>
        </div>

        {/* Translation */}
        {word.vietnameseTranslation && (
          <div className="mb-3">
            <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Translation</span>
            <p className="text-sm text-gray-800 mt-0.5">{word.vietnameseTranslation}</p>
          </div>
        )}

        {/* Example */}
        {word.examples && word.examples.length > 0 && (
          <div className="mb-3">
            <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Example</span>
            <p className="text-sm text-gray-600 italic mt-0.5">"{word.examples[0]}"</p>
          </div>
        )}

        {/* Synonyms */}
        {word.synonyms && word.synonyms.length > 0 && (
          <div className="mb-3">
            <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Synonyms</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {word.synonyms.slice(0, 6).map((s, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Antonyms */}
        {word.antonyms && word.antonyms.length > 0 && (
          <div className="mb-3">
            <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Antonyms</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {word.antonyms.slice(0, 6).map((a, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 bg-red-50 text-red-700 rounded">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={() => onSave(word)}
          disabled={isSaved || isSaving}
          className={`w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
            isSaved
              ? 'bg-green-100 text-green-700'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isSaved ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved to Vocabulary
            </>
          ) : isSaving ? (
            'Saving...'
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Save to Vocabulary
            </>
          )}
        </button>
      </div>
    )
  }

  // Translation result
  const translation = result.data as TranslationResult
  return (
    <div className="p-4 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900 truncate">{translation.originalText}</h2>
            <button
              onClick={() => onPlayAudio(translation.originalText, translation.sourceLangCode || 'en')}
              className="p-1 text-gray-400 hover:text-primary-600 transition-colors flex-shrink-0"
              title="Play pronunciation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {/* Source language selector - only for free API */}
            {!useLLMTranslation ? (
              <LangDropdown
                value={sourceLang}
                onChange={onSourceLangChange}
                disabled={isRetranslating}
              />
            ) : (
              <span className="text-xs text-gray-500">{translation.sourceLanguage}</span>
            )}
            <span className="text-xs text-gray-400">→</span>
            {/* Target language selector - always available */}
            <LangDropdown
              value={targetLang}
              onChange={onTargetLangChange}
              disabled={isRetranslating}
            />
            {/* AI/Free badge */}
            {useLLMTranslation ? (
              <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 text-[10px] font-medium text-white rounded" style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
                <AiRobotIcon />
                AI
              </span>
            ) : (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">Free</span>
            )}
            {/* Loading indicator */}
            {isRetranslating && (
              <div className="w-3 h-3 border border-primary-600 border-t-transparent rounded-full animate-spin ml-1" />
            )}
          </div>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium flex-shrink-0">
          {translation.isPhrase ? 'Phrase' : 'Word'}
        </span>
      </div>

      {/* Retranslate error */}
      {retranslateError && (
        <div className="mb-3 px-2 py-1.5 bg-red-50 border border-red-100 rounded text-xs text-red-600">
          {retranslateError}
        </div>
      )}

      {/* Translation */}
      <div className="mb-3">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Translation</span>
        <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{translation.translatedText}</p>
      </div>

      {/* Copy button */}
      <button
        onClick={() => onCopy(translation.translatedText)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Copy Translation
      </button>
    </div>
  )
}

// History item component
function HistoryItemComponent({
  item,
  isActive,
  onClick
}: {
  item: HistoryItem
  isActive: boolean
  onClick: () => void
}) {
  const isWord = item.type === 'word'
  const title = isWord
    ? item.data.word
    : item.data.originalText
  const subtitle = isWord
    ? item.data.definition
    : item.data.translatedText

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-primary-50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium truncate ${isActive ? 'text-primary-700' : 'text-gray-800'}`}>
          {title.slice(0, 30)}{title.length > 30 ? '...' : ''}
        </span>
        <span className="text-[10px] px-1 py-0.5 bg-gray-100 text-gray-500 rounded flex-shrink-0">
          {isWord ? 'Word' : 'Phrase'}
        </span>
      </div>
      <p className="text-xs text-gray-500 truncate mt-0.5">
        {subtitle.slice(0, 50)}{subtitle.length > 50 ? '...' : ''}
      </p>
    </button>
  )
}

// Language dropdown component - matches content-script design
function LangDropdown({
  value,
  onChange,
  disabled
}: {
  value: string
  onChange: (lang: string) => void
  disabled: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get language name from code
  const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === value)
  const displayName = selectedLang?.name || value

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleSelect = (langCode: string) => {
    onChange(langCode)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger - matches .vocab-source-lang-trigger / .vocab-target-lang-trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="inline-flex items-center gap-0.5 text-xs text-blue-500 cursor-pointer px-1 py-0.5 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {displayName}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-60">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown - matches .vocab-target-lang-dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-44 overflow-y-auto z-50 min-w-[110px]">
          {SUPPORTED_LANGUAGES.map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                lang.code === value
                  ? 'bg-blue-50 text-blue-500 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {lang.nativeName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
