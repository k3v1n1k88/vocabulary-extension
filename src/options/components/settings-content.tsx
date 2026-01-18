import { useCallback } from 'react'
import { useSettingsStore, useStatsStore, useVocabularyStore } from '@/shared/store'
import type { LLMProvider } from '@/types'
import { StatItem } from '@/shared/components'
import { LearningSettings } from './learning-settings'
import { TranslationSettings } from './translation-settings'
import { DataManagement } from './data-management'
import { AboutSection } from './about-section'
import { useApiKeyManagement, useShortcutRecorder } from '../hooks'

export function SettingsContent() {
  const { settings, updateSettings } = useSettingsStore()
  const { stats } = useStatsStore()
  const { words } = useVocabularyStore()

  // API key management
  const {
    providerApiKeys,
    testResult,
    handleApiKeyChange,
    handleApiKeyFocus,
    handleApiKeyBlur,
    handleSaveApiKey,
    handleClearApiKey,
    handleTestConnection,
    handleProviderChange
  } = useApiKeyManagement(settings.llmProvider || 'openai')

  // Keyboard shortcut recording
  const handleShortcutCapture = useCallback((shortcut: string) => {
    updateSettings({ lookupShortcut: shortcut })
  }, [updateSettings])

  const {
    isRecordingShortcut,
    startRecording: setRecordingShortcut
  } = useShortcutRecorder(handleShortcutCapture)

  // Wrapper for provider change that updates settings
  const onProviderChange = (provider: LLMProvider) => {
    handleProviderChange(provider, updateSettings)
  }

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
      <LearningSettings
        settings={settings}
        onSettingsUpdate={updateSettings}
        isRecordingShortcut={isRecordingShortcut}
        onRecordShortcut={setRecordingShortcut}
      />

      {/* Translation Settings */}
      <TranslationSettings
        settings={settings}
        onSettingsUpdate={updateSettings}
        providerApiKeys={providerApiKeys}
        onApiKeyChange={handleApiKeyChange}
        testResult={testResult}
        onTestConnection={handleTestConnection}
        onSaveApiKey={handleSaveApiKey}
        onClearApiKey={handleClearApiKey}
        onApiKeyFocus={handleApiKeyFocus}
        onApiKeyBlur={handleApiKeyBlur}
        onProviderChange={onProviderChange}
      />

      {/* Data Management */}
      <DataManagement />

      {/* About & Support */}
      <AboutSection />
    </div>
  )
}
