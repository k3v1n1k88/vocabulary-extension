import { useStatsStore, useVocabularyStore, useSettingsStore, useUIStore } from '@/shared/store'

export default function Dashboard() {
  const { stats } = useStatsStore()
  const { words, getDueCards } = useVocabularyStore()
  const { settings } = useSettingsStore()
  const { setActiveTab } = useUIStore()

  const dueCards = getDueCards()
  const todayProgress = Math.min(
    Math.round((stats.totalReviews / settings.dailyGoal) * 100),
    100
  )

  // Get recent words (last 5)
  const recentWords = [...words]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab('study')}
          className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white text-left hover:from-primary-600 hover:to-primary-700 transition-all shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <svg className="w-8 h-8 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {dueCards.length > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
                {dueCards.length} due
              </span>
            )}
          </div>
          <div className="font-semibold">Start Study</div>
          <div className="text-xs opacity-80">
            {dueCards.length > 0 ? `${dueCards.length} cards to review` : 'All caught up!'}
          </div>
        </button>

        <button
          onClick={() => setActiveTab('vocabulary')}
          className="bg-gradient-to-br from-success-500 to-success-600 rounded-xl p-4 text-white text-left hover:from-success-600 hover:to-success-700 transition-all shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <svg className="w-8 h-8 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
              {words.length}
            </span>
          </div>
          <div className="font-semibold">My Vocabulary</div>
          <div className="text-xs opacity-80">{words.length} words saved</div>
        </button>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Today's Progress</span>
          <span className="text-sm text-gray-500">
            {stats.totalReviews} / {settings.dailyGoal} reviews
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${todayProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{todayProgress}% complete</span>
          <div className="flex items-center gap-1 text-streak-500">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{stats.currentStreak} day streak</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Total Words"
          value={words.length}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          color="primary"
        />
        <StatCard
          label="Accuracy"
          value={`${stats.accuracy}%`}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="success"
        />
        <StatCard
          label="Level"
          value={stats.level}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
          color="amber"
        />
      </div>

      {/* Recent Words */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-gray-700">Recent Words</span>
          <button
            onClick={() => setActiveTab('vocabulary')}
            className="text-xs text-primary-600 hover:underline"
          >
            View All
          </button>
        </div>

        {recentWords.length === 0 ? (
          <div className="text-center py-6">
            <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-sm text-gray-500">No words saved yet</p>
            <p className="text-xs text-gray-400 mt-1">Select text on any page to look it up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentWords.map((word) => (
              <div
                key={word.id}
                className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-800">{word.word}</span>
                  {word.vietnameseTranslation && (
                    <span className="text-xs text-gray-500 ml-2 truncate">
                      {word.vietnameseTranslation}
                    </span>
                  )}
                </div>
                {word.partOfSpeech && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 ml-2">
                    {word.partOfSpeech}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color: 'primary' | 'success' | 'amber'
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    amber: 'bg-amber-50 text-amber-600'
  }

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      <div className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <div className="text-xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}
