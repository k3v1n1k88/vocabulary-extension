import { useUIStore } from '@/shared/store'
import type { TabType } from '@/types'

const tabs: { id: TabType; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'study', label: 'Study' },
  { id: 'vocabulary', label: 'Vocabulary' }
]

export default function TabNav() {
  const { activeTab, setActiveTab } = useUIStore()

  return (
    <nav className="bg-white border-b border-gray-200 px-4">
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative
              ${
                activeTab === tab.id
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
