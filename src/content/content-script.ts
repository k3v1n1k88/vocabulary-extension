import type { Word } from '@/types'

// Tooltip element reference
let tooltip: HTMLDivElement | null = null

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === 'SHOW_TOOLTIP') {
    showTooltip(message.payload as Word)
  } else if (message.type === 'SHOW_TOOLTIP_ERROR') {
    showErrorTooltip(message.payload.message)
  }
})

// Create and show tooltip with word data
function showTooltip(word: Word) {
  removeTooltip()

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  tooltip = document.createElement('div')
  tooltip.id = 'vocabulary-tooltip'
  tooltip.innerHTML = createTooltipHTML(word)

  // Position tooltip near selection
  const tooltipWidth = 350
  let left = rect.left + window.scrollX
  const top = rect.bottom + window.scrollY + 10

  // Adjust if tooltip would go off-screen
  if (left + tooltipWidth > window.innerWidth) {
    left = window.innerWidth - tooltipWidth - 20
  }

  tooltip.style.cssText = `
    position: absolute;
    left: ${left}px;
    top: ${top}px;
    z-index: 999999;
  `

  document.body.appendChild(tooltip)

  // Add event listeners
  setupTooltipEventListeners(word)

  // Close on click outside
  document.addEventListener('click', handleOutsideClick)
}

function createTooltipHTML(word: Word): string {
  const synonymsHTML = word.synonyms?.length
    ? `<div class="vocab-synonyms">
        <span class="vocab-label">Synonyms:</span>
        ${word.synonyms.map((s) => `<span class="vocab-tag">${s}</span>`).join('')}
       </div>`
    : ''

  const exampleHTML = word.examples?.[0]
    ? `<div class="vocab-example">
        <span class="vocab-label">Example:</span>
        <em>"${word.examples[0]}"</em>
       </div>`
    : ''

  const vietnameseHTML = word.vietnameseTranslation
    ? `<div class="vocab-vietnamese">
        <span class="vocab-label">Tiếng Việt:</span>
        ${word.vietnameseTranslation}
       </div>`
    : ''

  return `
    <div class="vocab-tooltip-content">
      <div class="vocab-header">
        <div class="vocab-word-row">
          <span class="vocab-word">${word.word}</span>
          <button class="vocab-audio-btn" data-word="${word.word}" title="Play pronunciation">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          </button>
        </div>
        ${word.pronunciation ? `<span class="vocab-pronunciation">${word.pronunciation}</span>` : ''}
        ${word.partOfSpeech ? `<span class="vocab-pos">${word.partOfSpeech}</span>` : ''}
      </div>

      <div class="vocab-definition">
        <span class="vocab-label">Definition:</span>
        ${word.definition}
      </div>

      ${vietnameseHTML}
      ${exampleHTML}
      ${synonymsHTML}

      <div class="vocab-actions">
        <button class="vocab-save-btn" data-word-id="${word.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          Save to Vocabulary
        </button>
      </div>
    </div>
  `
}

function showErrorTooltip(message: string) {
  removeTooltip()

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  tooltip = document.createElement('div')
  tooltip.id = 'vocabulary-tooltip'
  tooltip.innerHTML = `
    <div class="vocab-tooltip-content vocab-error">
      <p>${message}</p>
    </div>
  `

  tooltip.style.cssText = `
    position: absolute;
    left: ${rect.left + window.scrollX}px;
    top: ${rect.bottom + window.scrollY + 10}px;
    z-index: 999999;
  `

  document.body.appendChild(tooltip)
  document.addEventListener('click', handleOutsideClick)

  // Auto-remove after 3 seconds
  setTimeout(removeTooltip, 3000)
}

function setupTooltipEventListeners(word: Word) {
  if (!tooltip) return

  // Audio button
  const audioBtn = tooltip.querySelector('.vocab-audio-btn')
  audioBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    chrome.runtime.sendMessage({
      type: 'PLAY_AUDIO',
      payload: { text: word.word, audioUrl: word.audioUrl }
    })
  })

  // Save button
  const saveBtn = tooltip.querySelector('.vocab-save-btn')
  saveBtn?.addEventListener('click', async (e) => {
    e.stopPropagation()
    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_WORD',
        payload: { word }
      })

      // Update button state
      if (saveBtn) {
        saveBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          Saved!
        `
        saveBtn.classList.add('saved')
        ;(saveBtn as HTMLButtonElement).disabled = true
      }
    } catch (error) {
      console.error('Failed to save word:', error)
    }
  })
}

function handleOutsideClick(e: MouseEvent) {
  if (tooltip && !tooltip.contains(e.target as Node)) {
    removeTooltip()
  }
}

function removeTooltip() {
  if (tooltip) {
    tooltip.remove()
    tooltip = null
    document.removeEventListener('click', handleOutsideClick)
  }
}

console.log('Vocabulary Builder content script loaded')
