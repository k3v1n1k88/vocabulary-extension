import { useState, useEffect } from 'react'
import { useSettingsStore, useStatsStore, useVocabularyStore } from '@/shared/store'
import { saveApiKey } from '@/shared/openai-translation'
import { SUPPORTED_LANGUAGES } from '@/types'
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
  const [activeTab, setActiveTab] = useState<OptionsTab>('dashboard')
  const { getDueCards } = useVocabularyStore()
  const dueCount = getDueCards().length

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

        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">v1.0.0 by Kevin Nguyen</p>
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
  const [apiKey, setApiKey] = useState('')
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [isRecordingShortcut, setIsRecordingShortcut] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      if (result.openaiApiKey) {
        setApiKey('••••••••••••••••••••' + result.openaiApiKey.slice(-4))
        setApiKeySaved(true)
      }
    })
  }, [])

  const handleSaveApiKey = async () => {
    if (apiKey && !apiKey.startsWith('••••')) {
      await saveApiKey(apiKey)
      setApiKey('••••••••••••••••••••' + apiKey.slice(-4))
      setApiKeySaved(true)
    }
  }

  const handleClearApiKey = async () => {
    await chrome.storage.local.remove('openaiApiKey')
    setApiKey('')
    setApiKeySaved(false)
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

          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Required for translating phrases. Get your key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
            <div className="flex gap-2">
              <input
                type={apiKeySaved ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setApiKeySaved(false)
                }}
                placeholder="sk-..."
                className="flex-1 max-w-md px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-mono"
              />
              {apiKeySaved ? (
                <button
                  onClick={handleClearApiKey}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  Clear
                </button>
              ) : (
                <button
                  onClick={handleSaveApiKey}
                  disabled={!apiKey}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              )}
            </div>
            {apiKeySaved && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                API key saved securely
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 text-sm mb-1">How translation works</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Single word</strong> → Dictionary lookup (Free)</li>
              <li>• <strong>Multiple words</strong> → OpenAI translation (Requires API key)</li>
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
              href="#CHROME_STORE_URL"
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
              href="#GITHUB_REPO_URL/issues"
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFDD00] text-gray-900 rounded-lg text-sm font-medium hover:bg-[#ffed4a] transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.169.364z"/>
              </svg>
              Buy me a coffee
            </a>
            <a
              href="https://paypal.me/k3v1n1k88"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0070ba] text-white rounded-lg text-sm font-medium hover:bg-[#005ea6] transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 3.72a.77.77 0 01.757-.643h6.557c2.18 0 3.906.58 5.135 1.724 1.23 1.143 1.846 2.79 1.846 4.942 0 .636-.068 1.28-.206 1.927-.412 1.98-1.447 3.582-3.105 4.805-1.658 1.223-3.785 1.834-6.38 1.834H7.592l-.516 3.028zm6.078-14.973H9.38l-1.47 8.642h3.193c1.57 0 2.862-.39 3.877-1.172 1.014-.78 1.655-1.838 1.922-3.172.137-.66.206-1.257.206-1.79 0-1.016-.299-1.78-.896-2.293-.598-.512-1.522-.768-2.773-.768h-1.285zm8.048-3.72L18.096 21.52a.77.77 0 01-.758.643h-4.606a.641.641 0 01-.633-.74l3.107-17.879a.77.77 0 01.758-.643h4.606c.408 0 .703.371.632.74z"/>
              </svg>
              Donate to PayPal
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
