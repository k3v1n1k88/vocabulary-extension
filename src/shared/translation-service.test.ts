import { describe, it, expect } from 'vitest'
import { isPhrase } from './translation-service'

describe('isPhrase', () => {
  describe('single words', () => {
    it('returns false for single word', () => {
      expect(isPhrase('hello')).toBe(false)
    })

    it('returns false for single word with leading/trailing spaces', () => {
      expect(isPhrase('  hello  ')).toBe(false)
    })

    it('returns false for hyphenated word', () => {
      expect(isPhrase('well-known')).toBe(false)
    })

    it('returns false for word with apostrophe', () => {
      expect(isPhrase("don't")).toBe(false)
    })
  })

  describe('multiple words (phrases)', () => {
    it('returns true for two words', () => {
      expect(isPhrase('hello world')).toBe(true)
    })

    it('returns true for multiple words', () => {
      expect(isPhrase('this is a phrase')).toBe(true)
    })

    it('returns true for phrase with extra whitespace', () => {
      expect(isPhrase('  hello   world  ')).toBe(true)
    })

    it('returns true for phrase with tabs', () => {
      expect(isPhrase('hello\tworld')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('returns false for empty string', () => {
      expect(isPhrase('')).toBe(false)
    })

    it('returns false for whitespace only', () => {
      expect(isPhrase('   ')).toBe(false)
    })

    it('handles newlines as word separators', () => {
      expect(isPhrase('hello\nworld')).toBe(true)
    })
  })
})

// Note: translateText, testConnection, saveApiKey require mocking fetch and chrome.storage
// These are integration tests that would need more complex setup
// For now, we focus on pure function tests as per YAGNI
