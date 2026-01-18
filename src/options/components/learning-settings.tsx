import { Toggle } from '@/shared/components'
import type { UserSettings } from '@/types'

interface LearningSettingsProps {
  settings: UserSettings
  onSettingsUpdate: (updates: Partial<UserSettings>) => void
  isRecordingShortcut: boolean
  onRecordShortcut: (recording: boolean) => void
}

export function LearningSettings({
  settings,
  onSettingsUpdate,
  isRecordingShortcut,
  onRecordShortcut
}: LearningSettingsProps) {
  return (
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
            onChange={(e) => onSettingsUpdate({ dailyGoal: Number(e.target.value) })}
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
            onChange={(checked) => onSettingsUpdate({ autoPlayAudio: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-700">Show translation</div>
            <div className="text-sm text-gray-500">Display translation in word lookups</div>
          </div>
          <Toggle
            checked={settings.showVietnamese}
            onChange={(checked) => onSettingsUpdate({ showVietnamese: checked })}
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
              onSettingsUpdate({ notificationsEnabled: checked })
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
                  onSettingsUpdate({ reminderInterval: interval })
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
            onChange={(checked) => onSettingsUpdate({ lookupShortcutEnabled: checked })}
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
                onClick={() => onRecordShortcut(true)}
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
                  onClick={() => onRecordShortcut(false)}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => onSettingsUpdate({ lookupShortcut: 'Ctrl+Shift+D' })}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
