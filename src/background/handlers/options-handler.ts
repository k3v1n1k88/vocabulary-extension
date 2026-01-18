/**
 * Options Handler Module
 * Handles opening the options page with optional hash navigation.
 */

/**
 * Handle OPEN_OPTIONS_PAGE message - open options with optional tab hash.
 */
export function handleOpenOptionsPage(
  payload: { hash?: string } | undefined,
  sendResponse: (response: unknown) => void
): void {
  const hash = payload?.hash
  if (hash) {
    chrome.tabs.create({ url: chrome.runtime.getURL(`src/options/index.html#${hash}`) })
  } else {
    chrome.runtime.openOptionsPage()
  }
  sendResponse({ success: true })
}
