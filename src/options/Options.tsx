import { useState, useEffect } from 'react'
import { useSettingsStore, useStatsStore, useVocabularyStore } from '@/shared/store'
import { saveApiKey, testConnection } from '@/shared/translation-service'
import { LLM_PROVIDERS, getProviderConfig } from '@/shared/llm-provider-config'
import { SUPPORTED_LANGUAGES } from '@/types'
import type { LLMProvider } from '@/types'
import Dashboard from '@/popup/components/Dashboard'
import StudyView from '@/popup/components/StudyView'
import VocabularyList from '@/popup/components/VocabularyList'

type OptionsTab = 'dashboard' | 'study' | 'vocabulary' | 'settings'

const tabs: { id: OptionsTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    id: 'study',
    label: 'Study',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
]

export default function Options() {
  const [activeTab, setActiveTab] = useState<OptionsTab>(() => {
    // Check URL hash for direct tab navigation (e.g., #settings or #settings-apikey)
    const hash = window.location.hash.slice(1)
    const tabPart = hash.split('-')[0] as OptionsTab
    if (['dashboard', 'study', 'vocabulary', 'settings'].includes(tabPart)) {
      return tabPart
    }
    return 'dashboard'
  })
  const { getDueCards } = useVocabularyStore()
  const dueCount = getDueCards().length

  // Scroll to element if hash contains element id (e.g., #settings-apikey)
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash && hash.includes('-')) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        const element = document.getElementById(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Highlight briefly
          element.style.transition = 'background-color 0.3s'
          element.style.backgroundColor = '#fef3c7'
          setTimeout(() => {
            element.style.backgroundColor = ''
          }, 2000)
        }
      }, 100)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-success-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Vocabulary</h1>
              <p className="text-xs text-gray-500">Builder</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-primary-500' : 'text-gray-400'}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  {tab.id === 'study' && dueCount > 0 && (
                    <span className="ml-auto bg-error-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {dueCount}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>v1.0.0 · Kevin Nguyen</span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <a
              href="https://chromewebstore.google.com/detail/vocabulary-builder/gjnopcfejkppaihaamfhdonlijjkfkdj"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-amber-500 px-1.5 py-0.5 rounded hover:bg-amber-50 transition-colors"
              title="Rate on Chrome Web Store"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Rate
            </a>
            <a
              href="https://github.com/k3v1n1k88/vocabulary-extension-issues/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
              title="Report an issue"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Issue
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'study' && <StudyView />}
          {activeTab === 'vocabulary' && <VocabularyList />}
          {activeTab === 'settings' && <SettingsContent />}
        </div>
      </main>
    </div>
  )
}

