import { getVisualSearchConfig } from '../../config/visualSearch.js';
import { CATEGORIES } from '../../models/Listing.js';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    isProduct: { type: 'BOOLEAN' },
    productName: { type: 'STRING' },
    category: { type: 'STRING', enum: CATEGORIES },
    brand: { type: 'STRING' },
    model: { type: 'STRING' },
    color: { type: 'STRING' },
    material: { type: 'STRING' },
    description: { type: 'STRING' },
    keywords: { type: 'ARRAY', items: { type: 'STRING' } },
    confidence: { type: 'NUMBER' },
    boundingBox: {
      type: 'OBJECT',
      properties: {
        ymin: { type: 'NUMBER' },
        xmin: { type: 'NUMBER' },
        ymax: { type: 'NUMBER' },
        xmax: { type: 'NUMBER' },
      },
      required: ['ymin', 'xmin', 'ymax', 'xmax'],
    },
  },
  required: ['isProduct', 'productName', 'category', 'description', 'keywords', 'confidence'],
};

const PROMPT = `You are the product-recognition engine of a campus second-hand marketplace.
Look at the photo and identify the single MAIN product the user is pointing the camera at (the most central / most prominent item). Ignore background objects, hands, tables and people.
Rules:
- Only state a brand or model if it is clearly visible (logo, text) or unmistakable. Otherwise return an empty string. Never guess.
- category MUST be one of: ${CATEGORIES.join(', ')}.
- keywords: 4-8 short lowercase search terms ordered from most to least specific (e.g. "nike air max", "running shoes", "sneakers").
- description: one or two factual sentences about what is visible.
- confidence: 0 to 1.
- boundingBox: tight box around the main product, each coordinate normalized 0-1000 (ymin, xmin, ymax, xmax).
- If there is no sellable product in the image (e.g. blank wall, only a person), set isProduct=false.
Return JSON only.`;

export class GeminiError extends Error {
  constructor(message, statusCode = 502, code = 'GEMINI_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

const callModel = async ({ model, apiKey, imageBase64, mimeType, timeoutMs, fetchImpl }) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json', responseSchema: SCHEMA },
      }),
      signal: ctrl.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
};

const clean = (s, max = 200) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** Validates & normalises the model output so the rest of the pipeline can trust it. */
export const parseIdentification = (raw) => {
  let data = raw;
  if (typeof raw === 'string') {
    const stripped = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try {
      data = JSON.parse(stripped);
    } catch {
      throw new GeminiError('The AI returned an unreadable response. Please try again.', 502, 'GEMINI_BAD_RESPONSE');
    }
  }
  if (!data || typeof data !== 'object') throw new GeminiError('Empty AI response.', 502, 'GEMINI_BAD_RESPONSE');

  const category = CATEGORIES.includes(data.category) ? data.category : 'Other';
  const keywords = Array.isArray(data.keywords)
    ? [...new Set(data.keywords.map((k) => clean(k, 40).toLowerCase()).filter(Boolean))].slice(0, 8)
    : [];
  const productName = clean(data.productName, 120);
  const confidence = Math.min(1, Math.max(0, Number(data.confidence) || 0));

  return {
    isProduct: data.isProduct !== false && Boolean(productName),
    productName,
    category,
    brand: clean(data.brand, 60),
    model: clean(data.model, 60),
    color: clean(data.color, 40),
    material: clean(data.material, 60),
    description: clean(data.description, 400),
    keywords,
    confidence,
    boundingBox: data.boundingBox || null,
  };
};

/**
 * Identify the main product in a JPEG buffer using Gemini vision.
 * Supports multiple API keys with automatic failover/rotation on rate limit (429) or quota errors.
 * @param {Buffer} jpegBuffer
 * @param {{fetchImpl?: Function}} [opts] injectable for tests
 */
let keyIndex = 0;

export const identifyProduct = async (jpegBuffer, { fetchImpl = globalThis.fetch } = {}) => {
  const cfg = getVisualSearchConfig();
  const apiKeys = cfg.geminiApiKeys && cfg.geminiApiKeys.length > 0 ? cfg.geminiApiKeys : [cfg.geminiApiKey].filter(Boolean);

  if (!apiKeys.length) {
    throw new GeminiError('Visual search is not configured on the server (missing GEMINI_API_KEY).', 503, 'GEMINI_NOT_CONFIGURED');
  }

  const imageBase64 = jpegBuffer.toString('base64');
  const models = [...new Set([cfg.geminiModel, cfg.geminiFallbackModel].filter(Boolean))];

  let lastErr;
  // Cycle through available keys starting from current index
  for (let attempt = 0; attempt < apiKeys.length; attempt++) {
    const activeKey = apiKeys[(keyIndex + attempt) % apiKeys.length];

    for (const model of models) {
      let res;
      try {
        res = await callModel({ model, apiKey: activeKey, imageBase64, mimeType: 'image/jpeg', timeoutMs: cfg.geminiTimeoutMs, fetchImpl });
      } catch (err) {
        lastErr = new GeminiError(
          err.name === 'AbortError' ? 'The AI took too long to respond. Please try again.' : 'Could not reach the AI service.',
          504,
          'GEMINI_UNREACHABLE'
        );
        break;
      }

      if (res.status === 429) {
        console.warn(`[Gemini] Key ...${activeKey.slice(-6)} hit 429 (rate limit). Rotating to next key.`);
        lastErr = new GeminiError('The AI service is busy right now (rate limit). Please wait a moment and try again.', 429, 'GEMINI_RATE_LIMIT');
        break; // break out of model loop to try next key in outer loop
      }
      if (res.status === 404 && model !== models[models.length - 1]) {
        lastErr = new GeminiError(`Model ${model} is unavailable.`, 502, 'GEMINI_MODEL_UNAVAILABLE');
        continue; // try fallback model
      }
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        console.error('[Gemini] auth/request error', res.status, `on key ...${activeKey.slice(-6)}`);
        lastErr = new GeminiError('The AI service rejected the request. Check the server GEMINI_API_KEY and model settings.', 502, 'GEMINI_REJECTED');
        break; // break to try fallback key if any
      }
      if (!res.ok) {
        lastErr = new GeminiError('The AI service failed. Please try again.', 502, 'GEMINI_ERROR');
        continue;
      }

      const body = await res.json();
      if (body?.promptFeedback?.blockReason) {
        throw new GeminiError('This image could not be analysed. Try a different photo.', 422, 'GEMINI_BLOCKED');
      }
      const text = body?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
      if (!text) throw new GeminiError('The AI returned no result. Try a clearer photo.', 502, 'GEMINI_EMPTY');
      
      // Update key index for load balancing across successful requests
      keyIndex = (keyIndex + attempt) % apiKeys.length;
      return { ...parseIdentification(text), modelUsed: model };
    }
  }

  throw lastErr || new GeminiError('The AI service is unavailable.', 502);
};
