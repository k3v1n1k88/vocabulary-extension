import type { Word, DictionaryResponse } from '@/types'

const FREE_DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en'

/**
 * Look up a word using Free Dictionary API
 */
export async function lookupWord(word: string): Promise<Word | null> {
  try {
    const response = await fetch(`${FREE_DICTIONARY_API}/${encodeURIComponent(word.toLowerCase())}`)

    if (!response.ok) {
      if (response.status === 404) {
        return null // Word not found
      }
      throw new Error(`API error: ${response.status}`)
    }

    const data: DictionaryResponse[] = await response.json()

    if (!data || data.length === 0) {
      return null
    }

    const entry = data[0]
    const meanings = entry.meanings || []
    const firstMeaning = meanings[0]
    const firstDefinition = firstMeaning?.definitions?.[0]

    // Find audio URL (prefer US pronunciation)
    const audioUrl = entry.phonetics?.find((p) => p.audio)?.audio || undefined

    // Collect synonyms from all meanings
    const synonyms: string[] = []
    meanings.forEach((m) => {
      m.definitions.forEach((d) => {
        if (d.synonyms) {
          synonyms.push(...d.synonyms.slice(0, 3))
        }
      })
    })

    // Collect examples
    const examples: string[] = []
    meanings.forEach((m) => {
      m.definitions.forEach((d) => {
        if (d.example) {
          examples.push(d.example)
        }
      })
    })

    const wordData: Word = {
      id: crypto.randomUUID(),
      word: entry.word,
      definition: firstDefinition?.definition || 'No definition available',
      pronunciation: entry.phonetic || entry.phonetics?.[0]?.text,
      partOfSpeech: firstMeaning?.partOfSpeech,
      audioUrl,
      synonyms: [...new Set(synonyms)].slice(0, 5),
      examples: examples.slice(0, 3),
      createdAt: Date.now()
    }

    return wordData
  } catch (error) {
    console.error('Dictionary lookup failed:', error)
    throw error
  }
}

/**
 * Simple Vietnamese translation using a placeholder
 * In production, integrate with Google Translate API or similar
 */
export async function translateToVietnamese(word: string): Promise<string> {
  // Placeholder translations for demo
  // In production, use a real translation API
  const translations: Record<string, string> = {
    ephemeral: 'phù du, tạm thời',
    ubiquitous: 'có mặt khắp nơi',
    serendipity: 'sự tình cờ may mắn',
    eloquent: 'hùng biện, lưu loát',
    resilient: 'kiên cường, bền bỉ'
  }

  return translations[word.toLowerCase()] || `[Bản dịch: ${word}]`
}

/**
 * Enhanced word lookup with Vietnamese translation
 */
export async function lookupWordWithTranslation(word: string): Promise<Word | null> {
  const wordData = await lookupWord(word)

  if (!wordData) {
    return null
  }

  const vietnameseTranslation = await translateToVietnamese(word)

  return {
    ...wordData,
    vietnameseTranslation
  }
}
