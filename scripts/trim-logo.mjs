import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(__dirname, "..", "Ekran görüntüsü 2026-05-21 103016.png");
const outputPath = join(__dirname, "..", "public", "aero-logo.png");

const meta = await sharp(sourcePath).metadata();
console.log("Source:", meta.width, "x", meta.height);

// Trim white + navy frame, then ensure RGBA raw
const trimmedBuf = await sharp(sourcePath)
  .trim({ background: "#ffffff", threshold: 30 })
  .toBuffer();
const trim2 = await sharp(trimmedBuf).trim({ threshold: 60 }).toBuffer();
const trim3 = await sharp(trim2).trim({ background: "#ffffff", threshold: 30 }).toBuffer();

const { data, info } = await sharp(trim3)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
console.log("Working size:", info.width, "x", info.height, "channels:", info.channels);

// Pass A: near-white pixels -> transparent (soft edge)
const WHITE_THRESHOLD = 235;
const SOFT_RANGE = 25;
let removed = 0;
for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const minRGB = Math.min(r, g, b);
  if (minRGB >= WHITE_THRESHOLD) {
    data[i + 3] = 0;
    removed++;
  } else if (minRGB >= WHITE_THRESHOLD - SOFT_RANGE) {
    const t = (minRGB - (WHITE_THRESHOLD - SOFT_RANGE)) / SOFT_RANGE;
    data[i + 3] = Math.round(255 * (1 - t));
  }
}
console.log("Pixels made transparent:", removed);

// Pass B: blue-dominant pixels -> white (keeps red/green bird detail)
let recolored = 0;
for (let i = 0; i < data.length; i += 4) {
  if (data[i + 3] === 0) continue;
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (b > r + 12 && b > g - 8 && b > 60) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    recolored++;
  }
}
console.log("Pixels recolored to white:", recolored);

// Pass C: drop any non-logo pixel (tan/beige border remnants).
// Keep only: white (recolored text), red-dominant, green-dominant.
let cleaned = 0;
for (let i = 0; i < data.length; i += 4) {
  if (data[i + 3] === 0) continue;
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const isWhite = r > 240 && g > 240 && b > 240;
  const isRed = r > g + 25 && r > b + 25 && r > 110;
  const isGreen = g > r + 20 && g > b + 20 && g > 90;
  if (!isWhite && !isRed && !isGreen) {
    data[i + 3] = 0;
    cleaned++;
  }
}
console.log("Border pixels dropped:", cleaned);

// Pass D: find tight bounding box of remaining content
let minX = info.width, maxX = -1, minY = info.height, maxY = -1;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 20) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;
console.log("Content bbox:", minX, minY, cropW, "x", cropH);

await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .extract({ left: minX, top: minY, width: cropW, height: cropH })
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

console.log("Wrote transparent PNG:", outputPath);
