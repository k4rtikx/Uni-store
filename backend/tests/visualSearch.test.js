/**
 * Visual Search tests (node:test, no network, Gemini/SerpAPI mocked via injected/global fetch).
 * Run: npm test   (or: node --test tests/visualSearch.test.js)
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_token_key_for_unit_tests_32chars';
process.env.GEMINI_API_KEY = 'test-key';
process.env.BACKGROUND_REMOVAL_PROVIDER = 'none';
delete process.env.SERPAPI_KEY;

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const { sniffImageType, validateImageBuffer, normalizeBox, cropToBox, compressForAnalysis } = await import('../utils/visualSearch/imageProcessing.js');
const { parseIdentification, identifyProduct } = await import('../utils/visualSearch/gemini.js');
const { rankListings, scoreListing, validateIdentificationInput } = await import('../utils/visualSearch/productMatcher.js');
const { buildMarketplaceLinks, buildSearchQuery, isAllowedMarketplaceUrl, mapSerpAmazon, mapSerpFlipkart, searchExternal } = await import('../utils/visualSearch/externalSearch.js');
const { removeBackground } = await import('../utils/visualSearch/backgroundRemoval.js');
const { identify, searchStore, searchExternalMarketplaces, findCandidateListings } = await import('../controllers/visualSearchController.js');

let sharp;
try { sharp = (await import('sharp')).default; } catch { /* sharp-dependent tests skip */ }
const makeJpeg = () => sharp({ create: { width: 400, height: 300, channels: 3, background: '#cc3333' } }).jpeg().toBuffer();

const geminiOk = (obj) => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }) });
const NIKE = {
  isProduct: true, productName: 'Nike Air Max running shoe', category: 'Clothing', brand: 'Nike', model: 'Air Max',
  color: 'red', description: 'A red Nike running shoe.', keywords: ['nike air max', 'running shoes', 'sneakers'],
  confidence: 0.93, boundingBox: { ymin: 100, xmin: 150, ymax: 900, xmax: 850 },
};
const ident = { productName: 'Nike Air Max running shoe', category: 'Clothing', brand: 'Nike', model: 'Air Max', color: 'red', keywords: NIKE.keywords };

const L = (o) => ({ _id: o._id, description: '', category: 'Clothing', status: 'Available', price: 1000, ...o });

describe('image validation', () => {
  it('sniffs real types and rejects spoofed files', () => {
    assert.equal(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])), 'image/jpeg');
    assert.equal(sniffImageType(Buffer.from('<?php echo 1; ?>   ')), null);
    assert.throws(() => validateImageBuffer(Buffer.from('not an image at all')), (e) => e.statusCode === 415);
    assert.throws(() => validateImageBuffer(Buffer.alloc(0)), (e) => e.statusCode === 400);
    assert.throws(() => validateImageBuffer(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(9 * 1024 * 1024)])), (e) => e.statusCode === 413);
  });
  it('normalizes bounding boxes safely', () => {
    assert.equal(normalizeBox(null), null);
    assert.equal(normalizeBox({ ymin: 500, xmin: 500, ymax: 400, xmax: 600 }), null);
    const b = normalizeBox({ ymin: 100, xmin: 100, ymax: 900, xmax: 900 });
    assert.ok(b.ymin < 0.1 && b.ymax > 0.9 && b.ymax <= 1);
  });
  it('compresses and crops with sharp', { skip: !sharp }, async () => {
    const big = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#0a0' } }).png().toBuffer();
    const small = await compressForAnalysis(big);
    const meta = await sharp(small).metadata();
    assert.ok(meta.width <= 1280 && meta.format === 'jpeg');
    const { buffer, cropped } = await cropToBox(small, { ymin: 200, xmin: 200, ymax: 800, xmax: 800 });
    assert.equal(cropped, true);
    assert.ok((await sharp(buffer).metadata()).width < meta.width);
    await assert.rejects(compressForAnalysis(Buffer.from('garbage-garbage-garbage')), (e) => e.statusCode === 422);
  });
});

