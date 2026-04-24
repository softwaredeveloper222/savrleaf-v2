import express from 'express';
import User from '../models/User.js';
import Deal from '../models/Deal.js';
import Dispensary from '../models/Dispensary.js';
import Application from '../models/Application.js';
import Analytics from '../models/Analytics.js';
import MaintenanceMode from '../models/MaintenanceMode.js';
import authMiddleware, { adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalDeals = await Deal.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalDispensaries = await Dispensary.countDocuments();
    const totalApplications = await Application.countDocuments();

    // Include archived records in admin dashboard (can filter by ?includeArchived=true)
    const includeArchived = req.query.includeArchived === 'true';
    const appFilter = includeArchived ? {} : { isArchived: { $ne: true } };
    const dispFilter = includeArchived ? {} : { isArchived: { $ne: true } };

    const applications = await Application.find(appFilter).lean();

    const users = await User.find()
      .populate({
        path: 'subscription',
        populate: { path: 'tier' }
      })
      .lean();

    const dispensaries = await Dispensary.find(dispFilter).lean();

    const deals = await Deal.find()
      .populate({
        path: 'dispensary',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .lean();

    res.json({
      overview: { totalDeals, totalUsers, totalDispensaries, totalApplications },
      users,
      deals,
      dispensaries,
      applications,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/admin/analytics
 * ADMIN ONLY ENDPOINT - Fetches analytics data
 * Requires admin authentication
 * NOT PARTNER FACING - Partners cannot access this endpoint
 */
router.get('/analytics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      dealId,
      dispensaryId,
      limit = 100,
      page = 1,
    } = req.query;

    // Build filter object
    const filters = {};

    // Date range filter
    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) {
        filters.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filters.timestamp.$lte = new Date(endDate);
      }
    }

    // Deal filter
    if (dealId) {
      filters.dealId = dealId;
    }

    // Dispensary filter
    if (dispensaryId) {
      filters.dispensaryId = dispensaryId;
    }

    // Pagination
    const perPage = Math.min(Number(limit), 500); // Max 500 per page
    const currentPage = Math.max(Number(page), 1);
    const skip = (currentPage - 1) * perPage;

    // Fetch analytics events
    const events = await Analytics.find(filters)
      .populate('dealId', 'title category brand')
      .populate('dispensaryId', 'name address')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(perPage)
      .lean();

    // Get total count for pagination
    const total = await Analytics.countDocuments(filters);

    // Aggregate statistics
    const totalClicks = await Analytics.countDocuments({ event: 'deal_clicked' });
    const uniqueDeals = await Analytics.distinct('dealId', { event: 'deal_clicked' });
    const uniqueDispensaries = await Analytics.distinct('dispensaryId', { event: 'deal_clicked' });

    // Get top deals by click count
    const topDeals = await Analytics.aggregate([
      { $match: { event: 'deal_clicked' } },
      {
        $group: {
          _id: '$dealId',
          clickCount: { $sum: 1 },
          dealName: { $first: '$dealName' },
        },
      },
      { $sort: { clickCount: -1 } },
      { $limit: 10 },
    ]);

    // Get top dispensaries by click count
    const topDispensaries = await Analytics.aggregate([
      { $match: { event: 'deal_clicked' } },
      {
        $group: {
          _id: '$dispensaryId',
          clickCount: { $sum: 1 },
          dispensaryName: { $first: '$dispensaryName' },
        },
      },
      { $sort: { clickCount: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          total,
          page: currentPage,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
        statistics: {
          totalClicks,
          uniqueDeals: uniqueDeals.length,
          uniqueDispensaries: uniqueDispensaries.length,
        },
        topDeals,
        topDispensaries,
      },
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
    });
  }
});

/**
 * GET /api/admin/maintenance-mode
 * ADMIN ONLY ENDPOINT - Get maintenance mode status
 * Requires admin authentication
 * NOT PARTNER FACING
 */
router.get('/maintenance-mode', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const maintenanceMode = await MaintenanceMode.getMaintenanceMode();
    res.json({
      success: true,
      data: {
        isEnabled: maintenanceMode.isEnabled,
        message: maintenanceMode.message,
        updatedAt: maintenanceMode.updatedAt,
      },
    });
  } catch (error) {
    console.error('Maintenance mode fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance mode status',
    });
  }
});

/**
 * POST /api/admin/maintenance-mode/toggle
 * ADMIN ONLY ENDPOINT - Toggle maintenance mode ON/OFF
 * Requires admin authentication
 * NOT PARTNER FACING
 */
router.post('/maintenance-mode/toggle', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { isEnabled, message } = req.body;
    const userId = req.user._id;

    const maintenanceMode = await MaintenanceMode.setMaintenanceMode(
      isEnabled === true || isEnabled === 'true',
      userId,
      message
    );

    res.json({
      success: true,
      message: `Maintenance mode ${maintenanceMode.isEnabled ? 'enabled' : 'disabled'}`,
      data: {
        isEnabled: maintenanceMode.isEnabled,
        message: maintenanceMode.message,
        updatedAt: maintenanceMode.updatedAt,
      },
    });
  } catch (error) {
    console.error('Maintenance mode toggle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle maintenance mode',
    });
  }
});

export default router;
