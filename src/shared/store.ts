import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Word, FlashcardData, UserStats, UserSettings, TabType } from '@/types'

// Chrome storage adapter for Zustand
const chromeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const result = await chrome.storage.local.get(name)
    return result[name] ?? null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await chrome.storage.local.set({ [name]: value })
  },
  removeItem: async (name: string): Promise<void> => {
    await chrome.storage.local.remove(name)
  }
}

// Vocabulary store
interface VocabularyState {
  words: Word[]
  flashcards: Map<string, FlashcardData>
  addWord: (word: Word) => void
  removeWord: (id: string) => void
  updateWord: (id: string, updates: Partial<Word>) => void
  getWordById: (id: string) => Word | undefined
  getDueCards: () => FlashcardData[]
  updateFlashcard: (wordId: string, data: Partial<FlashcardData>) => void
}

export const useVocabularyStore = create<VocabularyState>()(
  persist(
    (set, get) => ({
      words: [],
      flashcards: new Map(),

      addWord: (word) => {
        set((state) => {
          // Check if word already exists
          if (state.words.some((w) => w.word.toLowerCase() === word.word.toLowerCase())) {
            return state
          }
          // Create initial flashcard data
          const flashcard: FlashcardData = {
            wordId: word.id,
            repetitions: 0,
            easinessFactor: 2.5,
            interval: 1,
            nextReview: Date.now()
          }
          const newFlashcards = new Map(state.flashcards)
          newFlashcards.set(word.id, flashcard)
          return {
            words: [...state.words, word],
            flashcards: newFlashcards
          }
        })
      },

      removeWord: (id) => {
        set((state) => {
          const newFlashcards = new Map(state.flashcards)
          newFlashcards.delete(id)
          return {
            words: state.words.filter((w) => w.id !== id),
            flashcards: newFlashcards
          }
        })
      },

      updateWord: (id, updates) => {
        set((state) => ({
          words: state.words.map((w) => (w.id === id ? { ...w, ...updates } : w))
        }))
      },

      getWordById: (id) => get().words.find((w) => w.id === id),

      getDueCards: () => {
        const now = Date.now()
        const cards: FlashcardData[] = []
        get().flashcards.forEach((card) => {
          if (card.nextReview <= now) {
            cards.push(card)
          }
        })
        return cards.sort((a, b) => a.nextReview - b.nextReview)
      },

      updateFlashcard: (wordId, data) => {
        set((state) => {
          const newFlashcards = new Map(state.flashcards)
          const existing = newFlashcards.get(wordId)
          if (existing) {
            newFlashcards.set(wordId, { ...existing, ...data })
          }
          return { flashcards: newFlashcards }
        })
      }
    }),
    {
      name: 'vocabulary-storage',
      storage: createJSONStorage(() => chromeStorage),
      partialize: (state) => ({
        words: state.words,
        flashcards: Array.from(state.flashcards.entries())
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
        flashcards: new Map((persisted as { flashcards?: [string, FlashcardData][] })?.flashcards || [])
      })
    }
  )
)

// User stats store
interface StatsState {
  stats: UserStats
  updateStats: (updates: Partial<UserStats>) => void
  incrementStreak: () => void
  addXP: (amount: number) => void
}

const defaultStats: UserStats = {
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

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      stats: defaultStats,

      updateStats: (updates) => {
        set((state) => ({
          stats: { ...state.stats, ...updates }
        }))
      },

      incrementStreak: () => {
        const today = new Date().toISOString().split('T')[0]
        const { stats } = get()

        if (stats.lastStudyDate === today) return

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        const newStreak = stats.lastStudyDate === yesterdayStr ? stats.currentStreak + 1 : 1

        set((state) => ({
          stats: {
            ...state.stats,
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, state.stats.longestStreak),
            lastStudyDate: today
          }
        }))
      },

      addXP: (amount) => {
        set((state) => {
          const newXP = state.stats.xp + amount
          // Level up every 500 XP
          const newLevel = Math.floor(newXP / 500) + 1
          return {
            stats: {
              ...state.stats,
              xp: newXP,
              level: newLevel
            }
          }
        })
      }
    }),
    {
      name: 'stats-storage',
      storage: createJSONStorage(() => chromeStorage)
    }
  )
)

// Settings store
interface SettingsState {
  settings: UserSettings
  updateSettings: (updates: Partial<UserSettings>) => void
}

const defaultSettings: UserSettings = {
  dailyGoal: 20,
  notificationsEnabled: true,
  theme: 'light',
  autoPlayAudio: true,
  showVietnamese: true
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates }
        }))
      }
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => chromeStorage)
    }
  )
)

// UI state store (not persisted)
interface UIState {
  activeTab: TabType
  isStudying: boolean
  setActiveTab: (tab: TabType) => void
  setIsStudying: (studying: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'dashboard',
  isStudying: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsStudying: (studying) => set({ isStudying: studying })
}))
