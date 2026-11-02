/**
 * Pure, dependency-free product matching for Uni-Store listings.
 * Scores existing Listing documents against a Gemini identification.
 * No new database or model: callers pass in candidate Listing objects.
 */
const STOP = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'for', 'with', 'in', 'on', 'to', 'by', 'is', 'it', 'new', 'used',
  'good', 'condition', 'very', 'pair', 'set', 'piece', 'item', 'product', 'black', 'white',
]);

const stem = (t) => (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t);

export const tokenize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(stem)
    .filter((t) => t.length > 1 && !STOP.has(t));

const uniq = (arr) => [...new Set(arr)];

/** Tokens used to pre-filter candidates in MongoDB. */
export const candidateTokens = (ident) =>
  uniq([
    ...tokenize(ident.brand),
    ...tokenize(ident.model),
    ...tokenize(ident.productName),
    ...(ident.keywords || []).flatMap(tokenize),
  ]).slice(0, 14);

const containsAll = (hay, tokens) => tokens.length > 0 && tokens.every((t) => hay.has(t));

/**
 * @returns {{score:number, exact:boolean, reasons:string[], signals:number}}
 */
export const scoreListing = (listing, ident) => {
  const title = new Set(tokenize(listing.title));
  const all = new Set([...title, ...tokenize(listing.description)]);
  const reasons = [];
  let score = 0;
  let signals = 0;

  const brandT = tokenize(ident.brand);
  const modelT = tokenize(ident.model);
  const nameT = tokenize(ident.productName);

  const brandInTitle = containsAll(title, brandT);
  const brandInAny = containsAll(all, brandT);
  const modelHit = containsAll(all, modelT);

  if (brandInTitle) { score += 0.3; signals++; reasons.push('Brand match'); }
  else if (brandInAny) { score += 0.15; signals++; reasons.push('Brand mentioned'); }

  if (modelHit) { score += 0.25; signals++; reasons.push('Model match'); }

  const nameCov = nameT.length ? nameT.filter((t) => title.has(t)).length / nameT.length : 0;
  const nameCovAny = nameT.length ? nameT.filter((t) => all.has(t)).length / nameT.length : 0;
  const nameScore = Math.max(nameCov, nameCovAny * 0.6);
  if (nameScore > 0) { score += nameScore * 0.35; signals++; reasons.push('Similar name'); }

  const kws = (ident.keywords || []).map(tokenize).filter((k) => k.length);
  if (kws.length) {
    const hits = kws.filter((k) => containsAll(all, k)).length;
    if (hits) { score += (hits / kws.length) * 0.2; signals++; reasons.push('Keyword match'); }
  }

  if (ident.category && listing.category === ident.category) { score += 0.1; reasons.push('Same category'); }
  const colorT = tokenize(ident.color);
  if (colorT.length && containsAll(all, colorT)) { score += 0.05; reasons.push('Same colour'); }

  score = Math.min(1, score);

  const exact =
    (brandT.length > 0 && brandInTitle && (modelT.length ? modelHit : nameCov >= 0.6)) ||
    (nameT.length >= 2 && nameCov >= 0.8) ||
    (modelT.length > 0 && modelHit && nameCov >= 0.5);

  return { score, exact, reasons, signals };
};

/**
 * Rank candidates. Category alone never qualifies a listing (prevents random results).
 * @returns {{exact: object[], similar: object[]}}
 */
export const rankListings = (listings, ident, { minScore = 0.25, maxSimilar = 8, maxExact = 6 } = {}) => {
  const scored = listings
    .map((l) => ({ listing: l, ...scoreListing(l, ident) }))
    .filter((r) => r.signals > 0 && r.score >= minScore)
    .sort((a, b) => b.score - a.score);

  const shape = (r) => ({
    ...r.listing,
    matchScore: Math.round(r.score * 100) / 100,
    matchReasons: r.reasons,
  });

  const exact = scored.filter((r) => r.exact).slice(0, maxExact).map(shape);
  const exactIds = new Set(exact.map((e) => String(e._id)));
  const similar = scored.filter((r) => !exactIds.has(String(r.listing._id))).slice(0, maxSimilar).map(shape);
  return { exact, similar };
};

export const validateIdentificationInput = (body) => {
  const ident = body?.identification;
  if (!ident || typeof ident !== 'object' || typeof ident.productName !== 'string' || !ident.productName.trim()) {
    const e = new Error('A valid product identification is required.');
    e.statusCode = 400;
    throw e;
  }
  const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  return {
    productName: str(ident.productName, 120),
    category: str(ident.category, 40),
    brand: str(ident.brand, 60),
    model: str(ident.model, 60),
    color: str(ident.color, 40),
    description: str(ident.description, 400),
    keywords: Array.isArray(ident.keywords) ? ident.keywords.map((k) => str(k, 40)).filter(Boolean).slice(0, 8) : [],
  };
};
