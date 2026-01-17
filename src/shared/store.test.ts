import { describe, it, expect, beforeEach } from 'vitest'
import { useVocabularyStore, useStatsStore, useSettingsStore, useUIStore } from './store'
import type { Word } from '@/types'

// Helper to create test word
const createWord = (overrides: Partial<Word> = {}): Word => ({
  id: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  word: 'test',
  definition: 'a test word',
  createdAt: Date.now(),
  ...overrides
})

describe('useVocabularyStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useVocabularyStore.setState({
      words: [],
      flashcards: new Map()
    })
  })

  describe('addWord', () => {
    it('adds a word to the store', () => {
      const word = createWord({ word: 'hello' })
      useVocabularyStore.getState().addWord(word)

      const state = useVocabularyStore.getState()
      expect(state.words).toHaveLength(1)
      expect(state.words[0].word).toBe('hello')
    })

    it('creates flashcard when adding word', () => {
      const word = createWord()
      useVocabularyStore.getState().addWord(word)

      const state = useVocabularyStore.getState()
      expect(state.flashcards.has(word.id)).toBe(true)

      const flashcard = state.flashcards.get(word.id)
      expect(flashcard).toBeDefined()
      expect(flashcard?.wordId).toBe(word.id)
      expect(flashcard?.repetitions).toBe(0)
      expect(flashcard?.easinessFactor).toBe(2.5)
    })

    it('prevents duplicate words (case-insensitive)', () => {
      const word1 = createWord({ word: 'Hello' })
      const word2 = createWord({ id: 'different-id', word: 'hello' })

      useVocabularyStore.getState().addWord(word1)
      useVocabularyStore.getState().addWord(word2)

      expect(useVocabularyStore.getState().words).toHaveLength(1)
    })

    it('allows different words', () => {
      const word1 = createWord({ word: 'hello' })
      const word2 = createWord({ word: 'world' })

      useVocabularyStore.getState().addWord(word1)
      useVocabularyStore.getState().addWord(word2)

      expect(useVocabularyStore.getState().words).toHaveLength(2)
    })
  })

  describe('removeWord', () => {
    it('removes word from store', () => {
      const word = createWord()
      useVocabularyStore.getState().addWord(word)
      useVocabularyStore.getState().removeWord(word.id)

      expect(useVocabularyStore.getState().words).toHaveLength(0)
    })

    it('removes associated flashcard', () => {
      const word = createWord()
      useVocabularyStore.getState().addWord(word)
      useVocabularyStore.getState().removeWord(word.id)

      expect(useVocabularyStore.getState().flashcards.has(word.id)).toBe(false)
    })

    it('does not affect other words', () => {
      const word1 = createWord({ word: 'hello' })
      const word2 = createWord({ word: 'world' })

      useVocabularyStore.getState().addWord(word1)
      useVocabularyStore.getState().addWord(word2)
      useVocabularyStore.getState().removeWord(word1.id)

      const state = useVocabularyStore.getState()
      expect(state.words).toHaveLength(1)
      expect(state.words[0].word).toBe('world')
    })
  })

  describe('updateWord', () => {
    it('updates word properties', () => {
      const word = createWord({ definition: 'original' })
      useVocabularyStore.getState().addWord(word)
      useVocabularyStore.getState().updateWord(word.id, { definition: 'updated' })

      const updatedWord = useVocabularyStore.getState().words[0]
      expect(updatedWord.definition).toBe('updated')
    })

    it('preserves other properties', () => {
      const word = createWord({ word: 'test', definition: 'original' })
      useVocabularyStore.getState().addWord(word)
      useVocabularyStore.getState().updateWord(word.id, { definition: 'updated' })

      const updatedWord = useVocabularyStore.getState().words[0]
      expect(updatedWord.word).toBe('test')
    })
  })

  describe('getWordById', () => {
    it('returns word when found', () => {
      const word = createWord()
      useVocabularyStore.getState().addWord(word)

      const found = useVocabularyStore.getState().getWordById(word.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(word.id)
    })

    it('returns undefined when not found', () => {
      const found = useVocabularyStore.getState().getWordById('nonexistent')
      expect(found).toBeUndefined()
    })
  })

  describe('getDueCards', () => {
    it('returns cards that are due', () => {
      const word = createWord()
      useVocabularyStore.getState().addWord(word)

      // New cards are immediately due
      const dueCards = useVocabularyStore.getState().getDueCards()
      expect(dueCards).toHaveLength(1)
      expect(dueCards[0].wordId).toBe(word.id)
    })

    it('excludes cards not yet due', () => {
      const word = createWord()
      useVocabularyStore.getState().addWord(word)

      // Set nextReview to far future
      useVocabularyStore.getState().updateFlashcard(word.id, {
        nextReview: Date.now() + 1000000000
      })

      const dueCards = useVocabularyStore.getState().getDueCards()
      expect(dueCards).toHaveLength(0)
    })

    it('sorts by nextReview ascending', () => {
      const word1 = createWord({ word: 'first' })
      const word2 = createWord({ word: 'second' })

      useVocabularyStore.getState().addWord(word1)
      useVocabularyStore.getState().addWord(word2)

      // Set different nextReview times
      useVocabularyStore.getState().updateFlashcard(word1.id, {
        nextReview: Date.now() - 2000
      })
      useVocabularyStore.getState().updateFlashcard(word2.id, {
        nextReview: Date.now() - 1000
      })

      const dueCards = useVocabularyStore.getState().getDueCards()
      expect(dueCards[0].wordId).toBe(word1.id)
      expect(dueCards[1].wordId).toBe(word2.id)
    })
  })

  describe('updateFlashcard', () => {
    it('updates flashcard properties', () => {
      const word = createWord()
      useVocabularyStore.getState().addWord(word)
      useVocabularyStore.getState().updateFlashcard(word.id, {
        repetitions: 3,
        interval: 10
      })

      const flashcard = useVocabularyStore.getState().flashcards.get(word.id)
      expect(flashcard?.repetitions).toBe(3)
      expect(flashcard?.interval).toBe(10)
    })
  })

  describe('addToStudy', () => {
    it('sets nextReview to now', () => {
      const word = createWord()
      useVocabularyStore.getState().addWord(word)

      // Set nextReview to future
      useVocabularyStore.getState().updateFlashcard(word.id, {
        nextReview: Date.now() + 1000000000
      })

      useVocabularyStore.getState().addToStudy(word.id)

      const flashcard = useVocabularyStore.getState().flashcards.get(word.id)
      expect(flashcard?.nextReview).toBeLessThanOrEqual(Date.now() + 100)
    })
  })

  describe('isWordDue', () => {
    it('returns true for due word', () => {
      const word = createWord()
      useVocabularyStore.getState().addWord(word)

      expect(useVocabularyStore.getState().isWordDue(word.id)).toBe(true)
    })

    it('returns false for not due word', () => {
      const word = createWord()
      useVocabularyStore.getState().addWord(word)
      useVocabularyStore.getState().updateFlashcard(word.id, {
        nextReview: Date.now() + 1000000000
      })

      expect(useVocabularyStore.getState().isWordDue(word.id)).toBe(false)
    })

    it('returns false for nonexistent word', () => {
      expect(useVocabularyStore.getState().isWordDue('nonexistent')).toBe(false)
    })
  })
})

