import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { protect } from '../middlewares/authMiddleware.js';
import { uploadSingleImage } from '../middlewares/uploadMiddleware.js';
import { visualSearchLimiter } from '../middlewares/rateLimiter.js';
import { getVisualSearchConfig } from '../config/visualSearch.js';
import { identify, searchStore, searchExternalMarketplaces, status } from '../controllers/visualSearchController.js';

const router = express.Router();

// Optional login requirement (VISUAL_SEARCH_REQUIRE_AUTH=true) reuses the existing JWT guard.
const maybeProtect = (req, res, next) =>
  getVisualSearchConfig().requireAuth ? protect(req, res, next) : next();

router.get('/status', status);
router.use(visualSearchLimiter, maybeProtect);

router.post('/identify', uploadSingleImage('image'), asyncHandler(identify));
router.post('/search', asyncHandler(searchStore));
router.post('/external', asyncHandler(searchExternalMarketplaces));

export default router;
