export interface PanelHeaderProps {
  isPdfSource?: boolean
}

/**
 * Panel header component for SidePanel
 * Displays logo, title, and optional PDF badge
 */
export function PanelHeader({ isPdfSource = true }: PanelHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/icons/icon-32.png" alt="" className="w-6 h-6" />
        <h1 className="text-sm font-semibold text-gray-800">Vocabulary Lookup</h1>
      </div>
      {isPdfSource && (
        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">PDF</span>
      )}
    </div>
  )
}
