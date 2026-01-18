/**
 * Background Handlers Index
 * Re-exports all handler modules for clean imports.
 */

export { isPdfUrl, performPdfLookup } from './pdf-handler'
export { handleLookupWord, handleSaveWord } from './word-handler'
export { handleTranslateText, handleTranslateSwap } from './translation-handler'
export { handlePlayAudio } from './audio-handler'
export { handleUpdateReminder, handleTestNotification } from './notification-handler'
export { handleOpenOptionsPage } from './options-handler'
