'use client';

/**
 * ADMIN ONLY - Maintenance Mode Toggle Component
 * Allows admin users to toggle maintenance mode ON/OFF
 * NOT PARTNER FACING
 */

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Settings, Power } from 'lucide-react';

interface MaintenanceModeData {
  isEnabled: boolean;
  message: string;
  updatedAt?: string;
}

export default function MaintenanceModeToggle() {
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceModeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMaintenanceMode();
  }, []);

  const fetchMaintenanceMode = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/maintenance-mode`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMaintenanceMode(res.data.data);
        setMessage(res.data.data.message || '');
      }
    } catch (error) {
      console.error('Failed to fetch maintenance mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!maintenanceMode) return;

    try {
      setToggling(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/maintenance-mode/toggle`,
        {
          isEnabled: !maintenanceMode.isEnabled,
          message: message || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMaintenanceMode(res.data.data);
        alert(`Maintenance mode ${res.data.data.isEnabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error: any) {
      console.error('Failed to toggle maintenance mode:', error);
      alert(error.response?.data?.message || 'Failed to toggle maintenance mode');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-gray-500">Loading maintenance mode status...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">Maintenance Mode</h2>
        <span className="text-xs text-gray-500 ml-auto">ADMIN ONLY</span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700 font-medium">Status</p>
            <p className="text-xs text-gray-500 mt-1">
              {maintenanceMode?.isEnabled
                ? 'Maintenance mode is currently ON'
                : 'Maintenance mode is currently OFF'}
            </p>
          </div>
          <div
            className={`flex items-center justify-center w-14 h-8 rounded-full transition-colors ${
              maintenanceMode?.isEnabled ? 'bg-orange-600' : 'bg-gray-300'
            }`}
          >
            <Power
              className={`w-5 h-5 transition-transform ${
                maintenanceMode?.isEnabled ? 'text-white rotate-0' : 'text-gray-600 rotate-180'
              }`}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maintenance Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="We are currently performing maintenance. Please check back soon."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            This message will be displayed to public users when maintenance mode is ON.
          </p>
        </div>

        {maintenanceMode?.updatedAt && (
          <div className="text-xs text-gray-500">
            Last updated: {new Date(maintenanceMode.updatedAt).toLocaleString()}
          </div>
        )}

        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`w-full px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
            maintenanceMode?.isEnabled
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-orange-600 hover:bg-orange-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {toggling
            ? 'Updating...'
            : maintenanceMode?.isEnabled
            ? 'Turn Maintenance Mode OFF'
            : 'Turn Maintenance Mode ON'}
        </button>

        {maintenanceMode?.isEnabled && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              <strong>Note:</strong> When maintenance mode is ON, public users will see a maintenance
              message. Admin users can still access the admin dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

