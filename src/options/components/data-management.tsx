import { useVocabularyStore, useStatsStore, useSettingsStore } from '@/shared/store'

export function DataManagement() {
  const { words } = useVocabularyStore()
  const { stats } = useStatsStore()
  const { settings } = useSettingsStore()

  const handleExportData = () => {
    const data = JSON.stringify({ words, stats, settings }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vocabulary-backup.json'
    a.click()
  }

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h2>

      <div className="space-y-4">
        <button
          onClick={handleExportData}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          Export Data
        </button>

        <p className="text-sm text-gray-500">
          Export your vocabulary and progress data for backup
        </p>
      </div>
    </section>
  )
}
