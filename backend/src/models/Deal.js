import mongoose from 'mongoose';
import slugify from 'slugify';
import { ensureDealHasImage } from '../utils/defaultCategoryImages.js';

const dealSchema = new mongoose.Schema(
  {
    title: { type: String },
    brand: { type: String },
    tags: {
      type: [String],
      validate: {
        validator: function (arr) {
          if (!arr) return true;
          const allowed = ['Clearance', 'Manager Special', 'Overstock', 'Last-Chance', 'Weekend Drop', 'Daily Deal'];
          return arr.length <= 2 && arr.every(t => allowed.includes(t));
        },
        message: 'Tags must be from the allowed set (max 2): Clearance, Manager Special, Overstock, Last-Chance, Weekend Drop, Daily Deal',
      },
    },
    description: { type: String },
    originalPrice: { type: Number },
    salePrice: {
      type: Number,
      required: true,
    },
    images: [{ type: String }],
    dispensary: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispensary', required: true },
    deal_purchase_link: { type: String},
    category: {
      type: String,
      enum: ['flower', 'edibles', 'concentrates', 'vapes', 'topicals', 'other', 'pre-roll', 'tincture', 'beverage', 'capsule/pill'],
      lowercase: true
    },
    subcategory: {
      type: String,
      trim: true,
      // For Flower category, subcategories can be: 'ground-flower', 'baby-buds-popcorn', or custom
    },
    descriptiveKeywords: {
      type: [String],
      default: [],
      // Keywords like: 'relaxing', 'focused', 'uplifting', 'calming', 'energizing', 'creative', 'sleepy', 'euphoric', etc.
    },
    strain: {
      type: String,
      enum: ["indica", "indica-dominant hybrid", "hybrid", "sativa-dominant hybrid", "sativa"],
      lowercase: true
    },
    thcContent: {
      type: Number,
      min: 0,
      max: 100
    },
    cbdContent: {
      type: Number,
      min: 0,
      max: 100
    },
    startDate: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!value) return true;

          const inputDate = new Date(value);
          const today = new Date();

          // Compare year, month, day explicitly
          return (
            inputDate.getFullYear() > today.getFullYear() ||
            (inputDate.getFullYear() === today.getFullYear() &&
              (inputDate.getMonth() > today.getMonth() ||
                (inputDate.getMonth() === today.getMonth() &&
                  inputDate.getDate() >= today.getDate())))
          );
        },
        message: 'Start date must be today or in the future',
      },
    },
    endDate: { type: Date },
    slug: { type: String },
    manuallyActivated: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    isPurchased: { type: Boolean, default: false },
    discountTier: {
      type: Number,
      min: 10,
      max: 50,
      validate: {
        validator: function (value) {
          if (value === undefined || value === null) return true;
          return value % 10 === 0;
        },
        message: 'Discount tier must be in 10% increments between 10 and 50',
      },
    },
    sizeOrStrength: {
      type: String,
      trim: true,
      // Product size or strength, e.g. 3.5g, 100mg, 0.5g x 10 pack, 30ml
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtuals
dealSchema.virtual('savings').get(function () {
  return this.originalPrice - this.salePrice;
});

dealSchema.virtual('discountPercent').get(function () {
  if (typeof this.discountTier === 'number') {
    return this.discountTier;
  }
  if (this.originalPrice && this.salePrice && this.originalPrice > 0) {
    const pct = (1 - this.salePrice / this.originalPrice) * 100;
    return Math.round(pct);
  }
  return null;
});

dealSchema.virtual('estimatedOriginalPrice').get(function () {
  if (this.originalPrice) return this.originalPrice;
  if (this.salePrice && typeof this.discountTier === 'number') {
    const fraction = 1 - this.discountTier / 100;
    if (fraction <= 0) return null;
    const est = this.salePrice / fraction;
    return Math.round(est * 100) / 100;
  }
  return null;
});

dealSchema.virtual('estimatedSavings').get(function () {
  const original = this.estimatedOriginalPrice ?? this.originalPrice;
  if (original && this.salePrice) {
    const savings = original - this.salePrice;
    return Math.round(savings * 100) / 100;
  }
  return null;
});

dealSchema.virtual('isExpired').get(function () {
  if (!this.endDate) return false;
  return new Date() > this.endDate;
});

dealSchema.virtual('isCurrentlyActive').get(function () {
  const now = new Date();
  return (
    (this.manuallyActivated || (this.startDate && this.endDate && now >= this.startDate && now <= this.endDate)) &&
    !this.isExpired
  );
});

dealSchema.virtual('primaryImage').get(function () {
  return this.images?.[0] ?? null;
});

dealSchema.virtual('expiresIn').get(function () {
  const now = new Date();
  const diff = this.endDate - now;
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
});

// Static method
dealSchema.statics.findCurrentlyActive = function () {
  const now = new Date();
  return this.find({
    $or: [
      {
        $and: [
          { startDate: { $lte: now } },
          { endDate: { $gte: now } },
        ],
      },
      { manuallyActivated: true },
    ],
  });
};

// Slug generation
dealSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

// Ensure deal has at least one image (use default category image if none provided)
dealSchema.pre('save', function (next) {
  // Only apply if images are being set/modified and category exists
  if (this.category && (!this.images || this.images.length === 0 || !this.images[0])) {
    this.images = ensureDealHasImage(this.images, this.category);
  }
  next();
});

// Custom validation: startDate must be before endDate
dealSchema.pre('validate', function (next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    this.invalidate('startDate', 'Start date must be before end date');
  }
  next();
});

// Custom validation: salePrice must be <= originalPrice
dealSchema.pre('validate', function (next) {
  if (this.salePrice && this.originalPrice && this.salePrice > this.originalPrice) {
    this.invalidate('salePrice', 'Sale price must be less than or equal to original price');
  }
  next();
});

// Text index for search
dealSchema.index({ brand: 'text', tags: 'text' });

export default mongoose.models.Deal || mongoose.model('Deal', dealSchema);