describe('useStatsStore', () => {
  beforeEach(() => {
    useStatsStore.setState({
      stats: {
        totalWords: 0,
        wordsLearned: 0,
        totalReviews: 0,
        accuracy: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: '',
        totalStudyTime: 0,
        xp: 0,
        level: 1
      }
    })
  })

  describe('updateStats', () => {
    it('updates specified stats', () => {
      useStatsStore.getState().updateStats({ totalWords: 10, totalReviews: 5 })

      const stats = useStatsStore.getState().stats
      expect(stats.totalWords).toBe(10)
      expect(stats.totalReviews).toBe(5)
    })

    it('preserves other stats', () => {
      useStatsStore.getState().updateStats({ totalWords: 10 })

      const stats = useStatsStore.getState().stats
      expect(stats.xp).toBe(0)
      expect(stats.level).toBe(1)
    })
  })

  describe('addXP', () => {
    it('adds XP to stats', () => {
      useStatsStore.getState().addXP(100)
      expect(useStatsStore.getState().stats.xp).toBe(100)
    })

    it('accumulates XP', () => {
      useStatsStore.getState().addXP(100)
      useStatsStore.getState().addXP(200)
      expect(useStatsStore.getState().stats.xp).toBe(300)
    })

    it('calculates level based on XP (500 XP per level)', () => {
      useStatsStore.getState().addXP(500)
      expect(useStatsStore.getState().stats.level).toBe(2)

      useStatsStore.getState().addXP(500)
      expect(useStatsStore.getState().stats.level).toBe(3)
    })

    it('starts at level 1 with 0 XP', () => {
      expect(useStatsStore.getState().stats.level).toBe(1)
    })

    it('stays level 1 with < 500 XP', () => {
      useStatsStore.getState().addXP(499)
      expect(useStatsStore.getState().stats.level).toBe(1)
    })
  })

  describe('incrementStreak', () => {
    it('increments streak on first study', () => {
      useStatsStore.getState().incrementStreak()
      expect(useStatsStore.getState().stats.currentStreak).toBe(1)
    })

    it('sets lastStudyDate to today', () => {
      useStatsStore.getState().incrementStreak()
      const today = new Date().toISOString().split('T')[0]
      expect(useStatsStore.getState().stats.lastStudyDate).toBe(today)
    })

    it('does not increment if already studied today', () => {
      useStatsStore.getState().incrementStreak()
      useStatsStore.getState().incrementStreak()
      expect(useStatsStore.getState().stats.currentStreak).toBe(1)
    })

    it('updates longestStreak when currentStreak exceeds it', () => {
      useStatsStore.getState().incrementStreak()
      expect(useStatsStore.getState().stats.longestStreak).toBe(1)
    })
  })
})

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: {
        dailyGoal: 20,
        notificationsEnabled: true,
        theme: 'light',
        autoPlayAudio: true,
        showVietnamese: true,
        lookupShortcutEnabled: false,
        lookupShortcut: 'Ctrl+Shift+D',
        targetLanguage: 'vi',
        sourceLanguage: 'en',
        useLLMTranslation: false,
        llmProvider: 'openai'
      }
    })
  })

  describe('updateSettings', () => {
    it('updates specified settings', () => {
      useSettingsStore.getState().updateSettings({ dailyGoal: 30, theme: 'dark' })

      const settings = useSettingsStore.getState().settings
      expect(settings.dailyGoal).toBe(30)
      expect(settings.theme).toBe('dark')
    })

    it('preserves other settings', () => {
      useSettingsStore.getState().updateSettings({ dailyGoal: 30 })

      const settings = useSettingsStore.getState().settings
      expect(settings.notificationsEnabled).toBe(true)
      expect(settings.targetLanguage).toBe('vi')
    })
  })

  describe('default settings', () => {
    it('has sensible defaults', () => {
      const settings = useSettingsStore.getState().settings
      expect(settings.dailyGoal).toBe(20)
      expect(settings.llmProvider).toBe('openai')
      expect(settings.targetLanguage).toBe('vi')
    })
  })
})

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      activeTab: 'dashboard',
      isStudying: false
    })
  })

  describe('setActiveTab', () => {
    it('changes active tab', () => {
      useUIStore.getState().setActiveTab('vocabulary')
      expect(useUIStore.getState().activeTab).toBe('vocabulary')
    })
  })

  describe('setIsStudying', () => {
    it('sets studying state', () => {
      useUIStore.getState().setIsStudying(true)
      expect(useUIStore.getState().isStudying).toBe(true)
    })
  })
})
