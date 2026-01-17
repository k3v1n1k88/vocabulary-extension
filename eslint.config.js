import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        // Browser globals
        chrome: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        crypto: 'readonly',
        confirm: 'readonly',
        // DOM types
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        Node: 'readonly',
        Selection: 'readonly',
        Range: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        Event: 'readonly',
        // Audio
        Audio: 'readonly',
        HTMLAudioElement: 'readonly',
        FileReader: 'readonly',
        SpeechSynthesisUtterance: 'readonly',
        speechSynthesis: 'readonly',
        // JS built-ins
        Map: 'readonly',
        Set: 'readonly',
        Promise: 'readonly',
        Date: 'readonly',
        JSON: 'readonly',
        Math: 'readonly',
        Number: 'readonly',
        Object: 'readonly',
        Array: 'readonly',
        String: 'readonly',
        Error: 'readonly',
        // React
        React: 'readonly',
        // Web APIs
        RequestInit: 'readonly',
        SpeechSynthesisVoice: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'off', // Common pattern for initialization
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.claude/**',
      'vocabulary-extension-*/**',
      'scripts/**',
      '*.config.js',
      '*.config.ts',
      'vitest.setup.ts',
      'tests/**'
    ]
  }
]