function SettingsContent() {
  const { settings, updateSettings } = useSettingsStore()
  const { stats } = useStatsStore()
  const { words } = useVocabularyStore()
  const [isRecordingShortcut, setIsRecordingShortcut] = useState(false)

  // Multi-provider API key state
  const [providerApiKeys, setProviderApiKeys] = useState<Record<LLMProvider, { value: string; saved: boolean }>>({
    openai: { value: '', saved: false },
    gemini: { value: '', saved: false },
    grok: { value: '', saved: false }
  })
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ status: 'idle' })

  // Load API keys for all providers on mount
  useEffect(() => {
    LLM_PROVIDERS.forEach(provider => {
      chrome.storage.local.get([provider.apiKeyStorageKey], (result) => {
        const key = result[provider.apiKeyStorageKey]
        if (key) {
          setProviderApiKeys(prev => ({
            ...prev,
            [provider.id]: {
              value: '••••••••••••••••••••' + key.slice(-4),
              saved: true
            }
          }))
        }
      })
    })
  }, [])

  // Current provider config and state
  const currentProvider = getProviderConfig(settings.llmProvider || 'openai')
  const currentKeyState = providerApiKeys[currentProvider.id]

  const handleSaveProviderApiKey = async () => {
    const keyValue = currentKeyState.value
    if (keyValue && !keyValue.startsWith('••••')) {
      await saveApiKey(keyValue, currentProvider.id)
      setProviderApiKeys(prev => ({
        ...prev,
        [currentProvider.id]: {
          value: '••••••••••••••••••••' + keyValue.slice(-4),
          saved: true
        }
      }))
      setTestResult({ status: 'idle' })
    }
  }

  const handleClearProviderApiKey = async () => {
    await chrome.storage.local.remove(currentProvider.apiKeyStorageKey)
    setProviderApiKeys(prev => ({
      ...prev,
      [currentProvider.id]: { value: '', saved: false }
    }))
    setTestResult({ status: 'idle' })
  }

  const handleApiKeyChange = (value: string) => {
    setProviderApiKeys(prev => ({
      ...prev,
      [currentProvider.id]: { value, saved: false }
    }))
    setTestResult({ status: 'idle' })
  }

  const handleTestConnection = async () => {
    const keyValue = currentKeyState.value
    if (!keyValue || keyValue.startsWith('••••')) {
      setTestResult({ status: 'error', message: 'Enter a new API key to test' })
      return
    }

    setTestResult({ status: 'testing' })
    try {
      await testConnection(currentProvider.id, keyValue)
      setTestResult({ status: 'success', message: 'Connection successful!' })
    } catch (error) {
      setTestResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection failed'
      })
    }
  }

  useEffect(() => {
    if (!isRecordingShortcut) return

    let lastModifier: string | null = null

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const key = e.key.toUpperCase()

      if (key === 'ALT' || key === 'META') {
        lastModifier = 'Alt'
        return
      }
      if (key === 'CONTROL') {
        lastModifier = 'Ctrl'
        return
      }
      if (key === 'SHIFT') {
        lastModifier = 'Shift'
        return
      }

      lastModifier = null
      const parts: string[] = []
      if (e.ctrlKey || e.metaKey) parts.push('Ctrl')
      if (e.altKey) parts.push('Alt')
      if (e.shiftKey) parts.push('Shift')

      const isFunctionKey = /^F\d+$/.test(key)
      const keyName = key.length === 1 ? key : e.code.replace('Key', '').replace('Digit', '')
      parts.push(keyName)

      const isValid = parts.length >= 2 || isFunctionKey
      if (isValid) {
        updateSettings({ lookupShortcut: parts.join('+') })
        setIsRecordingShortcut(false)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      if (lastModifier && ['ALT', 'CONTROL', 'SHIFT', 'META'].includes(key)) {
        updateSettings({ lookupShortcut: lastModifier })
        setIsRecordingShortcut(false)
        lastModifier = null
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isRecordingShortcut, updateSettings])

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 mt-1">Customize your learning experience</p>
      </header>

      {/* Stats Overview */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Progress</h2>
        <div className="grid grid-cols-4 gap-4">
          <StatItem label="Total Words" value={words.length} />
          <StatItem label="Current Streak" value={`${stats.currentStreak} days`} />
          <StatItem label="Total Reviews" value={stats.totalReviews} />
          <StatItem label="Level" value={stats.level} />
        </div>
      </section>

      {/* Learning Settings */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Learning Settings</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Goal (words per day)
            </label>
            <input
              type="number"
              min={5}
              max={100}
              value={settings.dailyGoal}
              onChange={(e) => updateSettings({ dailyGoal: Number(e.target.value) })}
              className="w-32 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-700">Auto-play pronunciation</div>
              <div className="text-sm text-gray-500">Play audio when viewing flashcards</div>
            </div>
            <Toggle
              checked={settings.autoPlayAudio}
              onChange={(checked) => updateSettings({ autoPlayAudio: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-700">Show translation</div>
              <div className="text-sm text-gray-500">Display translation in word lookups</div>
            </div>
            <Toggle
              checked={settings.showVietnamese}
              onChange={(checked) => updateSettings({ showVietnamese: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-700">Study reminders</div>
              <div className="text-sm text-gray-500">Get periodic notifications to study</div>
            </div>
            <Toggle
              checked={settings.notificationsEnabled}
              onChange={(checked) => {
                updateSettings({ notificationsEnabled: checked })
                chrome.runtime.sendMessage({
                  type: 'UPDATE_REMINDER',
                  payload: { reminderInterval: settings.reminderInterval, enabled: checked }
                })
              }}
            />
          </div>

          {settings.notificationsEnabled && (
            <div className="ml-4 pl-4 border-l-2 border-primary-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Interval
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Get reminded to study every
              </p>
              <div className="flex gap-3 items-center">
                <select
                  value={settings.reminderInterval || 60}
                  onChange={(e) => {
                    const interval = Number(e.target.value)
                    updateSettings({ reminderInterval: interval })
                    chrome.runtime.sendMessage({
                      type: 'UPDATE_REMINDER',
                      payload: { reminderInterval: interval, enabled: true }
                    })
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                  <option value={360}>6 hours</option>
                  <option value={480}>8 hours</option>
                  <option value={720}>12 hours</option>
                  <option value={1440}>24 hours</option>
                </select>
                <button
                  onClick={() => {
                    chrome.runtime.sendMessage({
                      type: 'TEST_NOTIFICATION'
                    })
                  }}
                  className="px-3 py-2 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                >
                  Test
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-700">Keyboard shortcut mode</div>
              <div className="text-sm text-gray-500">Use keyboard shortcut instead of floating menu</div>
            </div>
            <Toggle
              checked={settings.lookupShortcutEnabled}
              onChange={(checked) => updateSettings({ lookupShortcutEnabled: checked })}
            />
          </div>

          {settings.lookupShortcutEnabled && (
            <div className="ml-4 pl-4 border-l-2 border-primary-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lookup Shortcut
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Press this key combination after selecting text to look up or translate
              </p>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setIsRecordingShortcut(true)}
                  className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                    isRecordingShortcut
                      ? 'bg-primary-100 border-2 border-primary-500 text-primary-700 animate-pulse'
                      : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isRecordingShortcut ? 'Press keys...' : settings.lookupShortcut || 'Ctrl+Shift+D'}
                </button>
                {isRecordingShortcut && (
                  <button
                    onClick={() => setIsRecordingShortcut(false)}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => updateSettings({ lookupShortcut: 'Ctrl+Shift+D' })}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Translation Settings */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Translation Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Translation Language
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Choose your preferred language for translations
            </p>
            <select
              value={settings.targetLanguage}
              onChange={(e) => updateSettings({ targetLanguage: e.target.value })}
              className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          {/* AI Translation Toggle */}
          <div id="settings-ai-translation" className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Use AI Translation
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  {settings.useLLMTranslation !== false
                    ? 'AI-powered translations with better quality'
                    : 'Using free translation API (basic quality)'}
                </p>
              </div>
              <button
                onClick={() => updateSettings({ useLLMTranslation: !(settings.useLLMTranslation !== false) })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.useLLMTranslation !== false ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.useLLMTranslation !== false ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* LLM Provider Dropdown - only show when AI enabled */}
          {settings.useLLMTranslation !== false && (
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LLM Provider
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Choose AI provider for translations
            </p>
            <select
              value={settings.llmProvider || 'openai'}
              onChange={(e) => {
                updateSettings({ llmProvider: e.target.value as LLMProvider })
                setTestResult({ status: 'idle' })
              }}
              className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {LLM_PROVIDERS.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
          )}

          {/* Model Dropdown - only show when AI enabled */}
          {settings.useLLMTranslation !== false && (
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Select model for {currentProvider.name}
            </p>
            <select
              value={settings.llmModel || currentProvider.defaultModel}
              onChange={(e) => updateSettings({ llmModel: e.target.value })}
              className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {currentProvider.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id} — {model.description}{model.id === currentProvider.defaultModel ? ' ★' : ''}
                </option>
              ))}
            </select>
          </div>
          )}

          {/* Dynamic API Key Input - only show when AI enabled */}
          {settings.useLLMTranslation !== false && (
          <div id="settings-apikey" className="border-t border-gray-100 pt-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {currentProvider.name} API Key
            </label>
            {/* Privacy notice - API keys stored locally */}
            <div className="flex items-start gap-2 p-3 mb-3 bg-green-50 border border-green-200 rounded-lg">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="text-sm">
                <p className="text-green-800 font-medium">🔒 Your API key is private</p>
                <p className="text-green-700 mt-1">
                  Keys are stored locally in your browser only. We never send or store your API key on any server.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Get your key from{' '}
              <a
                href={currentProvider.registerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline"
              >
                {currentProvider.name} Console
              </a>
            </p>
            <div className="flex gap-2">
              <input
                type={currentKeyState.saved ? 'text' : 'password'}
                value={currentKeyState.value}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder={currentProvider.id === 'openai' ? 'sk-...' : 'Enter API key...'}
                className="flex-1 max-w-md px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-mono"
              />
              <button
                onClick={handleTestConnection}
                disabled={!currentKeyState.value || currentKeyState.value.startsWith('••••') || testResult.status === 'testing'}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testResult.status === 'testing' ? 'Testing...' : 'Test'}
              </button>
              {currentKeyState.saved ? (
                <button
                  onClick={handleClearProviderApiKey}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  Clear
                </button>
              ) : (
                <button
                  onClick={handleSaveProviderApiKey}
                  disabled={!currentKeyState.value}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              )}
            </div>
            {testResult.status === 'success' && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {testResult.message}
              </p>
            )}
            {testResult.status === 'error' && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                {testResult.message}
              </p>
            )}
            {currentKeyState.saved && testResult.status === 'idle' && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                API key saved securely
              </p>
            )}
            {!currentKeyState.saved && !currentKeyState.value && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No API key configured for {currentProvider.name}.{' '}
                  <a
                    href={currentProvider.registerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-900 underline font-medium"
                  >
                    Get one here
                  </a>
                </p>
              </div>
            )}
          </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 text-sm mb-1">How translation works</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Single word</strong> → Dictionary lookup (Free)</li>
              <li>• <strong>Multiple words</strong> → {settings.useLLMTranslation !== false
                ? `${currentProvider.name} translation (Requires API key)`
                : 'Free translation API (no key required)'}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h2>

        <div className="space-y-4">
          <button
            onClick={() => {
              const data = JSON.stringify({ words, stats, settings }, null, 2)
              const blob = new Blob([data], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'vocabulary-backup.json'
              a.click()
            }}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            Export Data
          </button>

          <p className="text-sm text-gray-500">
            Export your vocabulary and progress data for backup
          </p>
        </div>
      </section>

      {/* About & Support */}
      <section className="bg-gradient-to-br from-primary-50 to-success-50 rounded-xl p-6 border border-primary-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">About & Support</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-success-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              K
            </div>
            <div>
              <div className="font-semibold text-gray-800">Kevin Nguyen</div>
              <div className="text-sm text-gray-500">Developer & Creator</div>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Thanks for using Vocabulary Builder! If you find this extension helpful,
            consider supporting my work to keep it free and actively maintained.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://chromewebstore.google.com/detail/vocabulary-builder/gjnopcfejkppaihaamfhdonlijjkfkdj"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg text-sm font-medium hover:bg-yellow-300 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
              Rate Extension
            </a>
            <a
              href="https://github.com/k3v1n1k88/vocabulary-extension-issues/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Report Issue
            </a>
            <a
              href="https://buymeacoffee.com/k3v1n1088"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFDD00] text-amber-900 rounded-full text-sm font-medium hover:bg-[#ffed4a] hover:shadow-md transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 21v-2h2V5c0-.55.196-1.02.588-1.413A1.93 1.93 0 0 1 6 3h12c.55 0 1.02.196 1.412.587C19.804 3.98 20 4.45 20 5v2h2v2h-2v2h2v2h-2v6h2v2H2Zm4-2h10V5H6v14Zm3-6q.425 0 .713-.288A.97.97 0 0 0 10 12V8a.97.97 0 0 0-.287-.713A.97.97 0 0 0 9 7a.97.97 0 0 0-.713.287A.97.97 0 0 0 8 8v4c0 .283.096.52.287.712.192.192.43.288.713.288Z"/>
              </svg>
              Buy me a coffee
            </a>
            <a
              href="https://paypal.me/k3v1n1k88"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0070ba] text-white rounded-full text-sm font-medium hover:bg-[#005ea6] hover:shadow-md transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.217a.77.77 0 0 1 .757-.645h6.234c2.093 0 3.542.464 4.306 1.38.735.88.96 2.066.67 3.525-.006.03-.014.06-.02.09l-.003.013v.004c-.36 1.883-1.264 3.254-2.687 4.076-1.39.804-3.166 1.212-5.28 1.212H7.16a.768.768 0 0 0-.757.644l-1.326 7.82Zm5.357-17.197h-1.84l-1.95 11.497h1.168c2.832 0 4.896-.77 6.133-2.288 1.238-1.518 1.52-3.506.839-5.91-.49-1.716-2.115-3.3-4.35-3.3Z"/>
              </svg>
              Donate via PayPal
            </a>
          </div>

          <div className="pt-4 border-t border-primary-100">
            <p className="text-xs text-gray-500 text-center">
              Vocabulary Builder v1.0.0 &copy; {new Date().getFullYear()} Kevin Nguyen. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-primary-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