describe('Gemini identification', () => {
  it('parses & sanitizes model output', () => {
    const p = parseIdentification('```json\n' + JSON.stringify({ ...NIKE, category: 'Weird', keywords: ['A', 'a', ' b '] }) + '\n```');
    assert.equal(p.category, 'Other');
    assert.deepEqual(p.keywords, ['a', 'b']);
    assert.throws(() => parseIdentification('nope'), (e) => e.code === 'GEMINI_BAD_RESPONSE');
  });
  it('calls Gemini server-side with key header and returns structure', async () => {
    let seen;
    const r = await identifyProduct(Buffer.from('x'), { fetchImpl: async (url, init) => { seen = { url, init }; return geminiOk(NIKE); } });
    assert.equal(r.brand, 'Nike');
    assert.equal(seen.init.headers['x-goog-api-key'], 'test-key');
    assert.ok(!seen.url.includes('test-key'));
  });
  it('maps rate limits, falls back on missing model, surfaces timeouts', async () => {
    await assert.rejects(identifyProduct(Buffer.from('x'), { fetchImpl: async () => ({ ok: false, status: 429 }) }), (e) => e.statusCode === 429);
    const calls = [];
    const r = await identifyProduct(Buffer.from('x'), {
      fetchImpl: async (url) => { calls.push(url); return calls.length === 1 ? { ok: false, status: 404 } : geminiOk(NIKE); },
    });
    assert.equal(calls.length, 2);
    assert.ok(r.modelUsed);
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    await assert.rejects(identifyProduct(Buffer.from('x'), { fetchImpl: async () => { throw abort; } }), (e) => e.statusCode === 504);
  });
  it('fails clearly without an API key', async () => {
    const k = process.env.GEMINI_API_KEY; process.env.GEMINI_API_KEY = '';
    await assert.rejects(identifyProduct(Buffer.from('x')), (e) => e.code === 'GEMINI_NOT_CONFIGURED');
    process.env.GEMINI_API_KEY = k;
  });
});

describe('product matching', () => {
  const listings = [
    L({ _id: '1', title: 'Nike Air Max running shoes size 9', description: 'Worn twice' }),
    L({ _id: '2', title: 'Nike sports shoes', description: 'Lightly used running shoes' }),
    L({ _id: '3', title: 'Adidas Ultraboost running shoes' }),
    L({ _id: '4', title: 'Cotton T-shirt', description: 'Plain tee' }),
    L({ _id: '5', title: 'Engineering Mathematics textbook', category: 'Books' }),
  ];
  it('puts exact matches first and similar after; excludes category-only noise', () => {
    const { exact, similar } = rankListings(listings, ident);
    assert.deepEqual(exact.map((l) => l._id), ['1']);
    assert.ok(similar.map((l) => l._id).includes('2'));
    const all = [...exact, ...similar].map((l) => l._id);
    assert.ok(!all.includes('4') && !all.includes('5'), 'unrelated items must not appear');
  });
  it('returns nothing for unrelated products (triggers external fallback)', () => {
    const r = rankListings(listings, { productName: 'Casio FX-991EX calculator', category: 'Electronics', brand: 'Casio', model: 'FX-991EX', keywords: ['scientific calculator'] });
    assert.equal(r.exact.length + r.similar.length, 0);
  });
  it('scores brand+model higher than brand alone', () => {
    assert.ok(scoreListing(listings[0], ident).score > scoreListing(listings[1], ident).score);
  });
  it('validates identification input', () => {
    assert.throws(() => validateIdentificationInput({}), (e) => e.statusCode === 400);
    assert.equal(validateIdentificationInput({ identification: { productName: ' Shoe ', keywords: ['a', 5] } }).productName, 'Shoe');
  });
});

describe('external marketplaces', () => {
  it('builds clearly-typed marketplace search links', () => {
    const links = buildMarketplaceLinks(ident);
    assert.equal(links[0].type, 'search_link');
    assert.ok(links[0].url.startsWith('https://www.amazon.in/s?k=Nike%20Air%20Max'));
    assert.ok(links[1].url.startsWith('https://www.flipkart.com/search?q=Nike%20Air%20Max'));
    assert.equal(buildSearchQuery({ productName: 'Steel water bottle', keywords: [] }), 'Steel water bottle');
  });
  it('only allows verified marketplace hosts over https', () => {
    assert.ok(isAllowedMarketplaceUrl('https://www.amazon.in/dp/B0', 'amazon'));
    assert.ok(!isAllowedMarketplaceUrl('https://amazon.in.evil.com/dp/B0', 'amazon'));
    assert.ok(!isAllowedMarketplaceUrl('http://www.flipkart.com/x', 'flipkart'));
    assert.ok(!isAllowedMarketplaceUrl('javascript:alert(1)', 'amazon'));
  });
  it('drops unverifiable provider items and never invents data', () => {
    const items = mapSerpAmazon({ organic_results: [{ title: 'A', link: 'https://www.amazon.in/dp/1', price: '₹999' }, { title: 'B', link: 'https://evil.com/x' }, { link: 'https://www.amazon.in/dp/2' }] });
    assert.equal(items.length, 1);
    assert.equal(items[0].price, '₹999');
    const fk = mapSerpFlipkart({ shopping_results: [{ title: 'F', source: 'Flipkart', link: 'https://www.flipkart.com/p/1' }, { title: 'G', source: 'Croma', link: 'https://croma.com/x' }] });
    assert.equal(fk.length, 1);
  });
  it('without SERPAPI_KEY returns links only, with an honest notice', async () => {
    const r = await searchExternal(ident);
    assert.equal(r.liveResults, false);
    assert.equal(r.items.length, 0);
    assert.match(r.notice, /search links/);
  });
  it('with SERPAPI_KEY returns live items and tolerates provider failure', async () => {
    process.env.SERPAPI_KEY = 'k';
    const ok = await searchExternal(ident, { fetchImpl: async (u) => ({ ok: true, json: async () => (u.includes('engine=amazon') ? { organic_results: [{ title: 'Nike', link: 'https://www.amazon.in/dp/9', price: '₹5,000' }] } : {}) }) });
    assert.equal(ok.liveResults, true);
    const fail = await searchExternal(ident, { fetchImpl: async () => { throw new Error('down'); } });
    assert.equal(fail.liveResults, false);
    assert.equal(fail.links.length, 2);
    delete process.env.SERPAPI_KEY;
  });
});

