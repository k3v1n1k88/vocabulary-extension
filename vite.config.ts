import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

// Post-build hook to copy content script CSS
const copyContentCss = () => ({
  name: 'copy-content-css',
  closeBundle() {
    const srcCss = resolve(__dirname, 'src/content/content-style.css')
    const destDir = resolve(__dirname, 'dist/src/content')
    const destCss = resolve(destDir, 'content-style.css')

    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true })
    }
    copyFileSync(srcCss, destCss)
    console.log('Copied content-style.css to dist')
  }
})

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    copyContentCss()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html')
      }
    }
  }
})
