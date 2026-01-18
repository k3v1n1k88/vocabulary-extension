/**
 * Flashcard Component.
 * Interactive flip card showing word on front, definition on back.
 */

import type { Word } from '@/types'

interface FlashcardProps {
  word: Word
  isFlipped: boolean
  onFlip: () => void
  onPlayAudio: () => void
}

export function Flashcard({ word, isFlipped, onFlip, onPlayAudio }: FlashcardProps) {
  return (
    <div
      className={`flip-card cursor-pointer ${isFlipped ? 'flipped' : ''}`}
      onClick={onFlip}
    >
      <div className="flip-card-inner relative h-80">
        {/* Front - Word & Pronunciation */}
        <FlashcardFront word={word} onPlayAudio={onPlayAudio} />

        {/* Back - Definition, Translation, Example */}
        <FlashcardBack word={word} />
      </div>
    </div>
  )
}

interface FlashcardFrontProps {
  word: Word
  onPlayAudio: () => void
}

function FlashcardFront({ word, onPlayAudio }: FlashcardFrontProps) {
  return (
    <div className="flip-card-front absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center backface-hidden">
      <h2 className="text-3xl font-bold text-white mb-2">{word.word}</h2>
      {word.pronunciation && (
        <span className="text-primary-100 text-base mb-4">{word.pronunciation}</span>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPlayAudio()
          }}
          className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
        {word.partOfSpeech && (
          <span className="px-3 py-1 bg-white/20 text-white text-sm rounded-full">
            {word.partOfSpeech}
          </span>
        )}
      </div>
      <p className="text-xs text-primary-200 mt-6">Tap to reveal answer</p>
    </div>
  )
}

interface FlashcardBackProps {
  word: Word
}

function FlashcardBack({ word }: FlashcardBackProps) {
  return (
    <div
      className="flip-card-back absolute inset-0 bg-white rounded-xl shadow-lg border border-gray-100 p-5 overflow-y-auto backface-hidden"
      style={{ transform: 'rotateY(180deg)' }}
    >
      {/* Definition */}
      <div className="mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Definition</span>
        <p className="text-gray-800 text-sm mt-1">{word.definition}</p>
      </div>

      {/* Translation */}
      {word.vietnameseTranslation && (
        <div className="bg-amber-50 p-3 rounded-lg mb-3 border-l-3 border-amber-400">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Translation</span>
          <p className="text-amber-900 mt-1">{word.vietnameseTranslation}</p>
        </div>
      )}

      {/* Example */}
      {word.examples?.[0] && (
        <div className="mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Example</span>
          <p className="text-gray-600 text-sm mt-1 italic pl-3 border-l-2 border-primary-300">
            "{word.examples[0]}"
          </p>
        </div>
      )}

      {/* Synonyms & Antonyms */}
      <div className="flex gap-4">
        {word.synonyms && word.synonyms.length > 0 && (
          <div className="flex-1">
            <span className="text-xs font-semibold text-success-600 uppercase tracking-wide">Synonyms</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {word.synonyms.slice(0, 4).map((syn, i) => (
                <span key={i} className="px-2 py-0.5 bg-success-50 text-success-700 text-xs rounded-full">
                  {syn}
                </span>
              ))}
            </div>
          </div>
        )}
        {word.antonyms && word.antonyms.length > 0 && (
          <div className="flex-1">
            <span className="text-xs font-semibold text-error-600 uppercase tracking-wide">Antonyms</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {word.antonyms.slice(0, 4).map((ant, i) => (
                <span key={i} className="px-2 py-0.5 bg-error-50 text-error-700 text-xs rounded-full">
                  {ant}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
