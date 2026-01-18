/**
 * Floating Menu Language Handlers
 * Source/target language dropdown handling for floating menu.
 */

import {
  saveTargetLanguage,
  saveSourceLanguage,
  setCachedTargetLanguage,
  setCachedSourceLanguage
} from './settings-manager'

/**
 * Handle source language trigger click - toggle dropdown.
 */
export function handleSourceLangTrigger(
  clickedEl: HTMLElement,
  menu: HTMLDivElement
): boolean {
  const trigger = clickedEl.closest('.vocab-source-lang-trigger')
  if (!trigger) return false

  const sourceDropdown = menu.querySelector('.vocab-source-lang-dropdown') as HTMLElement
  const targetDropdown = menu.querySelector('.vocab-target-lang-dropdown') as HTMLElement

  if (sourceDropdown) {
    const isVisible = sourceDropdown.style.display !== 'none'
    sourceDropdown.style.display = isVisible ? 'none' : 'block'
    if (targetDropdown) targetDropdown.style.display = 'none'
  }
  return true
}

/**
 * Handle target language trigger click - toggle dropdown.
 */
export function handleTargetLangTrigger(
  clickedEl: HTMLElement,
  menu: HTMLDivElement
): boolean {
  const trigger = clickedEl.closest('.vocab-target-lang-trigger')
  if (!trigger) return false

  const sourceDropdown = menu.querySelector('.vocab-source-lang-dropdown') as HTMLElement
  const targetDropdown = menu.querySelector('.vocab-target-lang-dropdown') as HTMLElement

  if (targetDropdown) {
    const isVisible = targetDropdown.style.display !== 'none'
    targetDropdown.style.display = isVisible ? 'none' : 'block'
    if (sourceDropdown) sourceDropdown.style.display = 'none'
  }
  return true
}

/**
 * Handle language option click - determine which dropdown and update.
 */
export function handleLangOptionClick(
  clickedEl: HTMLElement,
  menu: HTMLDivElement,
  activeDropdown: 'source' | 'target' | null
): boolean {
  const langOption = clickedEl.closest('.vocab-lang-option') as HTMLElement
  if (!langOption) return false

  const langCode = langOption.dataset.langCode
  const langName = langOption.dataset.langName
  if (!langCode || !langName) return false

  if (activeDropdown === 'source') {
    updateSourceLanguage(menu, langName, langCode, langOption)
  } else if (activeDropdown === 'target') {
    updateTargetLanguage(menu, langName, langCode, langOption)
  }
  return true
}

/**
 * Update source language selection and UI.
 */
function updateSourceLanguage(
  menu: HTMLDivElement,
  langName: string,
  langCode: string,
  langOption: HTMLElement
): void {
  setCachedSourceLanguage(langName, langCode)
  saveSourceLanguage(langCode)

  // Update trigger display
  const trigger = menu.querySelector('.vocab-source-lang-trigger .vocab-lang-short')
  if (trigger) trigger.textContent = langName.slice(0, 2).toUpperCase()

  // Update active state
  menu.querySelectorAll('.vocab-source-lang-dropdown .vocab-lang-option')
    .forEach(opt => opt.classList.remove('active'))
  langOption.classList.add('active')

  // Hide dropdown
  const dropdown = menu.querySelector('.vocab-source-lang-dropdown') as HTMLElement
  if (dropdown) dropdown.style.display = 'none'
}

/**
 * Update target language selection and UI.
 */
function updateTargetLanguage(
  menu: HTMLDivElement,
  langName: string,
  langCode: string,
  langOption: HTMLElement
): void {
  setCachedTargetLanguage(langName)
  saveTargetLanguage(langCode)

  // Update trigger display
  const trigger = menu.querySelector('.vocab-target-lang-trigger .vocab-lang-short')
  if (trigger) trigger.textContent = langName.slice(0, 2).toUpperCase()

  // Update active state
  menu.querySelectorAll('.vocab-target-lang-dropdown .vocab-lang-option')
    .forEach(opt => opt.classList.remove('active'))
  langOption.classList.add('active')

  // Hide dropdown
  const dropdown = menu.querySelector('.vocab-target-lang-dropdown') as HTMLElement
  if (dropdown) dropdown.style.display = 'none'
}
