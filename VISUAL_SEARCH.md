# AI Visual Search (Search by Photo)

Camera / upload → **Gemini** identifies the product → crop + **background removal** → search the existing
**Listing** collection → if nothing relevant, **Amazon.in / Flipkart** alternatives.

## Architecture (follows the existing MERN layout)

| Layer | File |
|---|---|
| Routes (`/api/visual-search/*`) | `backend/routes/visualSearchRoutes.js` (mounted in `server.js`) |
| Controller | `backend/controllers/visualSearchController.js` |
| Gemini vision (REST, key stays server-side) | `backend/utils/visualSearch/gemini.js` |
| Validation, compress, crop (sharp) | `backend/utils/visualSearch/imageProcessing.js` |
| Background removal (imgly local / remove.bg / none) | `backend/utils/visualSearch/backgroundRemoval.js` |
| Matching & ranking over `Listing` | `backend/utils/visualSearch/productMatcher.js` |
| Amazon / Flipkart | `backend/utils/visualSearch/externalSearch.js` |
| Rate limit | `visualSearchLimiter` in `backend/middlewares/rateLimiter.js` |
| UI | `frontend/src/components/visualSearch/*` (modal, camera hook, results) |
| Entry points | Navbar camera button (desktop + mobile) and Home hero "Search by Photo" |

No new database or model: candidates come from `Listing` (Available only) populated with the seller.

## Endpoints
- `POST /api/visual-search/identify` — multipart `image`. Returns identification + isolated PNG (data URL) + processing flags.
- `POST /api/visual-search/search` — `{ identification }` → `{ exact[], similar[], found }`.
- `POST /api/visual-search/external` — `{ identification }` → marketplace links (+ live items if `SERPAPI_KEY`).
- `GET  /api/visual-search/status` — whether the server is configured.

## Setup
```bash
cd backend && npm install            # installs sharp (+ optional @imgly/background-removal-node)
cp .env.example .env                 # add GEMINI_API_KEY (and your existing vars)
npm run dev
cd ../frontend && npm install && npm run dev
```
Camera access needs **HTTPS or localhost**. On phones over plain HTTP the "Upload" button still opens the native camera.

## Environment variables (backend only)
`GEMINI_API_KEY` (required), `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `BACKGROUND_REMOVAL_PROVIDER` (`imgly`|`removebg`|`none`),
`REMOVE_BG_API_KEY`, `SERPAPI_KEY`, `VISUAL_SEARCH_REQUIRE_AUTH`.

## Design notes
- Gemini returns identification **and a bounding box**; the app crops to it, then a real segmentation model removes the
  background. If the segmentation provider is missing/fails, the UI honestly shows "Cropped to product".
- Matching is hybrid lexical scoring (brand, model, name, keywords, category, colour); category alone never qualifies a result.
  Exact matches rank first. There is no vector DB / image-embedding index (not warranted for a campus-sized catalogue and it
  would need new infrastructure); this can be added later by storing embeddings on `Listing`.
- Amazon's PA-API 5 has been retired (replaced by the gated Creators API) and Flipkart's affiliate API needs approval, so the
  default is **labelled marketplace search links**. With `SERPAPI_KEY`, live items are shown only if their URL host is
  `amazon.in` / `flipkart.com`; nothing is ever invented.
- Images are processed in memory only (nothing written to disk, so nothing to clean up), EXIF/GPS is stripped on re-encode,
  file type is verified by magic bytes, and the endpoints are rate-limited.

## Tests
`cd backend && npm test` (adds `tests/visualSearch.test.js`, 22 tests with mocked Gemini/SerpAPI).
