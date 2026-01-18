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
      <div className="px-3 py-2 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-100 flex flex-col items-center gap-1.5">
        <span className="text-[10px] text-amber-700/70">Enjoying the extension? Support development ❤️</span>
        <div className="flex gap-2">
          <a
            href="https://buymeacoffee.com/k3v1n1088"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-[#FFDD00] text-amber-900 rounded-full font-medium hover:bg-[#ffed4a] transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 21v-2h2V5c0-.55.196-1.02.588-1.413A1.93 1.93 0 0 1 6 3h12c.55 0 1.02.196 1.412.587C19.804 3.98 20 4.45 20 5v2h2v2h-2v2h2v2h-2v6h2v2H2Zm4-2h10V5H6v14Zm3-6q.425 0 .713-.288A.97.97 0 0 0 10 12V8a.97.97 0 0 0-.287-.713A.97.97 0 0 0 9 7a.97.97 0 0 0-.713.287A.97.97 0 0 0 8 8v4c0 .283.096.52.287.712.192.192.43.288.713.288Z"/>
            </svg>
            Coffee
          </a>
          <a
            href="https://paypal.me/k3v1n1k88"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-[#0070ba] text-white rounded-full font-medium hover:bg-[#005ea6] transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.217a.77.77 0 0 1 .757-.645h6.234c2.093 0 3.542.464 4.306 1.38.735.88.96 2.066.67 3.525-.006.03-.014.06-.02.09l-.003.013v.004c-.36 1.883-1.264 3.254-2.687 4.076-1.39.804-3.166 1.212-5.28 1.212H7.16a.768.768 0 0 0-.757.644l-1.326 7.82Zm5.357-17.197h-1.84l-1.95 11.497h1.168c2.832 0 4.896-.77 6.133-2.288 1.238-1.518 1.52-3.506.839-5.91-.49-1.716-2.115-3.3-4.35-3.3Z"/>
            </svg>
            PayPal
          </a>
        </div>
      </div>

      <Header />

      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'study' && <StudyView />}
        {activeTab === 'vocabulary' && <VocabularyList />}
      </main>

      <TabNav />

      {/* Footer with credits */}
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Kevin Nguyen
          </span>
          <div className="flex items-center gap-1">
            <a
              href="https://chromewebstore.google.com/detail/vocabulary-builder/gjnopcfejkppaihaamfhdonlijjkfkdj"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-amber-500 px-1.5 py-0.5 rounded hover:bg-amber-50 transition-colors"
              title="Rate on Chrome Web Store"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Rate
            </a>
            <a
              href="https://github.com/k3v1n1k88/vocabulary-extension-issues/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
              title="Report an issue"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Issue
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
