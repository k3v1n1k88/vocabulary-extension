/**
 * Custom hook for SidePanel data management.
 * Handles loading, storing, and syncing PDF lookup results and history.
 */

import { useState, useEffect } from 'react'
import type { PdfLookupResult, UserSettings } from '@/types'

// Only word/translation results (not loading/error) for history
export type HistoryItem = Extract<PdfLookupResult, { type: 'word' } | { type: 'translation' }>

interface SidePanelDataState {
  result: PdfLookupResult | null
  history: HistoryItem[]
  settings: Partial<UserSettings>
  sourceLang: string
  targetLang: string
}

interface SidePanelDataActions {
  setResult: (result: PdfLookupResult | null) => void
  addToHistory: (item: PdfLookupResult) => Promise<void>
  clearHistory: () => Promise<void>
  selectFromHistory: (item: PdfLookupResult) => void
  setSourceLang: (lang: string) => void
  setTargetLang: (lang: string) => void
}

/**
 * Parse settings from storage result.
 */
function parseSettings(settingsData: Record<string, string>): UserSettings | null {
  if (!settingsData['settings-storage']) return null
  try {
    const parsed = JSON.parse(settingsData['settings-storage'])
    return parsed?.state?.settings as UserSettings
  } catch {
    console.warn('[VocabExt] Failed to parse settings')
    return null
  }
}

/**
 * Create history item key for deduplication.
 */
function getHistoryItemKey(item: HistoryItem): string {
  return item.type === 'word' ? item.data.word : item.data.originalText
}

export function useSidePanelData(): SidePanelDataState & SidePanelDataActions {
  const [result, setResult] = useState<PdfLookupResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    useLLMTranslation: false,
    targetLanguage: 'vi',
    sourceLanguage: 'en'
  })
  const [sourceLang, setSourceLang] = useState('en')
  const [targetLang, setTargetLang] = useState('vi')

  // Load settings and result on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user settings
        const settingsData = await chrome.storage.local.get('settings-storage')
        const userSettings = parseSettings(settingsData)
        if (userSettings) {
          setSettings(userSettings)
          setSourceLang(userSettings.sourceLanguage || 'en')
          setTargetLang(userSettings.targetLanguage || 'vi')
        }

        // Get current result
        const sessionData = await chrome.storage.session.get('pdfLookupResult')
        if (sessionData.pdfLookupResult) {
          setResult(sessionData.pdfLookupResult)
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

    // Listen for new results (session storage)
    const handleSessionChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.pdfLookupResult?.newValue) {
        const newResult = changes.pdfLookupResult.newValue as PdfLookupResult
        setResult(newResult)
      }
    }

    // Listen for settings changes (local storage)
    const handleLocalChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes['settings-storage']?.newValue) {
        try {
          const parsed = JSON.parse(changes['settings-storage'].newValue)
          const userSettings = parsed?.state?.settings as UserSettings
          if (userSettings) {
            setSettings(userSettings)
            setSourceLang(userSettings.sourceLanguage || 'en')
            setTargetLang(userSettings.targetLanguage || 'vi')
          }
        } catch {
          console.warn('[VocabExt] Failed to parse settings change')
        }
      }
    }

    chrome.storage.session?.onChanged.addListener(handleSessionChange)
    chrome.storage.local?.onChanged.addListener(handleLocalChange)
    return () => {
      chrome.storage.session?.onChanged.removeListener(handleSessionChange)
      chrome.storage.local?.onChanged.removeListener(handleLocalChange)
    }
  }, [])

  const addToHistory = async (item: PdfLookupResult) => {
    // Only handle word/translation types
    if (item.type !== 'word' && item.type !== 'translation') return

    const historyItem = item as HistoryItem
    const itemKey = getHistoryItemKey(historyItem)

    setHistory(prev => {
      const filtered = prev.filter(h => getHistoryItemKey(h) !== itemKey)
      const newHistory = [historyItem, ...filtered].slice(0, 20) // Keep last 20
      chrome.storage.session.set({ pdfLookupHistory: newHistory })
      return newHistory
    })
  }

  const clearHistory = async () => {
    setHistory([])
    await chrome.storage.session.remove('pdfLookupHistory')
  }

  const selectFromHistory = (item: PdfLookupResult) => {
    setResult(item)
  }

  return {
    result,
    history,
    settings,
    sourceLang,
    targetLang,
    setResult,
    addToHistory,
    clearHistory,
    selectFromHistory,
    setSourceLang,
    setTargetLang
  }
}
