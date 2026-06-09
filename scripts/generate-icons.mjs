// Generates the PWA icon set for Stocker as real PNG files (no native deps).
// Draws a simple "growth bars" mark on the brand-dark background so the app
// reads as a stock/inventory analytics tool. Re-run with: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public");
mkdirSync(PUBLIC, { recursive: true });

// ---- Brand palette ----
const BG = [9, 9, 11]; // zinc-950
const BAR = [244, 244, 245]; // zinc-100
const ACCENT = [52, 211, 153]; // emerald-400 (the "up" bar)

// ---- Tiny RGBA canvas ----
function makeCanvas(size) {
  const data = new Uint8Array(size * size * 4);
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    // alpha blend onto existing pixel
    const ia = a / 255;
    data[i] = r * ia + data[i] * (1 - ia);
    data[i + 1] = g * ia + data[i + 1] * (1 - ia);
    data[i + 2] = b * ia + data[i + 2] * (1 - ia);
    data[i + 3] = Math.max(data[i + 3], a);
  };
  const fillRect = (x0, y0, w, h, color, a = 255) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) set(Math.round(x), Math.round(y), color, a);
  };
  return { data, set, fillRect };
}

// Rounded-corner alpha mask (anti-aliased) applied after drawing.
function applyRoundedMask(data, size, radius) {
  const inside = (px, py) => {
    // distance from nearest corner center
    const corners = [
      [radius, radius],
      [size - radius, radius],
      [radius, size - radius],
      [size - radius, size - radius],
    ];
    if (px >= radius && px <= size - radius) return 1;
    if (py >= radius && py <= size - radius) return 1;
    let best = 0;
    for (const [cx, cy] of corners) {
      if ((px < radius || px > size - radius) && (py < radius || py > size - radius)) {
        const d = Math.hypot(px - cx, py - cy);
        const a = Math.min(1, Math.max(0, radius - d + 0.5));
        best = Math.max(best, a);
      }
    }
    return best;
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const m = inside(x + 0.5, y + 0.5);
      data[i + 3] = Math.round(data[i + 3] * m);
    }
}

function drawIcon(size, { maskable }) {
  const c = makeCanvas(size);
  // background
  c.fillRect(0, 0, size, size, BG);

  // content safe area — maskable needs content inside center ~80%
  const pad = Math.round(size * (maskable ? 0.26 : 0.2));
  const x0 = pad;
  const y0 = pad;
  const w = size - pad * 2;
  const h = size - pad * 2;

  // four bars with increasing height; last one is the accent "up" bar
  const bars = 4;
  const gap = w * 0.08;
  const barW = (w - gap * (bars - 1)) / bars;
  const heights = [0.42, 0.64, 0.52, 1.0];
  const baseline = y0 + h;
  for (let b = 0; b < bars; b++) {
    const bh = h * heights[b];
    const bx = x0 + b * (barW + gap);
    const by = baseline - bh;
    const color = b === bars - 1 ? ACCENT : BAR;
    c.fillRect(bx, by, barW, bh, color);
  }

  if (!maskable) applyRoundedMask(c.data, size, Math.round(size * 0.22));
  return { data: c.data, size };
}

// ---- PNG encoder (RGBA, 8-bit) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(rgba, size) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  // filtered raw data: filter byte 0 per scanline
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(
      raw,
      y * (size * 4 + 1) + 1
    );
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
  { file: "apple-icon.png", size: 180, maskable: false },
];

for (const t of targets) {
  const { data, size } = drawIcon(t.size, { maskable: t.maskable });
  writeFileSync(join(PUBLIC, t.file), encodePNG(data, size));
  console.log("wrote public/" + t.file);
}
