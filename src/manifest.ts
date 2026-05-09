import { defineManifest } from '@crxjs/vite-plugin'
import packageJson from '../package.json'

/**
 * Dev-only public key. Locks the unpacked extension ID across every dev
 * machine and Chrome profile so cross-device chrome.storage.sync testing
 * actually works (issue #5).
 *
 * NOT used in release builds — the Chrome Web Store has its own stored key
 * for the published extension. The mode check below strips this field for
 * `vite build --mode release`. A guard script (`verify-release-manifest.mjs`)
 * fails the release pipeline if it ever leaks.
 *
 * To regenerate: `npm run dev-key:generate`, paste the new value here.
 */
const DEV_EXTENSION_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlWlLi3r2katAzHjFlvL0LR0uY25dwQ7ZVNUVJWyvPdrVebFpluEZ1aWq4/X0Yv+VbaiTgFxjOxGlJr5un0W2U16B12LCS4/VlxrVjiIcDc8TO20kYcWFK1xIvujbj70frTg8hEURaOAW1s2QM9KvkBoz1dl3/1HrGyqqrayqFmZQpvZ4NAYbwbFquXDZnDFOCsnQD+SHwV2ncg+uMYCk71yBU12yYMicNnztgzITQhQ2erQDdlgPcxaG4q5xdkaf9IKYSQJRqRVx9ozTncOmD39O/FG6Fzb0fFBf67ciaEUao0vgDjT37DPV1jam2GWd2ijf454HCF83b410fXK/rwIDAQAB'

export default defineManifest((env) => ({
  manifest_version: 3,
  name: 'Vocabulary Builder',
  version: packageJson.version,
  description: 'Learn vocabulary with flashcards, spaced repetition, and context menu lookup',

  // Pin extension ID for non-release builds; CWS uses its own key for release.
  ...(env.mode !== 'release' ? { key: DEV_EXTENSION_KEY } : {}),

  permissions: [
    'storage',
    'contextMenus',
    'activeTab',
    'notifications',
    'alarms',
    'sidePanel'
  ],

  // Host permissions for API calls (required in MV3)
  host_permissions: [
    'https://api.mymemory.translated.net/*',
    'https://api.dictionaryapi.dev/*',
    'https://api.openai.com/*',
    'https://generativelanguage.googleapis.com/*',
    'https://api.x.ai/*',
    'https://translate.google.com/*'
  ],

  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module'
  },

  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/content-script.ts'],
      css: ['src/content/content-style.css']
    }
  ],

  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png'
    }
  },

  options_page: 'src/options/index.html',

  // Side panel for PDF lookup results (Chrome 114+)
  side_panel: {
    default_path: 'src/sidepanel/index.html'
  },

  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png'
  },

  web_accessible_resources: [
    {
      resources: ['icons/*'],
      matches: ['<all_urls>']
    }
  ]
}))
