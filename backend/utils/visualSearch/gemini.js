import { GoogleGenAI } from '@google/genai';
import { getVisualSearchConfig } from '../../config/visualSearch.js';
import { CATEGORIES } from '../../models/Listing.js';

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

const callModel = async ({ model, apiKey, imageBase64, mimeType, timeoutMs }) => {
  const ai = new GoogleGenAI({ apiKey });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
      },
    });
    return response;
  } catch (err) {
    if (err.name === 'AbortError' || controller.signal.aborted) {
      throw new Error('AbortError');
    }
    throw err;
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
 * Supports multiple API keys and multiple models with automatic failover.
 * @param {Buffer} jpegBuffer
 */
let keyIndex = 0;

export const identifyProduct = async (jpegBuffer) => {
  const cfg = getVisualSearchConfig();
  const apiKeys = cfg.geminiApiKeys && cfg.geminiApiKeys.length > 0
    ? cfg.geminiApiKeys
    : [cfg.geminiApiKey].filter(Boolean);

  if (!apiKeys.length) {
    throw new GeminiError('Visual search is not configured (missing GEMINI_API_KEY).', 503, 'GEMINI_NOT_CONFIGURED');
  }

  const imageBase64 = jpegBuffer.toString('base64');
  // 2 models max, 3 keys max per model = worst case 6 attempts x 10s = 60s
  const models = [...new Set([cfg.geminiModel, cfg.geminiFallbackModel].filter(Boolean))].slice(0, 2);
  const PER_ATTEMPT_MS = 10000; // 10s hard cap per attempt
  let lastErr;

  for (const model of models) {
    const keysToTry = apiKeys.slice(0, 3); // max 3 keys per model
    for (let i = 0; i < keysToTry.length; i++) {
      const ki = (keyIndex + i) % apiKeys.length;
      const activeKey = apiKeys[ki];
      console.log(`[Gemini] Trying model=${model} key#${ki + 1}`);

      // Race the SDK call against a hard timer promise
      let timerHandle;
      const timeoutPromise = new Promise((_, reject) => {
        timerHandle = setTimeout(() => reject(new Error('AbortError')), PER_ATTEMPT_MS);
      });

      let result;
      try {
        result = await Promise.race([
          callModel({ model, apiKey: activeKey, imageBase64, mimeType: 'image/jpeg', timeoutMs: PER_ATTEMPT_MS }),
          timeoutPromise,
        ]);
        clearTimeout(timerHandle);
      } catch (err) {
        clearTimeout(timerHandle);
        const isTimeout = /AbortError|timeout|aborted/i.test(err.message || err.name || '');
        const is503 = /503|unavailable|high demand/i.test(err.message || '');
        const is404 = /404|not found|no longer available/i.test(err.message || '');
        console.error(`[Gemini] model=${model} key#${ki + 1} failed: ${String(err.message).slice(0, 80)}`);
        lastErr = new GeminiError(
          isTimeout ? 'AI timed out, retrying...'
            : is503 ? 'AI busy, trying next key...'
            : is404 ? `Model ${model} not found, trying fallback...`
            : `AI error: ${String(err.message).slice(0, 60)}`,
          is503 ? 503 : isTimeout ? 504 : 502,
          'GEMINI_UNREACHABLE'
        );
        if (is404) break;
        continue;
      }

      const text = result?.text;
      if (!text) {
        const blockReason = result?.promptFeedback?.blockReason;
        if (blockReason) throw new GeminiError('Image blocked by AI safety filter. Try a clearer product photo.', 422, 'GEMINI_BLOCKED');
        lastErr = new GeminiError('AI returned empty result. Try a clearer photo.', 502, 'GEMINI_EMPTY');
        continue;
      }

      keyIndex = ki;
      console.log(`[Gemini] Success: model=${model} key#${keyIndex + 1}`);
      return { ...parseIdentification(text), modelUsed: model };
    }
  }

  throw lastErr || new GeminiError('The AI service is unavailable. Please try again later.', 502);
};
