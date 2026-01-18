import type { PdfLookupResult } from '@/types'

// Only word/translation results (not loading/error) for history
type HistoryItem = Extract<PdfLookupResult, { type: 'word' } | { type: 'translation' }>

export interface HistoryListProps {
  history: HistoryItem[]
  currentResult: PdfLookupResult | null
  onSelectItem: (item: HistoryItem) => void
  onClear: () => void
}

// History item component
function HistoryItemComponent({
  item,
  isActive,
  onClick
}: {
  item: HistoryItem
  isActive: boolean
  onClick: () => void
}) {
  const isWord = item.type === 'word'
  const title = isWord
    ? item.data.word
    : item.data.originalText
  const subtitle = isWord
    ? item.data.definition
    : item.data.translatedText

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-primary-50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium truncate ${isActive ? 'text-primary-700' : 'text-gray-800'}`}>
          {title.slice(0, 30)}{title.length > 30 ? '...' : ''}
        </span>
        <span className="text-[10px] px-1 py-0.5 bg-gray-100 text-gray-500 rounded flex-shrink-0">
          {isWord ? 'Word' : 'Phrase'}
        </span>
      </div>
      <p className="text-xs text-gray-500 truncate mt-0.5">
        {subtitle.slice(0, 50)}{subtitle.length > 50 ? '...' : ''}
      </p>
    </button>
  )
}

/**
 * History list component
 * Displays recent lookups with clear action
 */
export function HistoryList({ history, currentResult, onSelectItem, onClear }: HistoryListProps) {
  if (history.length === 0) {
    return null
  }

  return (
    <div className="border-t border-gray-200 mt-2">
      <div className="px-4 py-2 flex items-center justify-between bg-gray-100">
        <span className="text-xs font-medium text-gray-600">Recent Lookups</span>
        <button
          onClick={onClear}
          className="text-[10px] text-gray-400 hover:text-gray-600"
        >
          Clear
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {history.slice(0, 10).map((item) => {
          const itemKey = item.type === 'word'
            ? item.data.id
            : `${item.timestamp}-${item.data.originalText.slice(0, 20)}`
          return (
            <HistoryItemComponent
              key={itemKey}
              item={item}
              isActive={currentResult === item}
              onClick={() => onSelectItem(item)}
            />
          )
        })}
      </div>
    </div>
  )
}
