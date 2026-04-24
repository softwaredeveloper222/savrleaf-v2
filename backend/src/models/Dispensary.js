import mongoose from 'mongoose';
import { getCoordinatesFromAddress } from '../utils/geocode.js';
import { ensureDispensaryHasImages, ensureDispensaryHasLogo } from '../utils/defaultCategoryImages.js';

const { Schema, model } = mongoose;

const DispensarySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    address: {
      street1: { type: String, required: true },
      street2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: {
        type: String,
        required: true,
        match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid zip code'],
      },
    },
    subPartnerEmail: {
      type: String,
      required: false,
    },
    subPartnerPassword: {
      type: String,
      required: false,
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    type: {
      type: String,
      enum: ['main', 'additional'],
      default: 'main',
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
    },
    websiteUrl: {
      type: String,
    },
    phoneNumber: {
      type: String,
      match: [/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'],
    },
    hours: {
      type: Map,
      of: String,
    },
    weeklyPromotions: {
      type: Map,
      of: String,
    },
    accessoriesMerch: {
      type: String,
    },
    description: {
      type: String,
    },
    amenities: {
      type: [String],
      default: [],
    },
    logo: {
      type: String,
    },
    images: {
      type: [String],
      default: ['https://res.cloudinary.com/da6h7gmay/image/upload/v1766964475/others_gvdmgl.png'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      // required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adminNotes: {
      type: String,
    },
    ratings: {
      type: [Number],
      default: [],
    },
    skuLimit: {
      type: Number,
      default: 0,
    },
    additionalSkuLimit: {
      type: Number,
      default: 0,
    },
    usedSkus: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isPurchased: {
      type: Boolean,
      default: false,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    extraLimit: {
      type: Number,
      default: 10,
    },
    accessType: {
      type: String,
      enum: ['medical', 'recreational', 'medical/recreational'],
      default: 'medical',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Create geospatial index for location-based queries
DispensarySchema.index({ coordinates: '2dsphere' });

DispensarySchema.pre('save', async function (next) {
  if (this.isModified('address')) {
    const { street1, street2, city, state, zipCode } = this.address;
    const fullAddress = `${street1}${street2 ? ' ' + street2 : ''}, ${city}, ${state} ${zipCode}`;
    const coords = await getCoordinatesFromAddress(fullAddress);
    if (coords) {
      this.coordinates = {
        type: 'Point',
        coordinates: coords,
      };
    }
  }
  next();
});

DispensarySchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.address) {
    const { street1, street2, city, state, zipCode } = update.address;
    const fullAddress = `${street1}${street2 ? ' ' + street2 : ''}, ${city}, ${state} ${zipCode}`;
    const coords = await getCoordinatesFromAddress(fullAddress);
    if (coords) {
      update.coordinates = {
        type: 'Point',
        coordinates: coords,
      };
    }
  }
  next();
});

export default model('Dispensary', DispensarySchema);
