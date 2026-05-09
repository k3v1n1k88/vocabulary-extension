export function AboutSection() {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-success-50 rounded-xl p-6 border border-primary-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">About & Support</h2>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-success-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            K
          </div>
          <div>
            <div className="font-semibold text-gray-800">Kevin Nguyen</div>
            <div className="text-sm text-gray-500">Developer & Creator</div>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Thanks for using Vocabulary Builder! If you find this extension helpful,
          consider supporting my work to keep it free and actively maintained.
        </p>

        <div className="flex flex-wrap gap-3">
          <a
            href="https://chromewebstore.google.com/detail/vocabulary-builder/gjnopcfejkppaihaamfhdonlijjkfkdj"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg text-sm font-medium hover:bg-yellow-300 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
            Rate Extension
          </a>
          <a
            href="https://github.com/k3v1n1k88/vocabulary-extension/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Report Issue
          </a>
          <a
            href="https://buymeacoffee.com/k3v1n1088"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFDD00] text-amber-900 rounded-full text-sm font-medium hover:bg-[#ffed4a] hover:shadow-md transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 21v-2h2V5c0-.55.196-1.02.588-1.413A1.93 1.93 0 0 1 6 3h12c.55 0 1.02.196 1.412.587C19.804 3.98 20 4.45 20 5v2h2v2h-2v2h2v2h-2v6h2v2H2Zm4-2h10V5H6v14Zm3-6q.425 0 .713-.288A.97.97 0 0 0 10 12V8a.97.97 0 0 0-.287-.713A.97.97 0 0 0 9 7a.97.97 0 0 0-.713.287A.97.97 0 0 0 8 8v4c0 .283.096.52.287.712.192.192.43.288.713.288Z"/>
            </svg>
            Buy me a coffee
          </a>
          <a
            href="https://paypal.me/k3v1n1k88"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0070ba] text-white rounded-full text-sm font-medium hover:bg-[#005ea6] hover:shadow-md transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.217a.77.77 0 0 1 .757-.645h6.234c2.093 0 3.542.464 4.306 1.38.735.88.96 2.066.67 3.525-.006.03-.014.06-.02.09l-.003.013v.004c-.36 1.883-1.264 3.254-2.687 4.076-1.39.804-3.166 1.212-5.28 1.212H7.16a.768.768 0 0 0-.757.644l-1.326 7.82Zm5.357-17.197h-1.84l-1.95 11.497h1.168c2.832 0 4.896-.77 6.133-2.288 1.238-1.518 1.52-3.506.839-5.91-.49-1.716-2.115-3.3-4.35-3.3Z"/>
            </svg>
            Donate via PayPal
          </a>
        </div>

        <div className="pt-4 border-t border-primary-100">
          <p className="text-xs text-gray-500 text-center">
            Vocabulary Builder v1.0.0 &copy; {new Date().getFullYear()} Kevin Nguyen. All rights reserved.
          </p>
        </div>
      </div>
    </section>
  )
}
