import { useUIStore } from '@/shared/store'
import Header from './components/Header'
import TabNav from './components/TabNav'
import Dashboard from './components/Dashboard'
import StudyView from './components/StudyView'
import VocabularyList from './components/VocabularyList'

export default function App() {
  const { activeTab } = useUIStore()

  return (
    <div className="popup-container bg-gray-50 flex flex-col">
      {/* Top donate bar */}
      <div className="px-3 py-1.5 bg-gradient-to-r from-primary-50 to-success-50 border-b border-primary-100 flex justify-center gap-2">
        <a
          href="https://buymeacoffee.com/k3v1n1088"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-2 py-1 bg-[#FFDD00] text-gray-900 rounded font-medium hover:bg-[#ffed4a] transition-colors"
        >
          Buy me a coffee
        </a>
        <a
          href="https://paypal.me/k3v1n1k88"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-2 py-1 bg-[#0070ba] text-white rounded font-medium hover:bg-[#005ea6] transition-colors"
        >
          Donate to PayPal
        </a>
      </div>

      <Header />

      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'study' && <StudyView />}
        {activeTab === 'vocabulary' && <VocabularyList />}
      </main>

      <TabNav />

      {/* Footer with credits */}
      <div className="px-3 py-2 bg-gray-100 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Produced by Kevin Nguyen</span>
          <div className="flex gap-2">
            <a
              href="https://chromewebstore.google.com/detail/vocabulary-builder/gjnopcfejkppaihaamfhdonlijjkfkdj"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-primary-600 transition-colors"
            >
              Rate
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="https://github.com/k3v1n1k88/vocabulary-extension-issues/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-primary-600 transition-colors"
            >
              Issue
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
