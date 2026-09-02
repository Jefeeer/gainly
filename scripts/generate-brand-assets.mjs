// Re-runnable brand asset pipeline: samples the real logo's palette, keys out its
// white background with anti-alias decontamination, splits the mark from the
// wordmark, and renders every derivative the design system needs.
// Run: cd gainly/scripts && npm install && npm run brand-assets
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SRC = path.resolve(REPO_ROOT, "..", "Gainly-logo.png");
const OUT_DIR = path.join(REPO_ROOT, "packages", "ui", "assets", "brand");

const DARK_BG = { r: 15, g: 18, b: 17 }; // token bg/base (dark) #0F1211
const LIGHT_SUBSTITUTE = { r: 237, g: 239, b: 236 }; // token text/primary (dark) #EDEFEC

fs.mkdirSync(OUT_DIR, { recursive: true });

function hex({ r, g, b }) {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
}
function dist(a, b, off = 0) {
  const dr = a[off] - b.r, dg = a[off + 1] - b.g, db = a[off + 2] - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}
// WCAG contrast
function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
function luminance({ r, g, b }) { return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); }
function contrast(a, b) {
  let l1 = luminance(a), l2 = luminance(b);
  if (l1 < l2) [l1, l2] = [l2, l1];
  return (l1 + 0.05) / (l2 + 0.05);
}

