import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '..', 'public', 'icons')

const sizes = [16, 32, 48, 128]

async function convertSvgToPng() {
  for (const size of sizes) {
    const svgPath = join(iconsDir, `icon-${size}.svg`)
    const pngPath = join(iconsDir, `icon-${size}.png`)

    try {
      const svgBuffer = readFileSync(svgPath)
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(pngPath)
      console.log(`Created ${pngPath}`)
    } catch (err) {
      console.error(`Error converting ${svgPath}:`, err.message)
    }
  }
}

convertSvgToPng()
