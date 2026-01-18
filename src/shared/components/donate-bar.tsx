interface DonateBarProps {
  compact?: boolean
  showMessage?: boolean
}

/**
 * Donate bar with Buy Me a Coffee and PayPal links.
 * Used in popup, sidepanel, and options.
 */
export function DonateBar({ compact = false, showMessage = true }: DonateBarProps) {
  return (
    <div className={`${compact ? 'px-4 py-2.5 border-t' : 'px-3 py-2 border-b'} bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-100 flex flex-col items-center gap-1.5`}>
      {showMessage && (
        <span className="text-[10px] text-amber-700/70">
          Enjoying the extension? Support development ❤️
        </span>
      )}
      <div className="flex gap-2">
        <a
          href="https://buymeacoffee.com/k3v1n1088"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center text-[11px] bg-[#FFDD00] text-amber-900 rounded-full font-medium hover:bg-[#ffed4a] transition-all ${compact ? 'gap-1.5 px-3 py-1.5 hover:shadow-sm' : 'gap-1 px-2.5 py-1'}`}
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
          className={`inline-flex items-center text-[11px] bg-[#0070ba] text-white rounded-full font-medium hover:bg-[#005ea6] transition-all ${compact ? 'gap-1.5 px-3 py-1.5 hover:shadow-sm' : 'gap-1 px-2.5 py-1'}`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.217a.77.77 0 0 1 .757-.645h6.234c2.093 0 3.542.464 4.306 1.38.735.88.96 2.066.67 3.525-.006.03-.014.06-.02.09l-.003.013v.004c-.36 1.883-1.264 3.254-2.687 4.076-1.39.804-3.166 1.212-5.28 1.212H7.16a.768.768 0 0 0-.757.644l-1.326 7.82Zm5.357-17.197h-1.84l-1.95 11.497h1.168c2.832 0 4.896-.77 6.133-2.288 1.238-1.518 1.52-3.506.839-5.91-.49-1.716-2.115-3.3-4.35-3.3Z"/>
          </svg>
          PayPal
        </a>
      </div>
    </div>
  )
}
