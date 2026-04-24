import MaintenanceMode from '../models/MaintenanceMode.js';
import User from '../models/User.js';

/**
 * ADMIN ONLY - Maintenance Mode Middleware
 * Blocks public routes when maintenance mode is ON
 * Admin routes are excluded from this check
 * NOT PARTNER FACING
 */
export const maintenanceModeMiddleware = async (req, res, next) => {
  try {
    // Allow admin routes to bypass maintenance mode completely
    if (req.path.startsWith('/api/admin')) {
      return next();
    }

    // Allow admin authentication routes
    if (req.path.startsWith('/api/admin/auth')) {
      return next();
    }

    // Allow maintenance mode status check endpoint
    if (req.path.startsWith('/api/maintenance-mode')) {
      return next();
    }

    // Check maintenance mode status
    const maintenanceMode = await MaintenanceMode.getMaintenanceMode();

    if (maintenanceMode.isEnabled) {
      // Check if user is authenticated and is an admin
      // Try to get user from token if available
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const jwt = require('jsonwebtoken');
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId = decoded.id || decoded._id;
          const user = await User.findById(userId).select('role');
          
          if (user && user.role === 'admin') {
            // Admin user, allow access
            return next();
          }
        } catch (err) {
          // Token invalid or expired, continue to maintenance mode check
        }
      }

      // Return 503 Service Unavailable for public routes
      return res.status(503).json({
        success: false,
        maintenance: true,
        message: maintenanceMode.message || 'We are currently performing maintenance. Please check back soon.',
      });
    }

    // Maintenance mode is OFF, proceed normally
    next();
  } catch (error) {
    console.error('Maintenance mode middleware error:', error);
    // On error, allow request to proceed (fail open)
    next();
  }
};

export default maintenanceModeMiddleware;

