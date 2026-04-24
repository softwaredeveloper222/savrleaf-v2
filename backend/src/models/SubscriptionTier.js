import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const SubscriptionTierSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    tier: {
      type: Number,
      required: true,
    },
    baseSKULimit: {
      type: Number,
      required: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
    },
    annualPrice: {
      type: Number,
      required: true,
    },
    annualBonusSKUs: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
    },
  },
  { timestamps: true }
);

export default model('SubscriptionTier', SubscriptionTierSchema);
