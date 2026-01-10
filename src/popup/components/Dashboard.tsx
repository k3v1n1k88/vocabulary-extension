import { useStatsStore, useVocabularyStore, useSettingsStore } from '@/shared/store'

export default function Dashboard() {
  const { stats } = useStatsStore()
  const { words } = useVocabularyStore()
  const { settings } = useSettingsStore()

  const todayProgress = Math.min(
    Math.round((stats.totalReviews / settings.dailyGoal) * 100),
    100
  )
  const wordsToGo = Math.max(settings.dailyGoal - stats.totalReviews, 0)

  // Get recent words (last 5)
  const recentWords = [...words]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Progress Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Today's Progress</span>
          <span className="text-sm text-gray-500">
            {stats.totalReviews} / {settings.dailyGoal} words
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${todayProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{todayProgress}% complete</span>
          <span>{wordsToGo} words to go</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Words" value={stats.totalWords} />
        <StatCard label="Accuracy" value={`${stats.accuracy}%`} />
        <StatCard label="Badges" value={stats.level} />
      </div>

      {/* Recent Words */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-gray-700">Recent Words</span>
          <button className="text-xs text-primary-600 hover:underline">
            View All
          </button>
        </div>

        {recentWords.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No words saved yet. Right-click on any word to look it up!
          </p>
        ) : (
          <div className="space-y-2">
            {recentWords.map((word) => (
              <div
                key={word.id}
                className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <span className="font-medium text-gray-800">{word.word}</span>
                  {word.vietnameseTranslation && (
                    <span className="text-xs text-gray-500 ml-2">
                      {word.vietnameseTranslation}
                    </span>
                  )}
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-success-100 text-success-700">
                  Learned
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
