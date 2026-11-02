import User from '../models/User.js';
import Listing from '../models/Listing.js';

/**
 * @desc    Get current user profile with listings count
 * @route   GET /api/users/me
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    const listingsCount = await Listing.countDocuments({ seller: req.user._id });

    return res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        phone: user.phone,
        avatar: user.avatar,
        savedItems: user.savedItems || [],
        listingsCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Get User Profile Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/me
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { name, college, phone, avatar } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot be empty or whitespace only',
        });
      }
      user.name = name.trim();
    }

    if (college !== undefined) {
      if (typeof college !== 'string' || !college.trim()) {
        return res.status(400).json({
          success: false,
          message: 'College cannot be empty',
        });
      }
      user.college = college.trim();
    }

    if (phone !== undefined) {
      const trimmedPhone = typeof phone === 'string' ? phone.trim() : String(phone).trim();
      if (trimmedPhone && !/^(?:(?:\+|0{0,2})91[\s-]?)?[6789]\d{9}$/.test(trimmedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone format. Please provide a valid 10-digit Indian mobile number.',
        });
      }
      user.phone = trimmedPhone;
    }

    if (avatar !== undefined) {
      user.avatar = typeof avatar === 'string' ? avatar.trim() : '';
    }

    const updatedUser = await user.save();

    return res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        college: updatedUser.college,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        savedItems: updatedUser.savedItems || [],
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('[Update User Profile Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

/**
 * @desc    Get user's saved items (wishlist) with ghost-item auto-cleanup
 * @route   GET /api/users/saved or GET /api/users/wishlist
 * @access  Private
 */
export const getSavedItems = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedItems',
      populate: { path: 'seller', select: 'name email college phone avatar' },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    const originalSavedItems = Array.isArray(user.savedItems) ? user.savedItems : [];

    // Filter resulting array to remove any null / deleted listing references
    const validItems = originalSavedItems.filter(
      (item) => item !== null && item !== undefined && item._id
    );

    // Auto-Cleanup: If valid items count is less than original, prune dead IDs and save
    if (validItems.length < originalSavedItems.length) {
      user.savedItems = validItems.map((item) => item._id);
      await user.save();
    }

    return res.json({
      success: true,
      count: validItems.length,
      data: validItems,
      savedItems: validItems,
    });
  } catch (error) {
    console.error('[Get Saved Items Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

export const getWishlist = getSavedItems;

/**
 * @desc    Toggle saving an item in user's saved items (wishlist)
 * @route   POST /api/users/saved/:id or POST /api/users/wishlist/:id
 * @access  Private
 */
export const toggleSaveItem = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!Array.isArray(user.savedItems)) {
      user.savedItems = [];
    }

    const idString = id.toString();
    const existingIndex = user.savedItems.findIndex((savedId) => {
      if (!savedId) return false;
      const savedIdStr = savedId._id ? savedId._id.toString() : savedId.toString();
      return savedIdStr === idString;
    });

    let isSaved = false;
    if (existingIndex > -1) {
      user.savedItems.splice(existingIndex, 1);
      isSaved = false;
    } else {
      user.savedItems.push(id);
      isSaved = true;
    }

    await user.save();

    return res.json({
      success: true,
      isSaved,
      savedItems: user.savedItems,
      message: isSaved ? 'Item added to saved items' : 'Item removed from saved items',
    });
  } catch (error) {
    console.error('[Toggle Save Item Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

export const toggleWishlist = toggleSaveItem;
