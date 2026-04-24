import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    tier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionTier',
      required: true,
    },

    stripeSubscriptionId: {
      type: String,
      required: false,
      // unique: true,
    },

    // stripeCustomerId: {
    //   type: String,
    //   required: false,
    //   unique: true,
    // },

    status: {
      type: String,
      enum: ['inactive', 'active', 'trialing', 'past_due', 'unpaid', 'canceled', 'pending'], // add 'pending'
      default: 'pending',
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    currentPeriodEnd: {
      type: Date, // from Stripe
    },

    billingInterval: {
      type: String,
      enum: ['month', 'year'],
      required: false,
    },

    skuCount: {
      type: Number,
      default: 0,
    },

    bonusSkus: {
      type: Number,
      default: 0,
    },

    adminSkuOverride: {
      type: Number,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    additionalLocationsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
