import mongoose from 'mongoose';

/**
 * ADMIN ONLY - Analytics Model
 * Tracks deal click events for admin analytics dashboard.
 * NOT PARTNER FACING - Partners do not have access to this data.
 */
const analyticsSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      enum: ['deal_clicked'],
      default: 'deal_clicked',
    },
    dealName: {
      type: String,
      required: true,
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: true,
    },
    dispensaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispensary',
      required: true,
    },
    dispensaryName: {
      type: String,
      required: false, // Optional, populated if available
    },
    distance: {
      type: Number,
      required: false, // Distance in miles from user to dispensary
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
analyticsSchema.index({ timestamp: -1 }); // For sorting by most recent
analyticsSchema.index({ dealId: 1 }); // For filtering by deal
analyticsSchema.index({ dispensaryId: 1 }); // For filtering by dispensary
analyticsSchema.index({ event: 1, timestamp: -1 }); // For filtering by event type

const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);

export default Analytics;

