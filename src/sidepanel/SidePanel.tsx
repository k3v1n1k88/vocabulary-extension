import { useState, useEffect } from 'react'
import type { Word } from '@/types'
import { DonateBar, FooterCredits } from '@/shared/components'
import { PanelHeader } from './components/panel-header'
import { EmptyState } from './components/empty-state'
import { ErrorState } from './components/error-state'
import { ResultCard } from './components/result-card'
import { HistoryList } from './components/history-list'
import { useSidePanelData, useRetranslate } from './hooks'

/**
 * Side Panel for displaying PDF lookup results.
 * Opens alongside PDF viewer for seamless vocabulary learning.
 */
export default function SidePanel() {
  const {
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
  } = useSidePanelData()

  const {
    isRetranslating,
    retranslateError,
    handleSourceLangChange,
    handleTargetLangChange
  } = useRetranslate({
    result,
    useLLMTranslation: settings.useLLMTranslation || false,
    sourceLang,
    targetLang,
    setResult,
    setSourceLang,
    setTargetLang
  })

  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<string | null>(null)

  // Add word/translation results to history when they arrive
  useEffect(() => {
    if (result?.type === 'word' || result?.type === 'translation') {
      addToHistory(result)
    }
  }, [result, addToHistory])

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

  const openSettingsPage = () => {
    chrome.runtime.sendMessage({
      type: 'OPEN_OPTIONS_PAGE',
      payload: { hash: 'settings-ai-translation' }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <PanelHeader isPdfSource={true} />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {result?.type === 'loading' ? (
          <div className="p-6 text-center">
            <div className="animate-spin w-8 h-8 mx-auto mb-3 border-2 border-primary-600 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-600">Looking up...</p>
            <p className="text-xs text-gray-400 mt-1 truncate px-4">"{result.text}"</p>
          </div>
        ) : result?.type === 'error' ? (
          <ErrorState
            message={result.error}
            onConfigureApiKey={openSettingsPage}
            onEnableAiMode={openSettingsPage}
          />
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
          <EmptyState />
        )}

        {/* History */}
        <HistoryList
          history={history}
          currentResult={result}
          onSelectItem={selectFromHistory}
          onClear={clearHistory}
        />
      </div>

      <DonateBar compact={true} />

      <FooterCredits />
    </div>
  )
}
