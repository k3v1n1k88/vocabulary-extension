/**
 * Custom hook for SidePanel data management.
 * Handles loading, storing, and syncing PDF lookup results and history.
 */

import { useState, useEffect } from 'react'
import type { PdfLookupResult, UserSettings } from '@/types'
import { SETTINGS_KEY, getSettings } from '@/shared/settings-storage-access'

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
        // Load user settings (sync-first; legacy local fallback handled in helper).
        const userSettings = await getSettings<UserSettings>()
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

    // Listen for settings changes — settings now live in sync storage.
    const handleSettingsChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== 'sync') return
      if (changes[SETTINGS_KEY]?.newValue) {
        try {
          const parsed = JSON.parse(changes[SETTINGS_KEY].newValue)
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
    chrome.storage.onChanged.addListener(handleSettingsChange)
    return () => {
      chrome.storage.session?.onChanged.removeListener(handleSessionChange)
      chrome.storage.onChanged.removeListener(handleSettingsChange)
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
