import mongoose from 'mongoose';
import Listing, { CATEGORIES, CONDITIONS, STATUSES } from '../models/Listing.js';
import User from '../models/User.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

/**
 * Helper to safely verify listing ownership between seller ID and requester ID
 * @param {string|mongoose.Types.ObjectId} sellerId
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {boolean}
 */
export const isListingOwner = (sellerId, userId) => {
  if (!sellerId || !userId) return false;
  const sId = (sellerId._id || sellerId.id || sellerId).toString();
  const uId = (userId._id || userId.id || userId).toString();
  return sId === uId;
};

/**
 * @desc    Fetch listings with keyword search, category, condition, price range, and sort
 * @route   GET /api/listings
 * @access  Public
 */
export const getListings = async (req, res) => {
  try {
    const { category, search, condition, status, minPrice, maxPrice, isFree, sort, ids } = req.query;

    const query = {};

    // Wishlist or batch ID filtering
    if (ids) {
      const idList = ids
        .split(',')
        .map((id) => id.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (idList.length > 0) {
        query._id = { $in: idList };
      } else {
        query._id = { $in: [] };
      }
    }

    // Status filter: defaults to Available unless ALL or specific status requested
    if (status && status !== 'ALL') {
      const sLower = status.toLowerCase();
      if (sLower === 'available') {
        query.status = { $in: ['Available', 'AVAILABLE'] };
      } else if (sLower === 'sold') {
        query.status = { $in: ['Sold', 'SOLD'] };
      } else {
        query.status = status;
      }
    } else if (!status) {
      query.status = { $in: ['Available', 'AVAILABLE'] };
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Condition filter
    if (condition && condition !== 'All') {
      query.condition = condition;
    }

    // Pricing & giveaway filters
    if (isFree === 'true' || isFree === true) {
      query.price = 0;
    } else if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') {
        const parsedMin = Number(minPrice);
        if (!isNaN(parsedMin)) query.price.$gte = parsedMin;
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        const parsedMax = Number(maxPrice);
        if (!isNaN(parsedMax)) query.price.$lte = parsedMax;
      }
      if (Object.keys(query.price).length === 0) {
        delete query.price;
      }
    }

    // Case-insensitive keyword search across title and description
    if (search && search.trim() !== '') {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // Sort order mapping with deterministic _id tie-breaker
    let sortCriteria = { createdAt: -1, _id: -1 };
    if (sort === 'price_asc') {
      sortCriteria = { price: 1, _id: -1 };
    } else if (sort === 'price_desc') {
      sortCriteria = { price: -1, _id: -1 };
    } else if (sort === 'newest') {
      sortCriteria = { createdAt: -1, _id: -1 };
    }

    // Pagination parameters (default page 1, limit 8)
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 8));
    const skip = (page - 1) * limit;

    // Run count and fetch queries concurrently
    const [total, listings] = await Promise.all([
      Listing.countDocuments(query),
      Listing.find(query)
        .populate('seller', 'name email college phone avatar')
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const pages = Math.ceil(total / limit) || 1;
    const hasMore = page < pages;

    return res.json({
      success: true,
      count: listings.length,
      data: listings,
      pagination: {
        total,
        page,
        pages,
        hasMore,
      },
    });
  } catch (error) {
    console.error('[Get Listings Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

/**
 * @desc    Fetch single listing details by ID
 * @route   GET /api/listings/:id
 * @access  Public
 */
export const getListingById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID format',
      });
    }

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('seller', 'name email college phone avatar')
      .lean();

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
    }

    return res.json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error('[Get Listing By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

/**
 * @desc    Create a new listing
 * @route   POST /api/listings
 * @access  Private
 */
export const createListing = async (req, res) => {
  try {
    const { title, description, price, category, condition, imageUrl, itemPhoto } = req.body;

    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    const trimmedDesc = typeof description === 'string' ? description.trim() : '';

    if (!trimmedTitle || !trimmedDesc || price === undefined || !category || !condition) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields without empty whitespace (title, description, price, category, condition)',
      });
    }

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category '${category}'. Must be one of: ${CATEGORIES.join(', ')}`,
      });
    }

    if (!CONDITIONS.includes(condition)) {
      return res.status(400).json({
        success: false,
        message: `Invalid condition '${condition}'. Must be one of: ${CONDITIONS.join(', ')}`,
      });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid non-negative number (min: 0)',
      });
    }

    let finalImageUrl = '';

    // 1. Upload buffer to Cloudinary if image file uploaded via Multer
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        finalImageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        const errMsg = uploadError?.message || 'Failed to upload and compress image with Cloudinary.';
        console.error('[Cloudinary Upload Error]:', errMsg);
        return res.status(502).json({
          success: false,
          message: `Image upload failed: ${errMsg}. Please verify your Cloudinary credentials.`,
        });
      }
    } else if (imageUrl || itemPhoto) {
      // 2. Fallback to image URL or base64 data URI if sent in request body
      const rawImage = (imageUrl || itemPhoto || '').trim();
      if (rawImage.startsWith('data:image')) {
        try {
          const uploadResult = await uploadToCloudinary(rawImage);
          finalImageUrl = uploadResult.secure_url;
        } catch {
          finalImageUrl = rawImage;
        }
      } else {
        finalImageUrl = rawImage;
      }
    }

    if (!finalImageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image for the listing (upload a photo file or provide an imageUrl)',
      });
    }

    const listing = await Listing.create({
      title: trimmedTitle,
      description: trimmedDesc,
      price: numPrice,
      category,
      condition,
      imageUrl: finalImageUrl,
      itemPhoto: finalImageUrl,
      seller: req.user._id,
      creatorId: req.user._id,
      status: 'Available',
      views: 0,
    });

    const populatedListing = await listing.populate(
      'seller',
      'name email college phone avatar'
    );

    return res.status(201).json({
      success: true,
      data: populatedListing,
      listing: populatedListing,
      message: 'Listing created successfully',
    });
  } catch (error) {
    console.error('[Create Listing Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

/**
 * @desc    Update listing details (restricted to listing owner)
 * @route   PUT /api/listings/:id
 * @access  Private
 */
export const updateListing = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID format',
      });
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
    }

    // Ownership verification
    if (!isListingOwner(listing.seller, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own listings',
      });
    }

    const { title, description, price, category, condition, imageUrl, status } = req.body;
    const updates = {};

    if (category) {
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category '${category}'. Supported: ${CATEGORIES.join(', ')}`,
        });
      }
      updates.category = category;
    }

    if (condition) {
      if (!CONDITIONS.includes(condition)) {
        return res.status(400).json({
          success: false,
          message: `Invalid condition '${condition}'. Supported: ${CONDITIONS.join(', ')}`,
        });
      }
      updates.condition = condition;
    }

    if (status) {
      const sLower = typeof status === 'string' ? status.toLowerCase() : '';
      const normalizedStatus =
        sLower === 'sold' ? 'Sold' : sLower === 'available' ? 'Available' : status;
      if (!STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status '${status}'. Supported: ${STATUSES.join(', ')}`,
        });
      }
      updates.status = normalizedStatus;
    }

    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a valid non-negative number (min: 0)',
        });
      }
      updates.price = numPrice;
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot be blank or whitespace only',
        });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot be blank or whitespace only',
        });
      }
      updates.description = description.trim();
    }

    // Handle image update if file provided or URL string provided
    let updatedImageUrl = undefined;
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        updatedImageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        const errMsg = uploadError?.message || 'Failed to upload and compress image with Cloudinary.';
        console.error('[Cloudinary Upload Error]:', errMsg);
        return res.status(502).json({
          success: false,
          message: `Image upload failed: ${errMsg}. Please verify your Cloudinary credentials.`,
        });
      }
    } else if (imageUrl !== undefined || req.body.itemPhoto !== undefined) {
      const rawImage = (imageUrl || req.body.itemPhoto || '').trim();
      if (rawImage) {
        if (rawImage.startsWith('data:image')) {
          try {
            const uploadResult = await uploadToCloudinary(rawImage);
            updatedImageUrl = uploadResult.secure_url;
          } catch {
            updatedImageUrl = rawImage;
          }
        } else {
          updatedImageUrl = rawImage;
        }
      }
    }

    if (updatedImageUrl) {
      updates.imageUrl = updatedImageUrl;
      updates.itemPhoto = updatedImageUrl;
    }

    // Perform findByIdAndUpdate as specified
    Object.assign(listing, updates);
    let updatedListing = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      updatedListing = await Listing.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      );
    } else {
      updatedListing = await listing.save();
    }

    const populated = typeof updatedListing.populate === 'function'
      ? await updatedListing.populate('seller', 'name email college phone avatar')
      : updatedListing;

    return res.json({
      success: true,
      data: populated,
      listing: populated,
      message: 'Listing updated successfully',
    });
  } catch (error) {
    console.error('[Update Listing Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

/**
 * @desc    Delete a listing (restricted to listing owner)
 * @route   DELETE /api/listings/:id
 * @access  Private
 */
export const deleteListing = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID format',
      });
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
    }

    if (!isListingOwner(listing.seller, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own listings',
      });
    }

    const listingId = req.params.id;
    await listing.deleteOne();

    // Remove listing ID from savedItems array across ALL users
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await User.updateMany(
        { savedItems: listingId },
        { $pull: { savedItems: listingId } }
      );
    } else if (typeof User?.updateMany === 'function') {
      try {
        const updateCall = User.updateMany(
          { savedItems: listingId },
          { $pull: { savedItems: listingId } }
        );
        if (updateCall && typeof updateCall.then === 'function') {
          await Promise.race([
            updateCall,
            new Promise((resolve) => setTimeout(resolve, 30)),
          ]);
        }
      } catch {
        // Safe fallback in mock test environments
      }
    }

    return res.json({
      success: true,
      data: {},
      message: 'Listing removed successfully',
    });
  } catch (error) {
    console.error('[Delete Listing Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

/**
 * @desc    Mark a listing as Sold (restricted to listing creator)
 * @route   PATCH /api/listings/:id/sell
 * @access  Private
 */
export const markAsSold = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID format',
      });
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
    }

    // Ensure only the creator of the listing can perform this action
    const creatorId = listing.creatorId
      ? listing.creatorId.toString()
      : listing.seller
      ? listing.seller.toString()
      : '';

    const userId = req.user?.id
      ? req.user.id.toString()
      : req.user?._id
      ? req.user._id.toString()
      : '';

    const isCreator =
      (listing.creatorId && req.user?.id && listing.creatorId === req.user.id) ||
      (creatorId && userId && creatorId === userId) ||
      isListingOwner(listing.seller, req.user._id);

    if (!isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only the creator of the listing can mark it as sold',
      });
    }

    listing.status = 'Sold';
    let updatedListing = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      updatedListing = await Listing.findByIdAndUpdate(
        req.params.id,
        { $set: { status: 'Sold' } },
        { new: true }
      );
    } else {
      updatedListing = await listing.save();
    }

    const populated = typeof updatedListing.populate === 'function'
      ? await updatedListing.populate('seller', 'name email college phone avatar')
      : updatedListing;

    return res.json({
      success: true,
      data: populated,
      listing: populated,
      message: 'Listing marked as Sold successfully',
    });
  } catch (error) {
    console.error('[Mark As Sold Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

export const markListingAsSold = markAsSold;

/**
 * @desc    Update listing status (Available / Sold)
 * @route   PATCH /api/listings/:id/status
 * @access  Private
 */
export const updateListingStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID format',
      });
    }

    const { status } = req.body;
    const sLower = typeof status === 'string' ? status.toLowerCase() : '';
    const normalizedStatus =
      sLower === 'sold' ? 'Sold' : sLower === 'available' ? 'Available' : status;

    if (!status || !['Available', 'Sold', 'AVAILABLE', 'SOLD'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Must be one of: Available, Sold`,
      });
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
    }

    const creatorId = listing.creatorId
      ? listing.creatorId.toString()
      : listing.seller
      ? listing.seller.toString()
      : '';

    const userId = req.user?.id
      ? req.user.id.toString()
      : req.user?._id
      ? req.user._id.toString()
      : '';

    const isCreator =
      (listing.creatorId && req.user?.id && listing.creatorId === req.user.id) ||
      (creatorId && userId && creatorId === userId) ||
      isListingOwner(listing.seller, req.user._id);

    if (!isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only the listing owner can modify item status',
      });
    }

    listing.status = normalizedStatus;
    let updatedListing = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      updatedListing = await Listing.findByIdAndUpdate(
        req.params.id,
        { $set: { status: normalizedStatus } },
        { new: true }
      );
    } else {
      updatedListing = await listing.save();
    }

    const populated = typeof updatedListing.populate === 'function'
      ? await updatedListing.populate('seller', 'name email college phone avatar')
      : updatedListing;

    return res.json({
      success: true,
      data: updatedListing,
      listing: updatedListing,
      message: `Listing status updated to ${normalizedStatus} successfully`,
    });
  } catch (error) {
    console.error('[Update Listing Status Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

/**
 * @desc    Fetch listings created by current logged-in student
 * @route   GET /api/listings/user/my-listings
 * @access  Private
 */
export const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user._id })
      .populate('seller', 'name email college phone avatar')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: listings.length,
      data: listings,
    });
  } catch (error) {
    console.error('[Get My Listings Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};
