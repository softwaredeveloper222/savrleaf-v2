import express from 'express';
import Analytics from '../models/Analytics.js';
import Deal from '../models/Deal.js';
import Dispensary from '../models/Dispensary.js';
import authMiddleware, { adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/analytics/track
 * PUBLIC ENDPOINT - Tracks deal click events
 * No authentication required - minimal data collection
 * ADMIN ONLY - This data is only accessible to admins via GET /api/admin/analytics
 */
router.post('/track', async (req, res) => {
  try {
    const { dealId, distance } = req.body;

    // Validate required fields
    if (!dealId) {
      return res.status(400).json({
        success: false,
        message: 'dealId is required',
      });
    }

    // Fetch deal and dispensary information
    const deal = await Deal.findById(dealId).populate('dispensary', 'name');
    
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found',
      });
    }

    // Get dispensary name if available
    const dispensaryName = deal.dispensary?.name || null;
    const dispensaryId = deal.dispensary?._id || deal.dispensary;

    // Create analytics event
    const analyticsEvent = await Analytics.create({
      event: 'deal_clicked',
      dealName: deal.title,
      dealId: deal._id,
      dispensaryId: dispensaryId,
      dispensaryName: dispensaryName,
      distance: distance ? Number(distance) : null,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: 'Event tracked successfully',
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event',
    });
  }
});

export default router;

