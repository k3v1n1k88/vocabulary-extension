#!/usr/bin/env node
/**
 * Fail-fast guard for release builds.
 *
 * The dev `key` field locks the extension ID for unpacked dev installs
 * (so chrome.storage.sync testing works across devices). It MUST NOT ship
 * to Chrome Web Store — CWS rejects updates whose `key` differs from the
 * stored key, and even if it didn't, the published extension would change
 * identity and orphan every existing user's data.
 *
 * Usage (wired into npm run build:release):
 *   node scripts/verify-release-manifest.mjs
 *
 * Exits 1 if dist/manifest.json contains a `key` field. Exits 0 otherwise.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const manifestPath = resolve(__dirname, '..', 'dist', 'manifest.json')

if (!existsSync(manifestPath)) {
  console.error(`verify-release-manifest: ${manifestPath} not found. Did the build run?`)
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

if (manifest.key) {
  console.error('verify-release-manifest: FAIL')
  console.error('  dist/manifest.json contains a "key" field.')
  console.error('  This must not be shipped to Chrome Web Store.')
  console.error('  Cause: build was run without --mode release, or the manifest mode gate broke.')
  process.exit(1)
}

console.log('verify-release-manifest: OK — no dev key in release bundle')
