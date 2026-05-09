/**
 * Pure content-building for the study-reminder notification.
 * No Chrome APIs, no storage. Inputs: due count, streak, optional word preview.
 */

import type { WordPreview } from './notification-helpers'

const TITLE_MAX_LEN = 50
const DEFINITION_MAX_LEN = 100
const TRANSLATION_MAX_LEN = 60
const FALLBACK_TITLE = 'Time to Study!'

export interface ReminderContent {
  title: string
  message: string
  contextMessage?: string
}

// Free Dictionary API stores phonetics already wrapped (e.g. "/baɪˈlɪŋɡjuəl/"); some sources
// use [...] brackets. Strip surrounding slashes/brackets and re-wrap consistently with /.../.
function normalizeIpa(raw: string): string {
  const trimmed = raw.trim().replace(/^[/[]+|[/\]]+$/g, '')
  return trimmed ? `/${trimmed}/` : ''
}

function buildTitle(randomWord?: WordPreview): string {
  if (!randomWord?.word) return FALLBACK_TITLE
  const base = `📖 ${randomWord.word}`
  if (randomWord.pronunciation) {
    const ipa = normalizeIpa(randomWord.pronunciation)
    if (ipa) {
      const withIpa = `${base} ${ipa}`
      if (withIpa.length <= TITLE_MAX_LEN) return withIpa
    }
  }
  return base
}

function buildMessage(
  randomWord: WordPreview | undefined,
  dueCount: number,
  streak: number
): string {
  if (randomWord?.word) {
    const def = randomWord.definition.slice(0, DEFINITION_MAX_LEN)
    return randomWord.partOfSpeech ? `${randomWord.partOfSpeech}. ${def}` : def
  }
  if (dueCount > 0) return `You have ${dueCount} cards waiting for review!`
  if (streak > 0) return `Keep your ${streak}-day streak going!`
  return 'Start building your vocabulary today!'
}

function buildContextMessage(
  randomWord: WordPreview | undefined,
  dueCount: number
): string | undefined {
  const parts: string[] = []
  if (randomWord?.translation) parts.push(randomWord.translation.slice(0, TRANSLATION_MAX_LEN))
  if (dueCount > 1) parts.push(`+${dueCount - 1} more cards waiting`)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

export function buildReminderContent(
  dueCount: number,
  streak: number,
  randomWord?: WordPreview
): ReminderContent {
  const title = buildTitle(randomWord)
  const message = buildMessage(randomWord, dueCount, streak)
  const contextMessage = buildContextMessage(randomWord, dueCount)
  return contextMessage ? { title, message, contextMessage } : { title, message }
}
