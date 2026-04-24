'use client';

/**
 * ADMIN ONLY - Analytics Component
 * NOT PARTNER FACING - Partners cannot access this component
 * Displays deal click analytics for admin users only
 */

import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart3, TrendingUp, Package, Store, Calendar, Filter } from 'lucide-react';

interface AnalyticsEvent {
  _id: string;
  event: string;
  dealName: string;
  dealId: {
    _id: string;
    title: string;
    category: string;
    brand?: string;
  };
  dispensaryId: {
    _id: string;
    name: string;
    address?: {
      city: string;
      state: string;
    };
  };
  dispensaryName?: string;
  distance?: number;
  timestamp: string;
}

interface AnalyticsData {
  events: AnalyticsEvent[];
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  statistics: {
    totalClicks: number;
    uniqueDeals: number;
    uniqueDispensaries: number;
  };
  topDeals: Array<{
    _id: string;
    clickCount: number;
    dealName: string;
  }>;
  topDispensaries: Array<{
    _id: string;
    clickCount: number;
    dispensaryName: string;
  }>;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50,
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/analytics?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filters.page]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-600" />
            Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">ADMIN ONLY - Discount click tracking and statistics</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Clicks</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.statistics.totalClicks.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unique Discounts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.statistics.uniqueDeals}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unique Dispensaries</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.statistics.uniqueDispensaries}</p>
            </div>
            <Store className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchAnalytics}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Top Deals and Dispensaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Deals */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Discounts by Clicks</h2>
          <div className="space-y-3">
            {data.topDeals.length > 0 ? (
              data.topDeals.map((deal, index) => (
                <div key={deal._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-500 w-6">{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{deal.dealName}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">{deal.clickCount} clicks</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No data available</p>
            )}
          </div>
        </div>

        {/* Top Dispensaries */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Dispensaries by Clicks</h2>
          <div className="space-y-3">
            {data.topDispensaries.length > 0 ? (
              data.topDispensaries.map((dispensary, index) => (
                <div key={dispensary._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-500 w-6">{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{dispensary.dispensaryName || 'Unknown'}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{dispensary.clickCount} clicks</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispensary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.events.length > 0 ? (
                data.events.map((event) => (
                  <tr key={event._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(event.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.dealId?.title || event.dealName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.dispensaryId?.name || event.dispensaryName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.distance !== null && event.distance !== undefined
                        ? `${event.distance.toFixed(1)} mi`
                        : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((data.pagination.page - 1) * data.pagination.perPage) + 1} to{' '}
              {Math.min(data.pagination.page * data.pagination.perPage, data.pagination.total)} of{' '}
              {data.pagination.total} events
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= data.pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

