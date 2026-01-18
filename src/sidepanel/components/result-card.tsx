import type { Word, TranslationResult } from '@/types'
import { WordResultCard } from './word-result-card'
import { TranslationResultCard } from './translation-result-card'

// Type for word or translation result only
type WordOrTranslationResult =
  | { type: 'word'; timestamp: number; data: Word }
  | { type: 'translation'; timestamp: number; data: TranslationResult }

export interface ResultCardProps {
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
}

/**
 * Result card orchestrator component
 * Routes to WordResultCard or TranslationResultCard based on result type
 */
export function ResultCard({
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
}: ResultCardProps) {
  const isWord = result.type === 'word'

  if (isWord) {
    const word = result.data as Word
    const isSaved = saved.has(word.id)
    const isSaving = saving === word.id

    return (
      <WordResultCard
        word={word}
        onSave={async () => onSave(word)}
        onPlayAudio={() => onPlayAudio(word.word, 'en')}
        onOpenSettings={() => {
          chrome.runtime.sendMessage({
            type: 'OPEN_OPTIONS_PAGE',
            payload: { hash: 'settings-ai-translation' }
          })
        }}
        isSaved={isSaved}
        isSaving={isSaving}
      />
    )
  }

  // Translation result
  const translation = result.data as TranslationResult
  return (
    <TranslationResultCard
      result={translation}
      onCopy={() => onCopy(translation.translatedText)}
      onPlayAudio={() => onPlayAudio(translation.originalText, translation.sourceLangCode || 'en')}
      onOpenSettings={() => {
        chrome.runtime.sendMessage({
          type: 'OPEN_OPTIONS_PAGE',
          payload: { hash: 'settings-ai-translation' }
        })
      }}
      onChangeSourceLang={onSourceLangChange}
      onChangeTargetLang={onTargetLangChange}
      sourceLang={sourceLang}
      targetLang={targetLang}
      isRetranslating={isRetranslating}
      retranslateError={retranslateError}
      useLLMTranslation={useLLMTranslation}
    />
  )
}
