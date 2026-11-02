/**
 * Visual Search configuration. All secrets come from environment variables;
 * nothing here is ever sent to the browser.
 */
const int = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};

export const getVisualSearchConfig = () => {
  const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  const geminiApiKeys = rawKeys
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    geminiApiKey: geminiApiKeys[0] || '',
    geminiApiKeys,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    geminiFallbackModel: process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.0-flash',
    geminiTimeoutMs: int(process.env.GEMINI_TIMEOUT_MS, 30000),
    // 'imgly' (local ONNX model, optional dependency) | 'removebg' (remove.bg API) | 'none'
    bgProvider: (process.env.BACKGROUND_REMOVAL_PROVIDER || 'imgly').toLowerCase(),
    removeBgApiKey: process.env.REMOVE_BG_API_KEY || '',
    serpApiKey: process.env.SERPAPI_KEY || '',
    maxUploadBytes: int(process.env.VISUAL_SEARCH_MAX_BYTES, 8 * 1024 * 1024),
    maxDimension: int(process.env.VISUAL_SEARCH_MAX_DIMENSION, 1280),
    requireAuth: String(process.env.VISUAL_SEARCH_REQUIRE_AUTH || 'false') === 'true',
  };
};
