import { defineManifest } from '@crxjs/vite-plugin'
import packageJson from '../package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'Vocabulary Builder',
  version: packageJson.version,
  description: 'Learn vocabulary with flashcards, spaced repetition, and context menu lookup',

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
})
