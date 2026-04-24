'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface MaintenanceModeStatus {
  maintenance: boolean;
  message: string;
}

/**
 * ADMIN ONLY - Maintenance Mode Hook
 * Checks maintenance mode status from backend
 * NOT PARTNER FACING
 */
export function useMaintenanceMode() {
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceModeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/maintenance-mode/status`);
        if (res.data.success) {
          setMaintenanceMode({
            maintenance: res.data.maintenance,
            message: res.data.message || 'We are currently performing maintenance. Please check back soon.',
          });
        } else {
          // Fail open - assume maintenance mode is OFF
          setMaintenanceMode({
            maintenance: false,
            message: '',
          });
        }
      } catch (error) {
        console.error('Failed to check maintenance mode:', error);
        // Fail open - assume maintenance mode is OFF
        setMaintenanceMode({
          maintenance: false,
          message: '',
        });
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceMode();
  }, []);

  return { maintenanceMode, loading };
}

