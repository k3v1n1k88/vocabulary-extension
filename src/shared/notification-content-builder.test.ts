import { describe, it, expect } from 'vitest'
import { buildReminderContent } from './notification-content-builder'
import type { WordPreview } from './notification-helpers'

const fullWord: WordPreview = {
  word: 'example',
  definition: 'a representative form or pattern',
  translation: 'ví dụ',
  pronunciation: 'ɪɡˈzæmpəl',
  partOfSpeech: 'noun'
}

describe('buildReminderContent', () => {
  it('full word produces packed title + message + contextMessage', () => {
    const result = buildReminderContent(3, 5, fullWord)
    expect(result.title).toBe('📖 example /ɪɡˈzæmpəl/')
    expect(result.message).toBe('noun. a representative form or pattern')
    expect(result.contextMessage).toBe('ví dụ · +2 more cards waiting')
  })

  it('word without IPA drops pronunciation from title', () => {
    const result = buildReminderContent(1, 0, { ...fullWord, pronunciation: undefined })
    expect(result.title).toBe('📖 example')
  })

  it('word without partOfSpeech yields plain definition', () => {
    const result = buildReminderContent(1, 0, { ...fullWord, partOfSpeech: undefined })
    expect(result.message).toBe('a representative form or pattern')
  })

  it('dueCount = 1 with translation produces only translation in contextMessage', () => {
    const result = buildReminderContent(1, 0, fullWord)
    expect(result.contextMessage).toBe('ví dụ')
  })

  it('dueCount = 5 without translation produces only the +N suffix', () => {
    const result = buildReminderContent(5, 0, { ...fullWord, translation: undefined })
    expect(result.contextMessage).toBe('+4 more cards waiting')
  })

  it('dueCount = 1 without translation produces no contextMessage', () => {
    const result = buildReminderContent(1, 0, { ...fullWord, translation: undefined })
    expect(result.contextMessage).toBeUndefined()
  })

  it('no word + dueCount > 0 falls back to due-count message', () => {
    const result = buildReminderContent(3, 0, undefined)
    expect(result.title).toBe('Time to Study!')
    expect(result.message).toBe('You have 3 cards waiting for review!')
  })

  it('no word + no due cards + streak > 0 falls back to streak message', () => {
    const result = buildReminderContent(0, 4, undefined)
    expect(result.title).toBe('Time to Study!')
    expect(result.message).toBe('Keep your 4-day streak going!')
  })

  it('no word + no due + no streak falls back to generic message', () => {
    const result = buildReminderContent(0, 0, undefined)
    expect(result.title).toBe('Time to Study!')
    expect(result.message).toBe('Start building your vocabulary today!')
  })

  it('truncates definition longer than 100 chars', () => {
    const longDef = 'a'.repeat(150)
    const result = buildReminderContent(0, 0, { ...fullWord, definition: longDef })
    expect(result.message).toBe('noun. ' + 'a'.repeat(100))
  })

  it('drops IPA when title would exceed 50 chars', () => {
    const longIpa = 'x'.repeat(60)
    const result = buildReminderContent(0, 0, { ...fullWord, pronunciation: longIpa })
    expect(result.title).toBe('📖 example')
  })

  it('omits contextMessage entirely when empty (no translation, due ≤ 1)', () => {
    const result = buildReminderContent(0, 0, { ...fullWord, translation: undefined })
    expect(result.contextMessage).toBeUndefined()
  })

  it('truncates translation longer than 60 chars', () => {
    const longTranslation = 'á'.repeat(80)
    const result = buildReminderContent(3, 0, { ...fullWord, translation: longTranslation })
    expect(result.contextMessage).toBe('á'.repeat(60) + ' · +2 more cards waiting')
  })
})
