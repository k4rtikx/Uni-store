import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getSavedItems,
  toggleSaveItem,
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// PRD Section 24.3: Profile endpoints
router.get('/me', protect, getUserProfile);
router.put('/me', protect, updateUserProfile);

// Saved Items / Wishlist endpoints with auto-cleanup of ghost items
router.get('/saved', protect, getSavedItems);
router.get('/wishlist', protect, getSavedItems);
router.post('/saved/:id', protect, toggleSaveItem);
router.post('/wishlist/:id', protect, toggleSaveItem);

export default router;
