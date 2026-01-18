/**
 * HTML Escape Utilities
 * Prevent XSS attacks by escaping user-controlled content.
 */

/**
 * Escape HTML special characters to prevent XSS attacks.
 * Used for all user-controlled content inserted via innerHTML.
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Escape HTML for use in data attributes.
 * Escapes quotes in addition to HTML special characters.
 */
export function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
