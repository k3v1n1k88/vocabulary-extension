import { useUIStore } from '@/shared/store'
import { DonateBar, FooterCredits } from '@/shared/components'
import Header from './components/Header'
import TabNav from './components/TabNav'
import Dashboard from './components/Dashboard'
import StudyView from './components/StudyView'
import VocabularyList from './components/VocabularyList'

export default function App() {
  const { activeTab } = useUIStore()

  return (
    <div className="popup-container bg-gray-50 flex flex-col">
      <DonateBar />

      <Header />

      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'study' && <StudyView />}
        {activeTab === 'vocabulary' && <VocabularyList />}
      </main>

      <TabNav />

      <FooterCredits />
    </div>
  )
}