async function main() {
  const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info; // channels === 3 (source has no alpha)
  console.log(`source: ${width}x${height}x${channels}`);

  // 1. sample background from the four corners (10x10 blocks)
  const corners = [
    [0, 0], [width - 10, 0], [0, height - 10], [width - 10, height - 10],
  ];
  let br = 0, bg = 0, bb = 0, bn = 0;
  for (const [cx, cy] of corners) {
    for (let y = cy; y < cy + 10; y++) {
      for (let x = cx; x < cx + 10; x++) {
        const o = (y * width + x) * channels;
        br += data[o]; bg += data[o + 1]; bb += data[o + 2]; bn++;
      }
    }
  }
  const BG = { r: br / bn, g: bg / bn, b: bb / bn };
  console.log("sampled background:", hex(BG), BG);

  const T_BG = 14, T_FG = 45;
  const cls = new Uint8Array(width * height); // 0 bg, 1 solid, 2 edge
  for (let i = 0, p = 0; i < width * height; i++, p += channels) {
    const d = dist(data, BG, p);
    cls[i] = d < T_BG ? 0 : d > T_FG ? 1 : 2;
  }

  const outRGBA = new Uint8Array(width * height * 4);
  // pass 1: bg -> alpha 0, solid -> alpha 255 unchanged color
  for (let i = 0, p = 0, o = 0; i < width * height; i++, p += channels, o += 4) {
    if (cls[i] === 1) {
      outRGBA[o] = data[p]; outRGBA[o + 1] = data[p + 1]; outRGBA[o + 2] = data[p + 2]; outRGBA[o + 3] = 255;
    } else if (cls[i] === 0) {
      outRGBA[o + 3] = 0;
    }
  }
  // pass 2: edge pixels - decontaminate against nearest solid neighbor
  let edgeCount = 0, edgeResolved = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (cls[i] !== 2) continue;
      edgeCount++;
      let found = null;
      for (let r = 1; r <= 8 && !found; r++) {
        for (let dy = -r; dy <= r && !found; dy++) {
          for (let dx = -r; dx <= r && !found; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const ni = ny * width + nx;
            if (cls[ni] === 1) found = ni;
          }
        }
      }
      const p = i * channels;
      const o = i * 4;
      if (found === null) {
        // isolated edge pixel with no nearby solid - fall back to whiteness alpha, keep color
        const d = dist(data, BG, p);
        const a = Math.max(0, Math.min(1, (d - T_BG) / (T_FG - T_BG)));
        outRGBA[o] = data[p]; outRGBA[o + 1] = data[p + 1]; outRGBA[o + 2] = data[p + 2];
        outRGBA[o + 3] = Math.round(a * 255);
        continue;
      }
      edgeResolved++;
      const fp = found * channels;
      const Cfg = { r: data[fp], g: data[fp + 1], b: data[fp + 2] };
      let sum = 0, n = 0;
      for (const c of ["r", "g", "b"]) {
        const denom = Cfg[c] - BG[c];
        if (Math.abs(denom) > 15) {
          const idx = c === "r" ? 0 : c === "g" ? 1 : 2;
          const a = (data[p + idx] - BG[c]) / denom;
          sum += a; n++;
        }
      }
      const a = n > 0 ? Math.max(0, Math.min(1, sum / n)) : 0;
      outRGBA[o] = Cfg.r; outRGBA[o + 1] = Cfg.g; outRGBA[o + 2] = Cfg.b;
      outRGBA[o + 3] = Math.round(a * 255);
    }
  }
  console.log(`edge pixels: ${edgeCount}, resolved via neighbor: ${edgeResolved}`);

  // 2. find the mark/wordmark split via row density gap
  const rowCount = new Array(height).fill(0);
  for (let y = 0; y < height; y++) {
    let c = 0;
    for (let x = 0; x < width; x++) if (outRGBA[(y * width + x) * 4 + 3] > 10) c++;
    rowCount[y] = c;
  }
  const fgRows = rowCount.map((c, y) => (c > 0 ? y : -1)).filter((y) => y >= 0);
  const topFG = fgRows[0], bottomFG = fgRows[fgRows.length - 1];
  // largest contiguous zero-run strictly inside [topFG, bottomFG]
  let bestGap = { start: -1, len: 0 };
  let runStart = -1;
  for (let y = topFG; y <= bottomFG; y++) {
    if (rowCount[y] === 0) {
      if (runStart === -1) runStart = y;
    } else if (runStart !== -1) {
      const len = y - runStart;
      if (len > bestGap.len) bestGap = { start: runStart, len };
      runStart = -1;
    }
  }
  if (bestGap.len === 0) throw new Error("no mark/wordmark gap found - unexpected layout");
  const splitRow = bestGap.start + Math.floor(bestGap.len / 2);
  console.log(`mark/wordmark gap: rows ${bestGap.start}-${bestGap.start + bestGap.len} (split at ${splitRow})`);

  function bboxInRowRange(y0, y1) {
    let minX = width, maxX = -1, minY = height, maxY = -1;
    for (let y = y0; y <= y1; y++) {
      for (let x = 0; x < width; x++) {
        if (outRGBA[(y * width + x) * 4 + 3] > 10) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    return { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }
  const markBox = bboxInRowRange(topFG, splitRow - 1);
  const wordBox = bboxInRowRange(splitRow + 1, bottomFG);
  const fullBox = bboxInRowRange(topFG, bottomFG);
  console.log("markBox", markBox);
  console.log("wordBox", wordBox);

  // 3. palette sampling from solid (non-edge) pixels
  const charcoalBins = new Map();
  const greenBins = new Map();
  for (let i = 0; i < width * height; i++) {
    if (cls[i] !== 1) continue;
    const p = i * channels;
    const r = data[p], g = data[p + 1], b = data[p + 2];
    const { h, s, l } = rgbToHsl(r, g, b);
    const key = [Math.round(r / 8) * 8, Math.round(g / 8) * 8, Math.round(b / 8) * 8].join(",");
    const x = i % width, y = Math.floor(i / width);
    if (s < 0.15) {
      const rec = charcoalBins.get(key) || { r, g, b, count: 0, sx: 0, sy: 0 };
      rec.count++; rec.sx += x; rec.sy += y;
      charcoalBins.set(key, rec);
    } else if (h > 60 && h < 175) {
      const rec = greenBins.get(key) || { r, g, b, count: 0, sx: 0, sy: 0, l };
      rec.count++; rec.sx += x; rec.sy += y;
      greenBins.set(key, rec);
    }
  }
  const charcoalTop = [...charcoalBins.values()].sort((a, b) => b.count - a.count)[0];
  const greenSorted = [...greenBins.values()].filter((v) => v.count > width * height * 0.0003);
  const darkStop = greenSorted.slice().sort((a, b) => rgbToHsl(a.r, a.g, a.b).l - rgbToHsl(b.r, b.g, b.b).l)[0];
  const lightStop = greenSorted.slice().sort((a, b) => rgbToHsl(b.r, b.g, b.b).l - rgbToHsl(a.r, a.g, a.b).l)[0];
  const darkCentroid = { x: darkStop.sx / darkStop.count, y: darkStop.sy / darkStop.count };
  const lightCentroid = { x: lightStop.sx / lightStop.count, y: lightStop.sy / lightStop.count };
  const dx = lightCentroid.x - darkCentroid.x, dy = lightCentroid.y - darkCentroid.y;
  const angleDeg = Math.round(((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360);

  const CHARCOAL = { r: charcoalTop.r, g: charcoalTop.g, b: charcoalTop.b };
  const GREEN_DARK = { r: darkStop.r, g: darkStop.g, b: darkStop.b };
  const GREEN_LIGHT = { r: lightStop.r, g: lightStop.g, b: lightStop.b };

  const palette = {
    charcoal: hex(CHARCOAL),
    gradientDarkStop: hex(GREEN_DARK),
    gradientLightStop: hex(GREEN_LIGHT),
    gradientAngleDeg: angleDeg,
    cssGradient: `linear-gradient(${angleDeg}deg, ${hex(GREEN_DARK)} 0%, ${hex(GREEN_LIGHT)} 100%)`,
  };
  console.log("palette:", palette);

  const contrastReport = {
    "charcoal on white": contrast(CHARCOAL, { r: 255, g: 255, b: 255 }).toFixed(2),
    "charcoal on dark-bg #0F1211": contrast(CHARCOAL, DARK_BG).toFixed(2),
    "gradientDarkStop on white": contrast(GREEN_DARK, { r: 255, g: 255, b: 255 }).toFixed(2),
    "gradientLightStop on white": contrast(GREEN_LIGHT, { r: 255, g: 255, b: 255 }).toFixed(2),
    "gradientDarkStop on dark-bg #0F1211": contrast(GREEN_DARK, DARK_BG).toFixed(2),
    "gradientLightStop on dark-bg #0F1211": contrast(GREEN_LIGHT, DARK_BG).toFixed(2),
    "light-substitute #EDEFEC on dark-bg #0F1211": contrast(LIGHT_SUBSTITUTE, DARK_BG).toFixed(2),
  };
  console.log("contrast report:", contrastReport);

  // 4. recolored (dark-background) variant: swap charcoal-hued pixels for the light substitute
  function recoloredBuffer(src) {
    const out = new Uint8Array(src.length);
    out.set(src);
    for (let i = 0; i < width * height; i++) {
      const o = i * 4;
      if (out[o + 3] === 0) continue;
      // charcoal cluster measures s ~0.08-0.25 depending on AA blending; brand green is s>=0.7.
      // 0.4 keeps a large margin from green while catching every charcoal shade.
      const { s } = rgbToHsl(out[o], out[o + 1], out[o + 2]);
      if (s < 0.4) {
        out[o] = LIGHT_SUBSTITUTE.r; out[o + 1] = LIGHT_SUBSTITUTE.g; out[o + 2] = LIGHT_SUBSTITUTE.b;
      }
    }
    return out;
  }
  const outRGBA_dark = recoloredBuffer(outRGBA);

  async function extractPadded(buf, box, padFrac, square) {
    const padX = Math.round(box.w * padFrac);
    const padY = Math.round(box.h * padFrac);
    const cw = box.w + padX * 2, ch = box.h + padY * 2;
    const side = square ? Math.max(cw, ch) : null;
    const raw = sharp(Buffer.from(buf), { raw: { width, height, channels: 4 } });
    const cropped = await raw.extract({ left: box.minX, top: box.minY, width: box.w, height: box.h }).png().toBuffer();
    const canvasW = side ?? cw, canvasH = side ?? ch;
    return sharp({ create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: cropped, left: Math.round((canvasW - box.w) / 2), top: Math.round((canvasH - box.h) / 2) }])
      .png()
      .toBuffer();
  }

  const markTransparent = await extractPadded(outRGBA, markBox, 0.12, true);
  const markDarkBg = await extractPadded(outRGBA_dark, markBox, 0.12, true);
  const lockupStackedTransparent = await extractPadded(outRGBA, fullBox, 0.08, false);
  const lockupStackedDarkBg = await extractPadded(outRGBA_dark, fullBox, 0.08, false);

  await sharp(markTransparent).toFile(path.join(OUT_DIR, "mark-transparent.png"));
  await sharp(markDarkBg).toFile(path.join(OUT_DIR, "mark-dark-bg.png"));
  await sharp(lockupStackedTransparent).toFile(path.join(OUT_DIR, "lockup-stacked-transparent.png"));
  await sharp(lockupStackedDarkBg).toFile(path.join(OUT_DIR, "lockup-stacked-dark-bg.png"));

  // horizontal lockup: mark + wordmark side by side, wordmark height-matched to ~0.62x mark height
  async function horizontalLockup(buf, suffix) {
    const wordCrop = sharp(Buffer.from(buf), { raw: { width, height, channels: 4 } })
      .extract({ left: wordBox.minX, top: wordBox.minY, width: wordBox.w, height: wordBox.h });
    const markCrop = sharp(Buffer.from(buf), { raw: { width, height, channels: 4 } })
      .extract({ left: markBox.minX, top: markBox.minY, width: markBox.w, height: markBox.h });
    const markTargetH = Math.round(wordBox.h * 1.9);
    const markResized = await markCrop.resize({ height: markTargetH }).png().toBuffer();
    const markMeta = await sharp(markResized).metadata();
    const gap = Math.round(markMeta.width * 0.22);
    const wordBuf = await wordCrop.png().toBuffer();
    const canvasW = markMeta.width + gap + wordBox.w;
    const canvasH = Math.max(markMeta.height, wordBox.h);
    const buf2 = await sharp({ create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([
        { input: markResized, left: 0, top: Math.round((canvasH - markMeta.height) / 2) },
        { input: wordBuf, left: markMeta.width + gap, top: Math.round((canvasH - wordBox.h) / 2) },
      ])
      .png()
      .toBuffer();
    await sharp(buf2).toFile(path.join(OUT_DIR, `lockup-horizontal-${suffix}.png`));
  }
  await horizontalLockup(outRGBA, "transparent");
  await horizontalLockup(outRGBA_dark, "dark-bg");

  const markExtractRect = { left: markBox.minX, top: markBox.minY, width: markBox.w, height: markBox.h };

  // iOS app icon: opaque 1024x1024, dark-bg-token background, mark at 70% width, no alpha channel
  const iconMarkBuf = await sharp(Buffer.from(outRGBA_dark), { raw: { width, height, channels: 4 } })
    .extract(markExtractRect)
    .resize({ width: Math.round(1024 * 0.7) })
    .png()
    .toBuffer();
  const iconMarkMeta = await sharp(iconMarkBuf).metadata();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { ...DARK_BG, alpha: 1 } } })
    .composite([{ input: iconMarkBuf, left: Math.round((1024 - iconMarkMeta.width) / 2), top: Math.round((1024 - iconMarkMeta.height) / 2) }])
    .flatten({ background: DARK_BG })
    .png()
    .toFile(path.join(OUT_DIR, "app-icon-ios-1024.png"));

  // android adaptive icon: 432x432 (108dp @4x), foreground mark within 66% safe-zone circle, separate flat background
  const ANDROID_SIZE = 432;
  const safeDiameter = Math.round(ANDROID_SIZE * 0.66);
  // foreground must use the light-charcoal variant: it composites over the dark background layer below
  const androidMarkBuf = await sharp(Buffer.from(outRGBA_dark), { raw: { width, height, channels: 4 } })
    .extract(markExtractRect)
    .resize({ width: safeDiameter })
    .png()
    .toBuffer();
  const androidMarkMeta = await sharp(androidMarkBuf).metadata();
  await sharp({ create: { width: ANDROID_SIZE, height: ANDROID_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: androidMarkBuf, left: Math.round((ANDROID_SIZE - androidMarkMeta.width) / 2), top: Math.round((ANDROID_SIZE - androidMarkMeta.height) / 2) }])
    .png()
    .toFile(path.join(OUT_DIR, "android-adaptive-foreground-432.png"));
  await sharp({ create: { width: ANDROID_SIZE, height: ANDROID_SIZE, channels: 4, background: { ...DARK_BG, alpha: 1 } } })
    .png()
    .toFile(path.join(OUT_DIR, "android-adaptive-background-432.png"));

  // expo splash: transparent mark, moderate scale, meant for `contain` + configured backgroundColor.
  // Two variants since splash backgroundColor follows system theme (§31) - natural mark reads on light, recolored on dark.
  async function splashMark(buf, suffix) {
    const markBuf = await sharp(Buffer.from(buf), { raw: { width, height, channels: 4 } })
      .extract(markExtractRect)
      .resize({ width: Math.round(1200 * 0.34) })
      .png()
      .toBuffer();
    const meta = await sharp(markBuf).metadata();
    await sharp({ create: { width: 1200, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: markBuf, left: Math.round((1200 - meta.width) / 2), top: Math.round((1200 - meta.height) / 2) }])
      .png()
      .toFile(path.join(OUT_DIR, `splash-mark-${suffix}-1200.png`));
  }
  await splashMark(outRGBA, "light");
  await splashMark(outRGBA_dark, "dark");

  // favicons + apple touch icon, from the tight mark-transparent crop
  for (const size of [16, 32, 48]) {
    await sharp(markTransparent).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toFile(path.join(OUT_DIR, `favicon-${size}.png`));
  }
  await sharp(markTransparent).resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toFile(path.join(OUT_DIR, "apple-touch-icon-180.png"));

  const manifest = {
    generatedFrom: SRC,
    sourceDimensions: { width, height },
    palette,
    contrastReport,
    files: fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".png")).sort(),
  };
  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("wrote manifest.json and", manifest.files.length, "PNGs to", OUT_DIR);
}

main().catch((e) => { console.error(e); process.exit(1); });
