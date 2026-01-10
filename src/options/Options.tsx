import { useSettingsStore, useStatsStore, useVocabularyStore } from '@/shared/store'

export default function Options() {
  const { settings, updateSettings } = useSettingsStore()
  const { stats } = useStatsStore()
  const { words } = useVocabularyStore()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Vocabulary Builder Settings</h1>
          <p className="text-gray-500 mt-1">Customize your learning experience</p>
        </header>

        {/* Stats Overview */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Progress</h2>
          <div className="grid grid-cols-4 gap-4">
            <StatItem label="Total Words" value={words.length} />
            <StatItem label="Current Streak" value={`${stats.currentStreak} days`} />
            <StatItem label="Total Reviews" value={stats.totalReviews} />
            <StatItem label="Level" value={stats.level} />
          </div>
        </section>

        {/* Settings */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Learning Settings</h2>

          <div className="space-y-6">
            {/* Daily Goal */}
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

            {/* Auto-play audio */}
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

            {/* Show Vietnamese */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-700">Show Vietnamese translation</div>
                <div className="text-sm text-gray-500">Display Vietnamese in word lookups</div>
              </div>
              <Toggle
                checked={settings.showVietnamese}
                onChange={(checked) => updateSettings({ showVietnamese: checked })}
              />
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-700">Study reminders</div>
                <div className="text-sm text-gray-500">Get notified when cards are due</div>
              </div>
              <Toggle
                checked={settings.notificationsEnabled}
                onChange={(checked) => updateSettings({ notificationsEnabled: checked })}
              />
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

        <footer className="mt-8 text-center text-sm text-gray-400">
          Vocabulary Builder v1.0.0
        </footer>
      </div>
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
