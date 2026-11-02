import Listing from '../models/Listing.js';
import { getVisualSearchConfig } from '../config/visualSearch.js';
import { validateImageBuffer, compressForAnalysis, cropToBox, toPng, toDataUrl } from '../utils/visualSearch/imageProcessing.js';
import { identifyProduct } from '../utils/visualSearch/gemini.js';
import { removeBackground } from '../utils/visualSearch/backgroundRemoval.js';
import { candidateTokens, rankListings, validateIdentificationInput } from '../utils/visualSearch/productMatcher.js';
import { searchExternal } from '../utils/visualSearch/externalSearch.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @desc   Identify the main product in an uploaded photo (Gemini) and isolate it (segmentation)
 * @route  POST /api/visual-search/identify   (multipart field: "image")
 * All image data stays in memory; nothing is written to disk, so there are no temp files to clean up.
 */
export const identify = async (req, res) => {
  const buf = req.file?.buffer;
  validateImageBuffer(buf);

  const analysisJpeg = await compressForAnalysis(buf);
  const ident = await identifyProduct(analysisJpeg);

  if (!ident.isProduct) {
    return res.status(200).json({
      success: true,
      data: { identification: ident, isProduct: false, message: "We couldn't spot a product in that photo. Try getting closer with better lighting." },
    });
  }

  const { buffer: cropped, cropped: wasCropped } = await cropToBox(analysisJpeg, ident.boundingBox);
  const croppedPng = await toPng(cropped, 768);
  const bg = await removeBackground(croppedPng);
  const isolatedPng = bg.removed ? await toPng(bg.buffer, 768) : croppedPng;

  const { boundingBox, ...identification } = ident;
  return res.json({
    success: true,
    data: {
      isProduct: true,
      identification,
      isolatedImage: toDataUrl(isolatedPng, 'image/png'),
      processing: {
        cropped: wasCropped,
        backgroundRemoved: bg.removed,
        backgroundProvider: bg.provider || null,
        backgroundNote: bg.removed ? '' : `Background removal unavailable (${bg.reason}); showing cropped product instead.`,
      },
    },
  });
};

/** Pre-filter candidates in Mongo, then score in-process (existing Listing collection only). */
export const findCandidateListings = async (ident, { ListingModel = Listing } = {}) => {
  const tokens = candidateTokens(ident);
  const or = tokens.map((t) => {
    const rx = new RegExp(escapeRegex(t), 'i');
    return { $or: [{ title: rx }, { description: rx }] };
  });
  const query = { status: { $in: ['Available', 'AVAILABLE'] } };
  if (or.length) query.$or = or;
  else if (ident.category) query.category = ident.category;

  return ListingModel.find(query)
    .populate('seller', 'name college avatar')
    .sort({ createdAt: -1 })
    .limit(80)
    .lean();
};

const publicListing = (l) => ({
  _id: l._id,
  title: l.title,
  description: l.description,
  price: l.price,
  category: l.category,
  condition: l.condition,
  imageUrl: l.imageUrl,
  status: l.status,
  availability: String(l.status).toLowerCase() === 'available' ? 'Available' : 'Sold',
  createdAt: l.createdAt,
  seller: l.seller ? { _id: l.seller._id, name: l.seller.name, college: l.seller.college, avatar: l.seller.avatar } : null,
  matchScore: l.matchScore,
  matchReasons: l.matchReasons,
});

/**
 * @desc   Search Uni-Store listings for the identified product
 * @route  POST /api/visual-search/search   body: { identification }
 */
export const searchStore = async (req, res) => {
  const ident = validateIdentificationInput(req.body);
  const candidates = await findCandidateListings(ident);
  const { exact, similar } = rankListings(candidates, ident);
  return res.json({
    success: true,
    data: {
      exact: exact.map(publicListing),
      similar: similar.map(publicListing),
      found: exact.length + similar.length > 0,
    },
  });
};

/**
 * @desc   External marketplace alternatives (Amazon.in / Flipkart)
 * @route  POST /api/visual-search/external   body: { identification }
 */
export const searchExternalMarketplaces = async (req, res) => {
  const ident = validateIdentificationInput(req.body);
  const data = await searchExternal(ident);
  return res.json({
    success: true,
    data: {
      ...data,
      message: 'Sorry! This product is currently unavailable in Uni-Store. However, we found some alternatives for you.',
    },
  });
};

export const status = (req, res) => {
  const cfg = getVisualSearchConfig();
  res.json({
    success: true,
    data: { configured: Boolean(cfg.geminiApiKey), backgroundProvider: cfg.bgProvider, liveExternalResults: Boolean(cfg.serpApiKey) },
  });
};
