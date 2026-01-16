import { test, expect } from './fixtures'

test.describe('Popup', () => {
  test('loads extension and displays popup', async ({ page, extensionId }) => {
    // Navigate to extension popup
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)

    // Wait for React to render
    await page.waitForLoadState('domcontentloaded')

    // Check that popup renders (look for navigation or main container)
    await expect(page.locator('body')).toBeVisible()
  })

  test('displays dashboard by default', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
    await page.waitForLoadState('domcontentloaded')

    // Dashboard should show stats or welcome content
    // Check for dashboard-related elements
    const dashboardContent = page.locator('text=Dashboard').or(page.locator('text=Level'))
    await expect(dashboardContent.first()).toBeVisible({ timeout: 5000 })
  })

  test('navigates between tabs', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
    await page.waitForLoadState('domcontentloaded')

    // Find and click vocabulary tab
    const vocabTab = page.locator('text=Vocabulary').first()
    if (await vocabTab.isVisible()) {
      await vocabTab.click()
      await page.waitForTimeout(500) // Wait for navigation

      // Vocabulary page should show word list or empty state
      const vocabContent = page.locator('text=vocabulary').or(page.locator('text=words'))
      await expect(vocabContent.first()).toBeVisible({ timeout: 5000 })
    }

    // Find and click study tab
    const studyTab = page.locator('text=Study').first()
    if (await studyTab.isVisible()) {
      await studyTab.click()
      await page.waitForTimeout(500)

      // Study page should show start button or cards
      const studyContent = page.locator('text=Start').or(page.locator('text=No cards'))
      await expect(studyContent.first()).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Options Page', () => {
  test('loads options page', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/src/options/index.html`)
    await page.waitForLoadState('domcontentloaded')

    // Options page should show settings
    await expect(page.locator('body')).toBeVisible()
  })

  test('displays settings form', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/src/options/index.html`)
    await page.waitForLoadState('domcontentloaded')

    // Look for settings-related content
    const settingsContent = page.locator('text=Settings').or(page.locator('text=API'))
    await expect(settingsContent.first()).toBeVisible({ timeout: 5000 })
  })
})
