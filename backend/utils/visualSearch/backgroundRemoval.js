import { getVisualSearchConfig } from '../../config/visualSearch.js';

/**
 * Real background removal (Gemini does NOT provide this).
 * Providers:
 *  - imgly:    local ONNX segmentation via optional dep `@imgly/background-removal-node`
 *  - removebg: remove.bg HTTP API (needs REMOVE_BG_API_KEY)
 *  - none:     skip
 * Never throws: on any failure returns { buffer: input, removed: false, reason }.
 */
const viaImgly = async (buf) => {
  const mod = await import('@imgly/background-removal-node');
  const blob = await mod.removeBackground(new Blob([buf], { type: 'image/png' }), {
    output: { format: 'image/png' },
  });
  return Buffer.from(await blob.arrayBuffer());
};

const viaRemoveBg = async (buf, apiKey, fetchImpl) => {
  const form = new FormData();
  form.append('image_file', new Blob([buf], { type: 'image/png' }), 'product.png');
  form.append('size', 'auto');
  const res = await fetchImpl('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: form,
  });
  if (!res.ok) throw new Error(`remove.bg responded ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
};

export const removeBackground = async (buf, { fetchImpl = globalThis.fetch } = {}) => {
  const cfg = getVisualSearchConfig();
  try {
    if (cfg.bgProvider === 'none') return { buffer: buf, removed: false, reason: 'disabled' };
    if (cfg.bgProvider === 'removebg') {
      if (!cfg.removeBgApiKey) return { buffer: buf, removed: false, reason: 'REMOVE_BG_API_KEY not set' };
      return { buffer: await viaRemoveBg(buf, cfg.removeBgApiKey, fetchImpl), removed: true, provider: 'removebg' };
    }
    return { buffer: await viaImgly(buf), removed: true, provider: 'imgly' };
  } catch (err) {
    const missing = err?.code === 'ERR_MODULE_NOT_FOUND' || /Cannot find (module|package)/i.test(err?.message || '');
    console.warn('[VisualSearch] background removal skipped:', missing ? 'provider not installed' : err.message);
    return { buffer: buf, removed: false, reason: missing ? 'provider not installed' : 'provider error' };
  }
};
