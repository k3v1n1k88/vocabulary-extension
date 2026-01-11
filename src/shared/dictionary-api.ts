import type { Word, DictionaryResponse } from '@/types'
import { translateToTargetLanguage as openaiTranslate } from './openai-translation'

const FREE_DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en'

/**
 * Look up a word using Free Dictionary API
 */
export async function lookupWord(word: string): Promise<Word | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(
      `${FREE_DICTIONARY_API}/${encodeURIComponent(word.toLowerCase())}`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

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

    // Collect antonyms from all meanings
    const antonyms: string[] = []
    meanings.forEach((m) => {
      m.definitions.forEach((d) => {
        if (d.antonyms) {
          antonyms.push(...d.antonyms.slice(0, 3))
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
      antonyms: [...new Set(antonyms)].slice(0, 5),
      examples: examples.slice(0, 3),
      createdAt: Date.now()
    }

    return wordData
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    console.error('Dictionary lookup failed:', error)
    throw error
  }
}

/**
 * Translate word using OpenAI to user's configured language
 * Returns full translation result including synonyms/antonyms
 */
export async function translateWord(word: string): Promise<{
  translation: string
  synonyms?: string[]
  antonyms?: string[]
}> {
  try {
    const result = await openaiTranslate(word)
    return {
      translation: result.translatedText,
      synonyms: result.synonyms,
      antonyms: result.antonyms
    }
  } catch (error) {
    // If OpenAI fails (no API key, etc.), return placeholder
    console.warn('Translation failed, using placeholder:', error)
    return { translation: `[API key required]` }
  }
}

/**
 * Enhanced word lookup with translation
 * Merges synonyms/antonyms from OpenAI when dictionary doesn't have them
 */
export async function lookupWordWithTranslation(word: string): Promise<Word | null> {
  const wordData = await lookupWord(word)

  if (!wordData) {
    return null
  }

  const translationResult = await translateWord(word)

  // Merge synonyms: use dictionary's, supplement with OpenAI's
  const mergedSynonyms = wordData.synonyms?.length
    ? wordData.synonyms
    : translationResult.synonyms

  // Merge antonyms: use dictionary's, supplement with OpenAI's
  const mergedAntonyms = wordData.antonyms?.length
    ? wordData.antonyms
    : translationResult.antonyms

  return {
    ...wordData,
    vietnameseTranslation: translationResult.translation,
    synonyms: mergedSynonyms,
    antonyms: mergedAntonyms
  }
}
