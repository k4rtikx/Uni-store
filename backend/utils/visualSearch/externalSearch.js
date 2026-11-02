import { getVisualSearchConfig } from '../../config/visualSearch.js';

/**
 * External marketplace alternatives (Amazon.in / Flipkart).
 *
 * Honest by design:
 *  - Amazon's PA-API 5 is retired (replaced by the gated Creators API) and Flipkart's affiliate
 *    API needs partner approval, so there is no key-free official product-search API.
 *  - We ALWAYS return clearly-labelled marketplace *search links* (never invented listings).
 *  - If SERPAPI_KEY is configured, we additionally return live items from SerpAPI, passing
 *    through only what the API returned, and only when the URL host is amazon.in / flipkart.com.
 */
const HOSTS = { amazon: ['amazon.in'], flipkart: ['flipkart.com'] };

export const isAllowedMarketplaceUrl = (url, marketplace) => {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    return HOSTS[marketplace].some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
};

export const buildSearchQuery = (ident) => {
  const parts = [];
  const add = (s) => {
    const v = (s || '').trim();
    if (v && !parts.join(' ').toLowerCase().includes(v.toLowerCase())) parts.push(v);
  };
  add(ident.brand);
  add(ident.model || ident.productName);
  if (!ident.model && ident.color && parts.length < 3) add(ident.color);
  return parts.join(' ').trim() || (ident.keywords || [])[0] || ident.productName;
};

export const buildMarketplaceLinks = (ident) => {
  const q = encodeURIComponent(buildSearchQuery(ident));
  return [
    { marketplace: 'amazon', label: 'Search on Amazon.in', url: `https://www.amazon.in/s?k=${q}`, type: 'search_link' },
    { marketplace: 'flipkart', label: 'Search on Flipkart', url: `https://www.flipkart.com/search?q=${q}`, type: 'search_link' },
  ];
};

const safeImg = (u) => (typeof u === 'string' && u.startsWith('https://') ? u : '');
const fetchJson = async (url, fetchImpl, timeoutMs = 8000) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
};

/** Maps SerpAPI payloads to our item shape; drops anything failing validation. */
export const mapSerpAmazon = (json, max = 6) =>
  (json?.organic_results || [])
    .map((r) => ({
      marketplace: 'amazon',
      title: String(r.title || '').slice(0, 200),
      url: r.link_clean || r.link,
      image: safeImg(r.thumbnail),
      price: r.price ? String(r.price) : null,
      source: 'SerpAPI (Amazon.in)',
    }))
    .filter((r) => r.title && isAllowedMarketplaceUrl(r.url, 'amazon'))
    .slice(0, max);

export const mapSerpFlipkart = (json, max = 6) =>
  (json?.shopping_results || [])
    .filter((r) => /flipkart/i.test(r.source || ''))
    .map((r) => ({
      marketplace: 'flipkart',
      title: String(r.title || '').slice(0, 200),
      url: r.link || r.product_link,
      image: safeImg(r.thumbnail),
      price: r.price ? String(r.price) : null,
      source: 'SerpAPI (Google Shopping)',
    }))
    .filter((r) => r.title && isAllowedMarketplaceUrl(r.url, 'flipkart'))
    .slice(0, max);

export const searchExternal = async (ident, { fetchImpl = globalThis.fetch } = {}) => {
  const cfg = getVisualSearchConfig();
  const query = buildSearchQuery(ident);
  const result = { query, links: buildMarketplaceLinks(ident), items: [], liveResults: false, notice: '' };

  if (!cfg.serpApiKey) {
    result.notice = 'Live marketplace listings are not enabled. Use the search links to see current prices on each site.';
    return result;
  }

  const key = encodeURIComponent(cfg.serpApiKey);
  const q = encodeURIComponent(query);
  const [amz, fk] = await Promise.allSettled([
    fetchJson(`https://serpapi.com/search.json?engine=amazon&amazon_domain=amazon.in&k=${q}&api_key=${key}`, fetchImpl),
    fetchJson(`https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(`${query} flipkart`)}&gl=in&hl=en&api_key=${key}`, fetchImpl),
  ]);
  if (amz.status === 'fulfilled') result.items.push(...mapSerpAmazon(amz.value));
  if (fk.status === 'fulfilled') result.items.push(...mapSerpFlipkart(fk.value));
  result.liveResults = result.items.length > 0;
  if (!result.liveResults) {
    result.notice = 'Live listings could not be fetched right now. Use the search links to browse each marketplace.';
  }
  return result;
};
