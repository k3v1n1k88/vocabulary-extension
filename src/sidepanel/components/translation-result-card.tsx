import { useState } from 'react'
import type { TranslationResult } from '@/types'
import { AiBadge, LangDropdown } from '@/shared/components'

export interface TranslationResultCardProps {
  result: TranslationResult
  onCopy: () => void
  onPlayAudio: () => void
  onOpenSettings: () => void
  onChangeSourceLang: (code: string) => void
  onChangeTargetLang: (code: string) => void
  sourceLang: string
  targetLang: string
  isRetranslating: boolean
  retranslateError: string | null
  useLLMTranslation: boolean
}

/**
 * Translation result card component
 * Displays translation with language selectors and actions
 * Design matches content-script tooltip for visual consistency
 */
export function TranslationResultCard({
  result,
  onCopy,
  onPlayAudio,
  onOpenSettings,
  onChangeSourceLang,
  onChangeTargetLang,
  sourceLang,
  targetLang,
  isRetranslating,
  retranslateError,
  useLLMTranslation
}: TranslationResultCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="m-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 line-clamp-2">{result.originalText}</h2>
              <button
                onClick={onPlayAudio}
                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors flex-shrink-0"
                title="Play pronunciation"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {/* Source language selector - only for free API */}
              {!useLLMTranslation ? (
                <LangDropdown
                  value={sourceLang}
                  onChange={onChangeSourceLang}
                  disabled={isRetranslating}
                />
              ) : (
                <span className="text-xs text-gray-500 px-1.5">{result.sourceLanguage}</span>
              )}
              <span className="text-xs text-gray-400">→</span>
              {/* Target language selector - always available */}
              <LangDropdown
                value={targetLang}
                onChange={onChangeTargetLang}
                disabled={isRetranslating}
              />
              {/* Loading indicator */}
              {isRetranslating && (
                <div className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin ml-1" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">
              {result.isPhrase ? 'Phrase' : 'Word'}
            </span>
            {/* AI/Free badge */}
            {useLLMTranslation ? (
              <AiBadge type="ai" />
            ) : (
              <AiBadge type="free" />
            )}
          </div>
        </div>
      </div>

      {/* Retranslate error */}
      {retranslateError && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
          {retranslateError}
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-3">
        {/* Translation */}
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Translation</span>
          <div className="mt-1.5 px-3 py-2.5 bg-emerald-50 border-l-[3px] border-emerald-500 rounded-lg">
            <p className="text-sm text-emerald-800 whitespace-pre-wrap leading-relaxed">{result.translatedText}</p>
          </div>
        </div>
      </div>

      {/* AI upsell hint for free users */}
      {!useLLMTranslation && (
        <div className="px-4 py-2 border-t border-dashed border-gray-200 text-center bg-gray-50/50">
          <button
            onClick={onOpenSettings}
            className="text-xs text-indigo-500 hover:text-indigo-600 hover:underline transition-colors"
          >
            ✨ Get better results with AI →
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-all active:scale-[0.98]"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span className="text-emerald-600">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy Translation
            </>
          )}
        </button>
      </div>
    </div>
  )
}
