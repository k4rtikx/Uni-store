import mongoose from 'mongoose';

export const CATEGORIES = [
  'Books',
  'Lab Equipment',
  'Electronics',
  'Stationery',
  'Clothing',
  'Bags & Accessories',
  'Furniture',
  'Other',
];

export const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

export const STATUSES = ['Available', 'Sold'];

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a listing title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide an item description'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please specify the price (set 0 for free/donation)'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      trim: true,
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a supported category',
      },
    },
    condition: {
      type: String,
      required: [true, 'Please specify the item condition'],
      enum: {
        values: CONDITIONS,
        message: '{VALUE} is not a valid condition (Choose: New, Like New, Good, Fair)',
      },
    },
    imageUrl: {
      type: String,
      required: [true, 'Please provide an image URL for the listing'],
      trim: true,
      maxlength: [800000, 'Image payload is too large. Please upload a standard compressed image.'],
    },
    itemPhoto: {
      type: String,
      trim: true,
      default: '',
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Listing must be associated with a seller'],
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: function () {
        return this.seller;
      },
    },
    views: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Available', 'Sold'],
      default: 'Available',
      set: (val) => {
        if (!val) return 'Available';
        if (typeof val === 'string') {
          const lower = val.toLowerCase();
          if (lower === 'available') return 'Available';
          if (lower === 'sold') return 'Sold';
        }
        return val;
      },
    },
  },
  {
    timestamps: true,
  }
);

listingSchema.pre('save', function () {
  if (!this.creatorId && this.seller) {
    this.creatorId = this.seller;
  }
});

/**
 * ADR-002: High-speed compound indexes for feed filtering and seller dashboard queries
 * Paired with .lean() in listingController.js to ensure sub-millisecond execution
 */
listingSchema.index({ status: 1, category: 1, createdAt: -1 });
listingSchema.index({ seller: 1, createdAt: -1 });
listingSchema.index({ title: 'text', description: 'text' });

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;
