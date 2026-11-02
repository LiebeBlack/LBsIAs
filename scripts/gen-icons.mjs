// Genera los iconos PNG de la PWA sin dependencias externas.
// Uso: node scripts/gen-icons.mjs

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const OUTPUT = resolve(process.cwd(), 'public')

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let value = n
    for (let k = 0; k < 8; k += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[n] = value
  }
  return table
})()

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([length, body, crc])
}

function png(size) {
  const width = size
  const height = size
  const raw = Buffer.alloc((width * 4 + 1) * height)

  const radius = size * 0.22
  const barHalf = size * 0.29
  const barWidth = size * 0.055
  const center = size / 2

  const segmentDistance = (px, py, ax, ay, bx, by) => {
    const vx = bx - ax
    const vy = by - ay
    const wx = px - ax
    const wy = py - ay
    const lengthSquared = vx * vx + vy * vy
    const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / lengthSquared))
    return Math.hypot(px - (ax + t * vx), py - (ay + t * vy))
  }

  const roundedRect = (x, y) => {
    const inset = size * 0.035
    const halfWidth = size / 2 - inset
    const cx = Math.abs(x - center) - (halfWidth - radius)
    const cy = Math.abs(y - center) - (halfWidth - radius)
    const dx = Math.max(cx, 0)
    const dy = Math.max(cy, 0)
    return Math.hypot(dx, dy) + Math.min(Math.max(cx, cy), 0) - radius
  }

  const bars = [
    [center - barHalf, center, center + barHalf, center],
    [center, center - barHalf, center, center + barHalf],
    [center - barHalf * 0.72, center - barHalf * 0.72, center + barHalf * 0.72, center + barHalf * 0.72],
    [center + barHalf * 0.72, center - barHalf * 0.72, center - barHalf * 0.72, center + barHalf * 0.72],
  ]

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1)
    raw[rowStart] = 0
    for (let x = 0; x < width; x += 1) {
      const px = x + 0.5
      const py = y + 0.5
      const edge = roundedRect(px, py)
      const alpha = Math.min(1, Math.max(0, 0.5 - edge))
      const offset = rowStart + 1 + x * 4
      if (alpha <= 0) continue

      // Degradado violeta → turquesa en diagonal.
      const mix = Math.min(1, Math.max(0, (px + py) / (size * 2)))
      const r = Math.round(139 + (75 - 139) * mix)
      const g = Math.round(108 + (230 - 108) * mix)
      const b = Math.round(255 + (196 - 255) * mix)

      let glyph = 0
      for (const [ax, ay, bx, by] of bars) {
        const distance = segmentDistance(px, py, ax, ay, bx, by)
        glyph = Math.max(glyph, Math.min(1, Math.max(0, 0.5 - (distance - barWidth / 2))))
      }

      const red = Math.round(r * (1 - glyph) + 255 * glyph)
      const green = Math.round(g * (1 - glyph) + 255 * glyph)
      const blue = Math.round(b * (1 - glyph) + 255 * glyph)

      raw[offset] = red
      raw[offset + 1] = green
      raw[offset + 2] = blue
      raw[offset + 3] = Math.round(alpha * 255)
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(OUTPUT, { recursive: true })
for (const size of [180, 192, 512]) {
  const target = resolve(OUTPUT, `icon-${size}.png`)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, png(size))
  console.log(`[nexo] icono ${size}×${size} → ${target}`)
}
