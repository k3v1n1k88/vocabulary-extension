import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import obfuscatorPlugin from 'rollup-plugin-obfuscator'
import manifest from './src/manifest'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, unlinkSync, readdirSync } from 'fs'

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

// Post-build hook to remove source maps from dist (for release builds)
const removeSourceMaps = () => ({
  name: 'remove-source-maps',
  closeBundle() {
    const distDir = resolve(__dirname, 'dist')
    const assetsDir = resolve(distDir, 'assets')

    const removeMapFiles = (dir: string) => {
      if (!existsSync(dir)) return
      const files = readdirSync(dir)
      files.forEach(file => {
        if (file.endsWith('.map')) {
          unlinkSync(resolve(dir, file))
          console.log(`Removed source map: ${file}`)
        }
      })
    }

    removeMapFiles(distDir)
    removeMapFiles(assetsDir)
  }
})

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    crx({ manifest }),
    copyContentCss(),
    // Obfuscate in production and release modes
    (mode === 'production' || mode === 'release') && obfuscatorPlugin({
      options: {
        // MV3 compatible settings (no eval)
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.3,
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        stringArray: true,
        stringArrayEncoding: ['base64'], // NOT 'rc4' (uses eval)
        stringArrayThreshold: 0.5,
        // MUST disable for Chrome MV3
        selfDefending: false,
        debugProtection: false,
        disableConsoleOutput: false,
      }
    }),
    // Remove source maps in release mode
    mode === 'release' && removeSourceMaps()
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    // Generate source maps in production only (for debugging), not in release
    sourcemap: mode === 'production' ? 'hidden' : false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html')
      }
    }
  }
}))
