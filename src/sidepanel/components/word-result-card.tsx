import type { Word } from '@/types'
import { AiBadge } from '@/shared/components'

export interface WordResultCardProps {
  word: Word
  onSave: () => Promise<void>
  onPlayAudio: () => void
  onOpenSettings: () => void
  isSaved: boolean
  isSaving: boolean
}

/**
 * Word result card component
 * Displays word definition, translation, examples, synonyms, antonyms
 * Design matches content-script tooltip for visual consistency
 */
export function WordResultCard({
  word,
  onSave,
  onPlayAudio,
  onOpenSettings,
  isSaved,
  isSaving
}: WordResultCardProps) {
  return (
    <div className="m-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">{word.word}</h2>
            <button
              onClick={onPlayAudio}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
              title="Play pronunciation"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            </button>
          </div>
          {/* AI/Free badge */}
          {word.isFreeTranslation === false ? (
            <AiBadge type="ai" />
          ) : word.isFreeTranslation === true ? (
            <AiBadge type="free" />
          ) : null}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {word.pronunciation && (
            <span className="text-sm text-gray-500">{word.pronunciation}</span>
          )}
          {word.partOfSpeech && (
            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded italic">{word.partOfSpeech}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {/* Definition */}
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Definition</span>
          <p className="text-sm text-gray-800 mt-0.5 leading-relaxed">{word.definition}</p>
        </div>

        {/* Translation */}
        {word.vietnameseTranslation && (
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Translation</span>
            <div className="mt-1.5 px-3 py-2 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-900">{word.vietnameseTranslation}</p>
            </div>
          </div>
        )}

        {/* Example */}
        {word.examples && word.examples.length > 0 && (
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Example</span>
            <p className="text-sm text-gray-600 italic mt-0.5">"{word.examples[0]}"</p>
          </div>
        )}

        {/* Synonyms */}
        {word.synonyms && word.synonyms.length > 0 && (
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Synonyms</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {word.synonyms.slice(0, 6).map((s, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Antonyms */}
        {word.antonyms && word.antonyms.length > 0 && (
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Antonyms</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {word.antonyms.slice(0, 6).map((a, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full">{a}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI upsell hint for free users */}
      {word.isFreeTranslation === true && (
        <div className="px-4 py-2 border-t border-dashed border-gray-200 text-center bg-gray-50/50">
          <button
            onClick={onOpenSettings}
            className="text-xs text-indigo-500 hover:text-indigo-600 hover:underline transition-colors"
          >
            ✨ Get better results with AI →
          </button>
        </div>
      )}

      {/* Save button */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <button
          onClick={onSave}
          disabled={isSaved || isSaving}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
            isSaved
              ? 'bg-emerald-100 text-emerald-700 cursor-default'
              : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]'
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
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
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
    </div>
  )
}
