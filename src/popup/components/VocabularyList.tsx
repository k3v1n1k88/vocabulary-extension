import { useState } from 'react'
import { useVocabularyStore, useUIStore } from '@/shared/store'
import { playPronunciation } from '@/shared/tts'
import type { Word } from '@/types'

export default function VocabularyList() {
  const { words, removeWord, addToStudy, isWordDue } = useVocabularyStore()
  const { setActiveTab } = useUIStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredWords = words.filter((word) =>
    word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    word.definition.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedWords = [...filteredWords].sort((a, b) => b.createdAt - a.createdAt)

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Delete this word?')) {
      removeWord(id)
    }
  }

  const handlePlayAudio = (word: Word, e: React.MouseEvent) => {
    e.stopPropagation()
    playPronunciation(word.word, word.audioUrl)
  }

  const handleAddToStudy = (wordId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    addToStudy(wordId)
    setActiveTab('study')
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search vocabulary..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Word count */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{sortedWords.length} word{sortedWords.length !== 1 ? 's' : ''}</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-primary-600 hover:underline"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Word list */}
      {sortedWords.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-gray-500">
            {searchQuery ? 'No matching words found' : 'No words saved yet'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Right-click on any word to look it up
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedWords.map((word) => (
            <div
              key={word.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div
                onClick={() => setExpandedId(expandedId === word.id ? null : word.id)}
                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{word.word}</span>
                    {word.partOfSpeech && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {word.partOfSpeech}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isWordDue(word.id) ? (
                      <span className="text-xs px-2 py-1 bg-primary-100 text-primary-600 rounded-full font-medium">
                        Studying
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleAddToStudy(word.id, e)}
                        className="text-xs px-2 py-1 bg-success-50 text-success-600 rounded-full font-medium hover:bg-success-100 transition-colors"
                      >
                        + Add to Study
                      </button>
                    )}
                    <button
                      onClick={(e) => handlePlayAudio(word, e)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(word.id, e)}
                      className="p-1.5 rounded-lg hover:bg-error-50 text-gray-400 hover:text-error-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === word.id ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{word.definition}</p>
              </div>

              {/* Expanded content */}
              {expandedId === word.id && (
                <div className="px-3 pb-3 pt-0 border-t border-gray-100 animate-slide-up">
                  {word.pronunciation && (
                    <p className="text-sm text-gray-500 mb-2">{word.pronunciation}</p>
                  )}
                  <p className="text-sm text-gray-700 mb-2">{word.definition}</p>
                  {word.vietnameseTranslation && (
                    <div className="bg-amber-50 p-2 rounded-lg mb-2">
                      <span className="text-xs text-amber-700">Translation: </span>
                      <span className="text-sm text-amber-900">{word.vietnameseTranslation}</span>
                    </div>
                  )}
                  {word.examples?.[0] && (
                    <p className="text-sm text-gray-500 italic mb-2">"{word.examples[0]}"</p>
                  )}
                  <div className="flex gap-3 mt-2">
                    {word.synonyms && word.synonyms.length > 0 && (
                      <div className="flex-1">
                        <span className="text-xs text-success-600 font-medium">Synonyms: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {word.synonyms.map((syn, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-success-50 text-success-700 rounded-full">
                              {syn}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {word.antonyms && word.antonyms.length > 0 && (
                      <div className="flex-1">
                        <span className="text-xs text-error-600 font-medium">Antonyms: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {word.antonyms.map((ant, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-error-50 text-error-700 rounded-full">
                              {ant}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
