import { getVisualSearchConfig } from '../../config/visualSearch.js';

export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

/** Detect real image type from magic bytes (never trust client MIME alone). */
export const sniffImageType = (buf) => {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
};

export const validateImageBuffer = (buf) => {
  const cfg = getVisualSearchConfig();
  if (!buf || !buf.length) {
    const e = new Error('No image received. Please capture or upload a photo.');
    e.statusCode = 400;
    throw e;
  }
  if (buf.length > cfg.maxUploadBytes) {
    const e = new Error(`Image is too large (max ${Math.round(cfg.maxUploadBytes / 1048576)}MB).`);
    e.statusCode = 413;
    throw e;
  }
  const type = sniffImageType(buf);
  if (!type) {
    const e = new Error('Unsupported image. Please use a JPEG, PNG or WebP photo.');
    e.statusCode = 415;
    throw e;
  }
  return type;
};

const loadSharp = async () => {
  try {
    return (await import('sharp')).default;
  } catch {
    const e = new Error('Image processing library (sharp) is not installed on the server. Run `npm install` in /backend.');
    e.statusCode = 500;
    throw e;
  }
};

/** Auto-orient (EXIF), downscale and re-encode as JPEG. Strips metadata (GPS etc). */
export const compressForAnalysis = async (buf) => {
  const sharp = await loadSharp();
  const { maxDimension } = getVisualSearchConfig();
  try {
    return await sharp(buf, { failOn: 'error' })
      .rotate()
      .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  } catch {
    const e = new Error('That file could not be read as an image. Please try another photo.');
    e.statusCode = 422;
    throw e;
  }
};

/**
 * Clamp Gemini's normalized (0-1000) bounding box, add padding.
 * Returns null when the box is missing/degenerate/covers (almost) everything.
 */
export const normalizeBox = (box, pad = 0.04) => {
  if (!box) return null;
  const vals = [box.ymin, box.xmin, box.ymax, box.xmax].map(Number);
  if (vals.some((n) => !Number.isFinite(n))) return null;
  let [ymin, xmin, ymax, xmax] = vals.map((n) => Math.min(1000, Math.max(0, n)) / 1000);
  if (ymax <= ymin || xmax <= xmin) return null;
  const h = ymax - ymin;
  const w = xmax - xmin;
  if (h < 0.05 || w < 0.05) return null;
  ymin = Math.max(0, ymin - h * pad);
  xmin = Math.max(0, xmin - w * pad);
  ymax = Math.min(1, ymax + h * pad);
  xmax = Math.min(1, xmax + w * pad);
  return { ymin, xmin, ymax, xmax };
};

/** Crop a JPEG/PNG buffer to a normalized box. Returns the original if no usable box. */
export const cropToBox = async (buf, box) => {
  const nb = normalizeBox(box);
  if (!nb) return { buffer: buf, cropped: false };
  const sharp = await loadSharp();
  const meta = await sharp(buf).metadata();
  const left = Math.floor(nb.xmin * meta.width);
  const top = Math.floor(nb.ymin * meta.height);
  const width = Math.max(1, Math.min(meta.width - left, Math.ceil((nb.xmax - nb.xmin) * meta.width)));
  const height = Math.max(1, Math.min(meta.height - top, Math.ceil((nb.ymax - nb.ymin) * meta.height)));
  const out = await sharp(buf).extract({ left, top, width, height }).toBuffer();
  return { buffer: out, cropped: true };
};

/** Small PNG thumbnail data URL (keeps responses light). */
export const toDataUrl = (buf, mime) => `data:${mime};base64,${buf.toString('base64')}`;

/** Downscale to a PNG no larger than `max` px (used before/after segmentation to keep payloads small). */
export const toPng = async (buf, max = 768) => {
  const sharp = await loadSharp();
  return sharp(buf)
    .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
};
