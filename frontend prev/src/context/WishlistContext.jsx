import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WishlistContext } from './wishlistContextInstance';
import useAuth from './useAuth';
import { toggleSaveItemApi } from '../services/api';

const STORAGE_KEY = 'reusecampus_wishlist';

/**
 * Safely normalizes any item or ID (string, ObjectId, or object with _id) to string
 */
const normalizeId = (itemOrId) => {
  if (!itemOrId) return '';
  if (typeof itemOrId === 'object') {
    return String(itemOrId._id || itemOrId.id || '');
  }
  return String(itemOrId);
};

/**
 * Safely retrieve initial wishlist IDs from localStorage
 */
const getInitialWishlist = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeId).filter(Boolean) : [];
  } catch (err) {
    console.error('Failed to parse wishlist from localStorage:', err);
    return [];
  }
};

/**
 * Global Wishlist Provider managing saved item IDs across the application
 */
export const WishlistProvider = ({ children }) => {
  const [savedItems, setSavedItems] = useState(getInitialWishlist);
  const { user, updateSavedItems } = useAuth();

  // Sync state if localStorage changes in another tab
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        setSavedItems(getInitialWishlist());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const userSavedKey = Array.isArray(user?.savedItems)
    ? user.savedItems.map(normalizeId).filter(Boolean).sort().join(',')
    : '';

  // Synchronize when authenticated user's saved items are loaded or updated
  useEffect(() => {
    if (!userSavedKey) return;
    const userIds = userSavedKey.split(',').filter(Boolean);
    setSavedItems((prev) => {
      const prevNormalized = (Array.isArray(prev) ? prev : []).map(normalizeId).filter(Boolean);
      const isIdentical =
        prevNormalized.length === userIds.length &&
        prevNormalized.every((id) => userIds.includes(id));
      if (isIdentical) {
        return prev;
      }
      const merged = Array.from(new Set([...prevNormalized, ...userIds]));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // ignore
      }
      return merged;
    });
  }, [user?._id, userSavedKey]);

  /**
   * Toggle saving/removing a listing ID
   */
  const toggleSaveItem = useCallback(
    (id) => {
      if (!id) return;
      const stringId = normalizeId(id);
      if (!stringId) return;

      setSavedItems((prev) => {
        const prevNormalized = (Array.isArray(prev) ? prev : []).map(normalizeId).filter(Boolean);
        const exists = prevNormalized.includes(stringId);
        const updated = exists
          ? prevNormalized.filter((savedId) => savedId !== stringId)
          : [...prevNormalized, stringId];

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
          console.error('Failed to write wishlist to localStorage:', err);
        }

        // Synchronize with AuthContext so Navbar badge and user state update immediately
        if (typeof updateSavedItems === 'function') {
          updateSavedItems(updated);
        }

        return updated;
      });

      // If authenticated, persist to backend API in background
      if (localStorage.getItem('reusecampus_token')) {
        toggleSaveItemApi(stringId).catch((err) => {
          console.warn('[Wishlist] Failed to sync toggle with backend API:', err.message);
        });
      }
    },
    [updateSavedItems]
  );

  /**
   * Check if a listing ID is currently saved
   */
  const isSaved = useCallback(
    (id) => {
      if (!id) return false;
      const targetId = normalizeId(id);
      if (!targetId) return false;
      return savedItems.some((savedId) => normalizeId(savedId) === targetId);
    },
    [savedItems]
  );

  /**
   * Set or sync the entire wishlist IDs array (e.g. after removing dead/ghost references)
   */
  const syncSavedItems = useCallback(
    (itemsOrIds) => {
      const ids = Array.isArray(itemsOrIds)
        ? itemsOrIds.map(normalizeId).filter(Boolean)
        : [];

      setSavedItems(ids);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
      } catch (err) {
        console.error('Failed to write wishlist to localStorage:', err);
      }
      if (typeof updateSavedItems === 'function') {
        updateSavedItems(ids);
      }
    },
    [updateSavedItems]
  );

  const value = useMemo(
    () => ({
      savedItems,
      setSavedItems: syncSavedItems,
      syncSavedItems,
      cleanDeadIds: syncSavedItems,
      toggleSaveItem,
      isSaved,
      // Aliases for seamless backward compatibility
      savedIds: savedItems,
      toggleWishlist: toggleSaveItem,
      isWishlisted: isSaved,
      count: savedItems.length,
    }),
    [savedItems, syncSavedItems, toggleSaveItem, isSaved]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistProvider;
