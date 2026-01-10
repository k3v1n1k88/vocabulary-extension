import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Vocabulary Builder',
  version: '1.0.0',
  description: 'Learn vocabulary with flashcards, spaced repetition, and context menu lookup',

  permissions: [
    'storage',
    'contextMenus',
    'activeTab',
    'tts'
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
