import express from 'express';
import MaintenanceMode from '../models/MaintenanceMode.js';

const router = express.Router();

/**
 * GET /api/maintenance-mode/status
 * PUBLIC ENDPOINT - Check maintenance mode status
 * Used by frontend to determine if maintenance mode is active
 * No authentication required
 */
router.get('/status', async (req, res) => {
  try {
    const maintenanceMode = await MaintenanceMode.getMaintenanceMode();
    res.json({
      success: true,
      maintenance: maintenanceMode.isEnabled,
      message: maintenanceMode.message || 'We are currently performing maintenance. Please check back soon.',
    });
  } catch (error) {
    console.error('Maintenance mode status error:', error);
    // On error, assume maintenance mode is OFF (fail open)
    res.json({
      success: true,
      maintenance: false,
      message: '',
    });
  }
});

export default router;

