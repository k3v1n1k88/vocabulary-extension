#!/usr/bin/env node
/**
 * Generate a 2048-bit RSA key pair for use as the Chrome extension dev `key`.
 *
 * Why: chrome.storage.sync data is partitioned by extension ID. Unpacked
 * dev installs get a random ID per machine, breaking cross-device sync
 * testing. Adding the same `"key"` (the base64-encoded public key) to
 * manifest.ts on every dev install pins the ID, so all dev profiles share
 * the same chrome.storage.sync silo.
 *
 * Usage:
 *   npm run dev-key:generate
 *
 * Output:
 *   - scripts/dev-extension-key.pem   (private key — gitignored, optional)
 *   - prints the public key value to copy into manifest.ts
 *
 * Run ONCE per project. The public key value should be committed to
 * manifest.ts so the whole team's dev installs share the same extension ID.
 * The .pem private key is only needed if you also want to sign a .crx
 * (unpacked installs don't need it — discard the .pem if unsure).
 */

import { generateKeyPairSync } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pemPath = resolve(__dirname, 'dev-extension-key.pem')

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'der' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
})

writeFileSync(pemPath, privateKey, { mode: 0o600 })
const publicKeyBase64 = publicKey.toString('base64')

console.log('\nDev extension key generated.\n')
console.log(`Private key (gitignored): ${pemPath}`)
console.log('\nPublic key — paste this exact value into src/manifest.ts as DEV_EXTENSION_KEY:\n')
console.log(publicKeyBase64)
console.log('\nThen rebuild and reload the extension on every dev profile/device.')
console.log('All unpacked installs of this manifest will now share the same extension ID.\n')