describe('background removal fallback', () => {
  it('never throws and reports when removal is skipped', async () => {
    const r = await removeBackground(Buffer.from('abc'));
    assert.equal(r.removed, false);
    process.env.BACKGROUND_REMOVAL_PROVIDER = 'removebg'; // no key
    assert.equal((await removeBackground(Buffer.from('abc'))).removed, false);
    const viaApi = await (async () => { process.env.REMOVE_BG_API_KEY = 'k'; return removeBackground(Buffer.from('abc'), { fetchImpl: async () => ({ ok: true, arrayBuffer: async () => Buffer.from('png').buffer }) }); })();
    assert.equal(viaApi.removed, true);
    process.env.BACKGROUND_REMOVAL_PROVIDER = 'none'; delete process.env.REMOVE_BG_API_KEY;
  });
});

const mockRes = () => { const r = { code: 200, body: null, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } }; return r; };

describe('controllers (end-to-end with mocked Gemini + fake Listing model)', () => {
  it('identify: photo -> identification + isolated preview', { skip: !sharp }, async () => {
    const real = globalThis.fetch;
    globalThis.fetch = async () => geminiOk(NIKE);
    try {
      const res = mockRes();
      await identify({ file: { buffer: await makeJpeg() } }, res);
      assert.equal(res.body.data.identification.brand, 'Nike');
      assert.match(res.body.data.isolatedImage, /^data:image\/png;base64,/);
      assert.equal(res.body.data.processing.cropped, true);
      assert.equal(res.body.data.processing.backgroundRemoved, false);
      assert.equal(res.body.data.identification.boundingBox, undefined);
    } finally { globalThis.fetch = real; }
  });
  it('identify: non-product photo returns friendly message; bad file is rejected', { skip: !sharp }, async () => {
    const real = globalThis.fetch;
    globalThis.fetch = async () => geminiOk({ ...NIKE, isProduct: false });
    try {
      const res = mockRes();
      await identify({ file: { buffer: await makeJpeg() } }, res);
      assert.equal(res.body.data.isProduct, false);
    } finally { globalThis.fetch = real; }
    await assert.rejects(identify({ file: { buffer: Buffer.from('hello world, not image') } }, mockRes()), (e) => e.statusCode === 415);
    await assert.rejects(identify({}, mockRes()), (e) => e.statusCode === 400);
  });
  it('findCandidateListings queries only Available listings via the existing model', async () => {
    let q;
    const chain = { populate() { return chain; }, sort() { return chain; }, limit() { return chain; }, lean: async () => [] };
    await findCandidateListings(ident, { ListingModel: { find: (query) => { q = query; return chain; } } });
    assert.deepEqual(q.status.$in, ['Available', 'AVAILABLE']);
    assert.ok(q.$or.length > 0);
  });
  it('external endpoint returns the required unavailable message', async () => {
    const res = mockRes();
    await searchExternalMarketplaces({ body: { identification: ident } }, res);
    assert.match(res.body.data.message, /currently unavailable in Uni-Store/);
    assert.equal(res.body.data.links.length, 2);
  });
  it('search endpoint rejects bad input', async () => {
    await assert.rejects(searchStore({ body: {} }, mockRes()), (e) => e.statusCode === 400);
  });
});
