'use client';

import { SetStateAction, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminTable from '@/components/AdminTable';
import DashboardLayout, { TabKey } from '../../components/dashboard/DashboardLayout';
import axios from 'axios';
import Modal from '@/components/Modal';
import DealForm from '@/components/DealForm';
import ApplicationModal from '@/components/ApplicationModal';
import { Application, Deal, Dispensary, GenericDispensary, Subscription, User } from '@/types';
import DispensaryModal from '@/components/DispensaryModal';
import UserModal from '@/components/UserModal';
import DispensaryForm from '@/components/DispensaryForm';
import { countUserActiveDeals } from '@/utils/usedSkus';
import MapView from '@/components/MapView';
import Analytics from '@/components/Analytics';
import MaintenanceModeToggle from '@/components/MaintenanceModeToggle';
import ChangePassword from '@/components/ChangePassword';

interface OverviewData {
  totalUsers: number;
  totalDeals: number;
  totalDispensaries: number;
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>('adminOverview');
  const [showDealForm, setShowDealForm] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const handleViewApplication = (app: Application) => setSelectedApplication(app);
  const handleCloseApplicationModal = () => setSelectedApplication(null);
  const [selectedDispensary, setSelectedDispensary] = useState<Dispensary | null>(null);
  const handleViewDispensary = (disp: Dispensary) => setSelectedDispensary(disp);
  const handleCloseDispensaryModal = () => setSelectedDispensary(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
const [showAddDispensaryModal, setShowAddDispensaryModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Deal search and filter states
  const [dealSearchQuery, setDealSearchQuery] = useState('');
  const [dealCategoryFilter, setDealCategoryFilter] = useState<string>('all');
  const [dealStatusFilter, setDealStatusFilter] = useState<string>('all');
  const [dealDispensaryFilter, setDealDispensaryFilter] = useState<string>('all');

  // Application filter state
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');

  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const [genericDispensaries, setGenericDispensaries] = useState<GenericDispensary[]>([]);
  const [genericDispensariesLoading, setGenericDispensariesLoading] = useState(false);
  const [genericUploading, setGenericUploading] = useState(false);
  const [genericUploadResult, setGenericUploadResult] = useState<{ imported: number; skipped: number; errors?: string[] } | null>(null);
  const [editingGenericId, setEditingGenericId] = useState<string | null>(null);
  const [editingGenericData, setEditingGenericData] = useState<Partial<GenericDispensary>>({});
  const [showAddGenericModal, setShowAddGenericModal] = useState(false);
  const [newGenericData, setNewGenericData] = useState<Partial<GenericDispensary>>({
    name: '',
    address: { street1: '', street2: '', city: '', state: '', zipCode: '' },
    licenseNumber: '',
    websiteUrl: '',
    phoneNumber: '',
    email: '',
  });
  const [addingGeneric, setAddingGeneric] = useState(false);

  // Filter deals based on search and filters - MUST be before any early returns
  const filteredDeals = useMemo(() => {
    let filtered = [...deals];

    // Search filter
    if (dealSearchQuery.trim()) {
      const query = dealSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(deal => {
        const dispensary = typeof deal.dispensary === 'string' 
          ? dispensaries.find(d => d._id === deal.dispensary)
          : deal.dispensary;
        
        let user: User | null = null;
        if (dispensary) {
          if (typeof dispensary.user === 'object' && dispensary.user) {
            user = dispensary.user as User;
          } else if (typeof dispensary.user === 'string') {
            user = users.find(u => u._id === dispensary.user) || null;
          }
        }
        
        return (
          deal.title?.toLowerCase().includes(query) ||
          deal.description?.toLowerCase().includes(query) ||
          deal.brand?.toLowerCase().includes(query) ||
          deal.category?.toLowerCase().includes(query) ||
          dispensary?.name?.toLowerCase().includes(query) ||
          (user && (
            user.firstName?.toLowerCase().includes(query) ||
            user.lastName?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query)
          )) ||
          deal.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      });
    }

    // Category filter
    if (dealCategoryFilter !== 'all') {
      filtered = filtered.filter(deal => deal.category === dealCategoryFilter);
    }

    // Status filter
    if (dealStatusFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(deal => {
        const start = deal.startDate ? new Date(deal.startDate) : null;
        const end = deal.endDate ? new Date(deal.endDate) : null;
        
        if (dealStatusFilter === 'active') {
          return deal.manuallyActivated || (start && now >= start && end && now <= end);
        } else if (dealStatusFilter === 'upcoming') {
          return start && now < start;
        } else if (dealStatusFilter === 'expired') {
          return end && now > end;
        } else if (dealStatusFilter === 'manually-activated') {
          return deal.manuallyActivated;
        }
        return true;
      });
    }

    // Dispensary filter
    if (dealDispensaryFilter !== 'all') {
      filtered = filtered.filter(deal => {
        const dispensaryId = typeof deal.dispensary === 'string' 
          ? deal.dispensary 
          : deal.dispensary?._id;
        return dispensaryId === dealDispensaryFilter;
      });
    }

    return filtered;
  }, [deals, dealSearchQuery, dealCategoryFilter, dealStatusFilter, dealDispensaryFilter, dispensaries, users]);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || user?.role !== 'admin') {
      router.replace('/admin-login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { includeArchived: 'true' },
        });

        setOverview(res.data.overview);
        setUsers(res.data.users);
        setDispensaries(res.data.dispensaries);
        setDeals(res.data.deals);
        setApplications(res.data.applications);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setFetchError('Failed to load dashboard data');
      } finally {
        setFetching(false);
      }
    };

    fetchDashboard();
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => {
    if (activeTab !== 'genericDispensaries' || !isAuthenticated || user?.role !== 'admin') return;
    const fetchGeneric = async () => {
      setGenericDispensariesLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/generic-dispensaries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGenericDispensaries(res.data?.genericDispensaries || []);
      } catch (err) {
        console.error('Failed to fetch generic dispensaries:', err);
      } finally {
        setGenericDispensariesLoading(false);
      }
    };
    fetchGeneric();
  }, [activeTab, isAuthenticated, user?.role]);

  const fetchGenericDispensaries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/generic-dispensaries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGenericDispensaries(res.data?.genericDispensaries || []);
    } catch (err) {
      console.error('Failed to fetch generic dispensaries:', err);
    }
  };

  const handleGenericUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGenericUploading(true);
    setGenericUploadResult(null);
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('file', file);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/generic-dispensaries/upload`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGenericUploadResult({
        imported: res.data.imported ?? 0,
        skipped: res.data.skipped ?? 0,
        errors: res.data.errors,
      });
      await fetchGenericDispensaries();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setGenericUploadResult({ imported: 0, skipped: 0, errors: [ax.response?.data?.message || 'Upload failed'] });
    } finally {
      setGenericUploading(false);
      e.target.value = '';
    }
  };

  const handleEditGeneric = (d: GenericDispensary) => {
    setEditingGenericId(d._id);
    setEditingGenericData({
      name: d.name,
      address: { ...d.address },
      licenseNumber: d.licenseNumber || '',
      websiteUrl: d.websiteUrl || '',
      phoneNumber: d.phoneNumber || '',
      email: d.email || '',
    });
  };

  const handleSaveGeneric = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/generic-dispensaries/${id}`,
        editingGenericData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setGenericDispensaries((prev: GenericDispensary[]) =>
          prev.map((d: GenericDispensary) => (d._id === id ? res.data.genericDispensary : d))
        );
        setEditingGenericId(null);
        setEditingGenericData({});
      }
    } catch (err) {
      console.error('Failed to update generic dispensary:', err);
      alert('Failed to save changes.');
    }
  };

  const handleDeleteGeneric = async (id: string) => {
    if (!confirm('Delete this generic dispensary?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/admin/generic-dispensaries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGenericDispensaries((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      console.error('Delete generic dispensary failed:', err);
      alert('Failed to delete.');
    }
  };

  const handleAddGeneric = async () => {
    if (!newGenericData.name || !newGenericData.address?.city || !newGenericData.address?.state || !newGenericData.address?.zipCode) {
      alert('Name, city, state, and zip code are required.');
      return;
    }
    setAddingGeneric(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/generic-dispensaries`,
        newGenericData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setGenericDispensaries((prev) => [res.data.genericDispensary, ...prev]);
        setShowAddGenericModal(false);
        setNewGenericData({
          name: '',
          address: { street1: '', street2: '', city: '', state: '', zipCode: '' },
          licenseNumber: '',
          websiteUrl: '',
          phoneNumber: '',
          email: '',
        });
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      alert(ax.response?.data?.message || 'Failed to add generic dispensary.');
    } finally {
      setAddingGeneric(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        <p>{fetchError}</p>
      </div>
    );
  }
  const resetUserForm = () => {
    setFirstName('')
    setLastName('')
    setEmail('');
  }

  const handleAddPartner = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users`, { firstName, lastName, email }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const newUser = res.data.user;
      setUsers((prev) => [newUser, ...prev]);
      setShowAddPartnerModal(false);
    } catch (err) {
      console.error('Failed to add partner', err);
    } finally {
      resetUserForm();
    }
  };

  const handleEditDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setShowDealForm(true);
  };

  const handleSaveDeal = (savedDeal: Deal) => {
    if (selectedDeal) {
      setDeals((prev) => prev.map((d) => (d._id === savedDeal._id ? savedDeal : d)));
    } else {
      setDeals((prev) => [savedDeal, ...prev]);
    }
    setShowDealForm(false);
  };

  const handleCancelForm = () => {
    setShowDealForm(false);
    setSelectedDeal(null);
  };

  const handleToggleDealActivation = async (deal: Deal) => {
    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/deals/${deal._id}`,
        { manuallyActivated: !deal.manuallyActivated },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (res.data.success) {
        setDeals((prev) => prev.map((d) => 
          d._id === deal._id ? { ...d, manuallyActivated: !d.manuallyActivated } : d
        ));
      } else {
        alert(res.data.message || 'Failed to update discount activation status.');
      }
    } catch (err) {
      console.error('Error toggling deal activation:', err);
      alert('Error updating discount activation status.');
    }
  };

  const handleApproveApplication = async (id: string) => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/applications/${id}/approve`,
        null,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      const updatedApp = res.data.application;
      const createdDispensaries = res.data.dispensaries;

      // Update applications
      setApplications((prev) =>
        prev.map((a) => (a._id === id ? updatedApp : a))
      );

      // Add newly created dispensaries to the list
      if (createdDispensaries?.length) {
        setDispensaries((prev) => {
          const existingIds = new Set(prev.map((d: Dispensary) => d._id));
          const newDisps = createdDispensaries.filter((d: Dispensary) => !existingIds.has(d._id));
          return [...prev, ...newDisps];
        });
      }

      alert(res.data.message || 'Application approved');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to approve application');
    }
  };

  const handleRejectApplication = async (id: string) => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/applications/${id}/reject`,
        null,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      const updatedApp = res.data.application;
      const updatedDisp = res.data.dispensary;

      setApplications((prev) =>
        prev.map((a) => (a._id === id ? updatedApp : a))
      );

      if (updatedDisp) {
        setDispensaries((prev) =>
          prev.map((d) => (d._id === updatedDisp._id ? updatedDisp : d))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveApplication = async (id: string) => {
    try {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/applications/${id}/archive`,
        null,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setApplications((prev) =>
        prev.map((a) => (a._id === id ? { ...a, isArchived: true } : a))
      );
      alert('Application archived');
    } catch (err) {
      console.error('Error archiving application:', err);
      alert('Failed to archive application');
    }
  };

  const handleUnarchiveApplication = async (id: string) => {
    try {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/applications/${id}/unarchive`,
        null,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setApplications((prev) =>
        prev.map((a) => (a._id === id ? { ...a, isArchived: false } : a))
      );
      alert('Application unarchived');
    } catch (err) {
      console.error('Error unarchiving application:', err);
      alert('Failed to unarchive application');
    }
  };

  const handleResetApplication = async (id: string) => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/applications/${id}/reset`,
        null,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const updatedApp = res.data.application;
      setApplications((prev) =>
        prev.map((a) => (a._id === id ? { ...a, ...updatedApp, status: 'pending' } : a))
      );
      alert('Application reset to pending');
    } catch (err: any) {
      console.error('Error resetting application:', err);
      alert(err?.response?.data?.message || 'Failed to reset application');
    }
  };

  const handleArchiveDispensary = async (id: string) => {
    try {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/dispensaries/${id}/archive`,
        null,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setDispensaries((prev) =>
        prev.map((d) => (d._id === id ? { ...d, isArchived: true } : d))
      );
      alert('Dispensary archived');
    } catch (err) {
      console.error('Error archiving dispensary:', err);
      alert('Failed to archive dispensary');
    }
  };

  const handleUnarchiveDispensary = async (id: string) => {
    try {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/dispensaries/${id}/unarchive`,
        null,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setDispensaries((prev) =>
        prev.map((d) => (d._id === id ? { ...d, isArchived: false } : d))
      );
      alert('Dispensary unarchived');
    } catch (err) {
      console.error('Error unarchiving dispensary:', err);
      alert('Failed to unarchive dispensary');
    }
  };

  const updateDispensaryStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/dispensaries/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDispensaries((prev) =>
        prev.map((d) => (d._id === id ? { ...d, status } : d))
      );
      setSelectedDispensary(prev => prev?._id === id ? { ...prev, status } : prev);
    } catch (err) {
      console.error('Failed to update dispensary status', err);
    }
  };

  const updateUserStatus = async (id: string, status: 'active' | 'inactive') => {
    console.log("updating: ", id, status)
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isActive: status === 'active' } : u))
      );
      setSelectedUser(prev => prev?._id === id ? { ...prev, isActive: status === 'active' } : prev);
    } catch (err) {
      console.error('Failed to update user status', err);
    }
  };

  const updateUserAllowMultipleLocations = async (id: string, allowMultipleLocations: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${id}/allow-multiple-locations`,
        { allowMultipleLocations },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, allowMultipleLocations } : u))
      );
      setSelectedUser(prev => prev?._id === id ? { ...prev, allowMultipleLocations } : prev);
    } catch (err) {
      console.error('Failed to update user allow multiple locations', err);
    }
  }

  async function handleUpdateSubscription(id: string, adminSkuOverride: number) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminSkuOverride }),
      });

      if (!res.ok) throw new Error('Failed to update subscription');

      const updatedSubscription: Subscription = await res.json();

      setSelectedDispensary(prev =>
        prev && prev._id === id ? { ...prev, subscription: updatedSubscription } : prev
      );
      setDispensaries(prev =>
        prev.map(d =>
          d._id === id ? { ...d, subscription: updatedSubscription } : d
        )
      );
    } catch (err) {
      console.error('Subscription update failed:', err);
    }
  }

  const handleUpdateDispensaryExtraLimit = async (id: string, extraLimit: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/dispensaries/${id}/extra-limit`,
        { extraLimit },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const updatedDispensary = res.data.dispensary;
        setSelectedDispensary(prev =>
          prev && prev._id === id ? { ...prev, extraLimit: updatedDispensary.extraLimit } : prev
        );
        setDispensaries(prev =>
          prev.map(d =>
            d._id === id ? { ...d, extraLimit: updatedDispensary.extraLimit } : d
          )
        );
      } else {
        alert(res.data.message || 'Failed to update extra limit.');
      }
    } catch (err) {
      console.error('Error updating dispensary extra limit:', err);
      alert('Error updating extra limit.');
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab} isAdmin>
      {activeTab === 'adminOverview' && (
        <>
          <h2 className="mb-6 text-3xl font-extrabold text-orange-700 tracking-tight">
            Admin Overview
          </h2>
          
          {/* ADMIN ONLY - Maintenance Mode Toggle */}
          <div className="mb-6">
            <MaintenanceModeToggle />
          </div>

          {/* Change Password Section */}
          <div className="mb-6 bg-white p-6 rounded-xl shadow border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Account Security</h3>
                <p className="text-sm text-gray-600">Change your admin password</p>
              </div>
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-700">Total Users</h3>
              <p className="text-5xl font-extrabold mt-2 text-gray-900">{overview?.totalUsers}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-700">Total Discounts</h3>
              <p className="text-5xl font-extrabold mt-2 text-gray-900">{overview?.totalDeals}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center border border-green-200">
              <h3 className="text-lg font-semibold text-green-700">Total Dispensaries</h3>
              <p className="text-5xl font-extrabold mt-2 text-gray-900">{overview?.totalDispensaries}</p>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <>
          <div className="flex row w-full justify-between">
            <h2 className="text-3xl font-extrabold text-orange-700 mb-6">Users</h2>
            {user && user.role === 'admin' && (
              <button
                className="
                  px-3 py-1.5 
                  rounded-md 
                  text-xs font-semibold 
                  bg-green-500 
                  text-white 
                  h-8
                  cursor-pointer
                  hover:bg-green-600 
                  focus:ring-2 
                  focus:ring-green-300 
                  transition
                "
                onClick={() => setShowAddPartnerModal(true)}
              >
                + Add Partner
              </button>
            )}
          </div>
          {showAddPartnerModal && (
            <Modal
              isOpen={showAddPartnerModal}
              onClose={() => setShowAddPartnerModal(false)}
            >
              <div className="flex flex-col items-center justify-center p-3 space-y-4">
                <h2 className="text-2xl font-extrabold text-orange-700 mb-6">Add Partner</h2>
                <input type="text" placeholder="First Name" className="w-full p-2 rounded-md border border-gray-300" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <input type="text" placeholder="Last Name" className="w-full p-2 rounded-md border border-gray-300" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                <input type="email" placeholder="Email" className="w-full p-2 rounded-md border border-gray-300" value={email} onChange={(e) => setEmail(e.target.value)} />
                {/* <input type="text" placeholder="Your Business Name" className="w-full p-2 rounded-md border border-gray-300" value={businessName} onChange={(e) => setBusinessName(e.target.value)} /> */}
                <div className="flex row w-full justify-end space-x-2">
                  <button className="px-3 py-1.5 rounded-md text-xs font-semibold bg-green-500 text-white h-10 cursor-pointer hover:bg-green-600 focus:ring-2 focus:ring-green-300 transition" onClick={() => {setShowAddPartnerModal(false); handleAddPartner();}}>
                    Add Partner
                  </button>
                  <button className="px-3 py-1.5 rounded-md text-xs font-semibold bg-red-500 text-white h-10 cursor-pointer hover:bg-red-600 focus:ring-2 focus:ring-red-300 transition" onClick={() => {setShowAddPartnerModal(false); resetUserForm();}}>
                    Cancel
                  </button>
                </div>
              </div>
            </Modal>
          )}
          <AdminTable
            data={users}
            columns={[
              {
                key: 'fullName',
                label: 'Full Name',
                render: (user: User) => `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              },
              { key: 'email', label: 'Email' },
              { key: 'role', label: 'Role' },
              {
                key: 'isActive',
                label: 'Is Active?',
                render: (user: User) => (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                ),
              },
            ]}
            actions={(user) => (
              <>
              <button
                className={`px-3 py-1 rounded cursor-pointer text-white ${user.isActive ? 'bg-red-600' : 'bg-green-600'
                  }`}
                onClick={async (e) => {
                  e.stopPropagation();
                  await updateUserStatus(user._id, user.isActive ? 'inactive' : 'active');
                }}
              >
                {user.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                className={`px-3 py-1 rounded cursor-pointer text-white ${user.allowMultipleLocations ? 'bg-red-600' : 'bg-green-600'} mr-2`}
                onClick={async (e) => {
                  e.stopPropagation();
                  await updateUserAllowMultipleLocations(user._id, user.allowMultipleLocations ? false : true);
                }}
              >
                {user.allowMultipleLocations ? 'Disallow Multiple Locations' : 'Allow Multiple Locations'}
              </button> 
              </>
            )}
            onRowClick={(user: SetStateAction<User | null>) => setSelectedUser(user)}
          />
          {selectedUser && (
            <UserModal
              user={selectedUser}
              isOpen={!!selectedUser}
              onClose={() => setSelectedUser(null)}
              onUpdateSubscription={handleUpdateSubscription}
              usedSkus={countUserActiveDeals(selectedUser._id, deals, dispensaries)}
            />
          )}
        </>
      )}

      {activeTab === 'dispensary' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="text-3xl font-extrabold text-orange-700">Dispensaries</h2>
            {/* <div className="flex items-center gap-3">
              <p className="text-xs text-gray-500 hidden sm:block">
                Select a partner in the Users tab, then add a dispensary for them.
              </p>
              <button
                className="px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 disabled:bg-gray-300 disabled:text-gray-600 transition cursor-pointer"
                onClick={() => {
                  // if (!selectedUser?._id) {
                  //   alert('Select a partner in the Users tab first.');
                  //   return;
                  // }
                  setShowAddDispensaryModal(true);
                }}
                // disabled={!selectedUser?._id}
              >
                Add Dispensary
              </button>
            </div> */}
          </div>
          <AdminTable
            data={dispensaries}
            columns={[
              { key: 'name', label: 'Name' },
              // { key: 'legalName', label: 'Legal Name' },
              { key: 'licenseNumber', label: 'License Number' },
              {
                key: 'status',
                label: 'Status',
                render: (disp: Dispensary) => (
                  <div className="flex flex-col gap-1 w-25 items-center justify-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${disp.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : disp.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {(disp.status || 'pending').toUpperCase()}
                    </span>
                    {disp.isArchived && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                        ARCHIVED
                      </span>
                    )}
                  </div>
                ),
              },
            ]}
            actions={(disp) => (
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded cursor-pointer text-white ${disp.status === 'approved'
                    ? 'bg-red-600'
                    : 'bg-green-600'
                    }`}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (disp.status) {
                      await updateDispensaryStatus(
                        disp._id,
                        (disp.status === 'approved' ? 'rejected' : 'approved') as 'approved' | 'rejected' | 'pending'
                      );
                    }
                  }}
                >
                  {disp.status === 'approved' ? 'Deactivate' : 'Activate'}
                </button>
                {disp.isArchived ? (
                  <button
                    className="px-3 py-1 rounded cursor-pointer bg-blue-600 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnarchiveDispensary(disp._id);
                    }}
                  >
                    Unarchive
                  </button>
                ) : (
                  <button
                    className="px-3 py-1 rounded cursor-pointer bg-gray-600 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchiveDispensary(disp._id);
                    }}
                  >
                    Archive
                  </button>
                )}
              </div>
            )}
            onRowClick={handleViewDispensary}
          />

          {showAddDispensaryModal && (
            <Modal isOpen={showAddDispensaryModal} onClose={() => setShowAddDispensaryModal(false)} maxWidth="4xl">
              <h3 className="text-2xl font-bold text-orange-700 mb-4">Add Dispensary for {selectedUser?.email || 'selected partner'}</h3>
              <DispensaryForm
                initialData={null}
                onSave={(dispensary) => {
                  setDispensaries((prev) => [dispensary, ...prev]);
                  setShowAddDispensaryModal(false);
                }}
                onCancel={() => setShowAddDispensaryModal(false)}
                userIdOverride={selectedUser?._id}
              />
            </Modal>
          )}
        </>
      )}

      {activeTab === 'mapView' && (
        <>
          <h2 className="text-3xl font-extrabold text-orange-700 mb-6">Dispensaries Map View</h2>
          <div className="mb-4 text-sm text-gray-600">
            <p>Viewing {dispensaries.length} {dispensaries.length === 1 ? 'dispensary' : 'dispensaries'} on the map</p>
            <div className="mt-2 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
                <span>Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></div>
                <span>Rejected</span>
              </div>
            </div>
          </div>
          <MapView dispensaries={dispensaries} />
        </>
      )}

      {activeTab === 'deals' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-extrabold text-orange-700 tracking-tight">
              Discounts
            </h2>
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-6 space-y-4 bg-white p-4 rounded-lg shadow">
            {/* Search Input */}
            <div>
              <label htmlFor="deal-search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Discounts
              </label>
              <div className="relative">
                <input
                  id="deal-search"
                  type="text"
                  value={dealSearchQuery}
                  onChange={(e) => setDealSearchQuery(e.target.value)}
                  placeholder="Search by title, description, brand, category, dispensary, user name or email..."
                  className="w-full border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 pl-10 rounded-lg"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {dealSearchQuery && (
                  <button
                    onClick={() => setDealSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category-filter"
                  value={dealCategoryFilter}
                  onChange={(e) => setDealCategoryFilter(e.target.value)}
                  className="w-full border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 rounded-lg"
                >
                  <option value="all">All Categories</option>
                  <option value="flower">Flower</option>
                  <option value="edibles">Edibles</option>
                  <option value="concentrates">Concentrates</option>
                  <option value="vapes">Vapes</option>
                  <option value="topicals">Topicals</option>
                  <option value="accessories">Accessories</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={dealStatusFilter}
                  onChange={(e) => setDealStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 rounded-lg"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="expired">Expired</option>
                  <option value="manually-activated">Manually Activated</option>
                </select>
              </div>

              {/* Dispensary Filter */}
              <div>
                <label htmlFor="dispensary-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Dispensary
                </label>
                <select
                  id="dispensary-filter"
                  value={dealDispensaryFilter}
                  onChange={(e) => setDealDispensaryFilter(e.target.value)}
                  className="w-full border border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 p-2 rounded-lg"
                >
                  <option value="all">All Dispensaries</option>
                  {dispensaries.map((disp) => (
                    <option key={disp._id} value={disp._id}>
                      {disp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Count */}
            {dealSearchQuery || dealCategoryFilter !== 'all' || dealStatusFilter !== 'all' || dealDispensaryFilter !== 'all' ? (
              <p className="text-sm text-gray-500">
                Showing {filteredDeals.length} of {deals.length} discounts
              </p>
            ) : null}
          </div>

          <AdminTable
            data={filteredDeals}
            columns={[
              {
                key: 'title',
                label: 'Title',
                width: '200px',
              },
              {
                key: 'dispensary',
                label: 'Dispensary',
                width: '180px',
                render: (deal: Deal) => {
                  const dispensary = typeof deal.dispensary === 'string' 
                    ? dispensaries.find(d => d._id === deal.dispensary)
                    : deal.dispensary;
                  return dispensary?.name || 'Unknown';
                },
              },
              {
                key: 'user',
                label: 'User',
                width: '200px',
                render: (deal: Deal) => {
                  const dispensary = typeof deal.dispensary === 'string' 
                    ? dispensaries.find(d => d._id === deal.dispensary)
                    : deal.dispensary;
                  const user = dispensary && typeof dispensary.user === 'object' 
                    ? dispensary.user 
                    : dispensary?.user 
                      ? users.find(u => u._id === dispensary.user)
                      : null;
                  
                  if (!user) return <span className="text-gray-400">N/A</span>;
                  
                  return (
                    <div className="text-sm">
                      <div className="font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-gray-500 text-xs">{user.email}</div>
                    </div>
                  );
                },
              },
              {
                key: 'price',
                label: 'Price',
                width: '120px',
                render: (deal: Deal) => (
                  <div className="flex flex-col">
                    {deal.originalPrice && (
                      <span className="line-through text-gray-400 text-xs">
                        ${Number(deal.originalPrice).toFixed(2)}
                      </span>
                    )}
                    <span className="text-green-600 font-semibold">
                      ${Number(deal.salePrice).toFixed(2)}
                    </span>
                  </div>
                ),
              },
              {
                key: 'category',
                label: 'Category',
                width: '120px',
                render: (deal: Deal) => (
                  <span className="capitalize">{deal.category || 'N/A'}</span>
                ),
              },
              // {
              //   key: 'accessType',
              //   label: 'Access Type',
              //   width: '120px',
              //   render: (deal: Deal) => {
              //     const type = deal.accessType === 'both' ? 'Med/Rec' : 
              //                 deal.accessType === 'medical' ? 'Medical' : 
              //                 deal.accessType === 'recreational' ? 'Recreational' : 'N/A';
              //     const bgColor = deal.accessType === 'medical' 
              //       ? 'bg-green-100 text-green-700'
              //       : deal.accessType === 'recreational'
              //       ? 'bg-blue-100 text-blue-700'
              //       : 'bg-gray-100 text-gray-700';
              //     return (
              //       <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bgColor}`}>
              //         {type}
              //       </span>
              //     );
              //   },
              // },
              {
                key: 'dates',
                label: 'Date Range',
                width: '200px',
                render: (deal: Deal) => {
                  const startDate = deal.startDate 
                    ? new Date(deal.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'N/A';
                  const endDate = deal.endDate 
                    ? new Date(deal.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'N/A';
                  return (
                    <div className="text-xs">
                      <div><strong>Start:</strong> {startDate}</div>
                      <div><strong>End:</strong> {endDate}</div>
                    </div>
                  );
                },
              },
              {
                key: 'status',
                label: 'Status',
                width: '100px',
                render: (deal: Deal) => {
                  const now = new Date();
                  const start = deal.startDate ? new Date(deal.startDate) : null;
                  const end = deal.endDate ? new Date(deal.endDate) : null;
                  
                  let status = 'Active';
                  let bgColor = 'bg-green-100 text-green-700';
                  
                  if (start && now < start) {
                    status = 'Upcoming';
                    bgColor = 'bg-blue-100 text-blue-700';
                  } else if (end && now > end) {
                    status = 'Expired';
                    bgColor = 'bg-red-100 text-red-700';
                  }
                  
                  return (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bgColor}`}>
                      {status}
                    </span>
                  );
                },
              },
            ]}
            actions={(deal: Deal) => (
              <div className="flex gap-2 flex-wrap">
                {/* <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleDealActivation(deal);
                  }}
                  className={`px-3 py-1 rounded cursor-pointer text-white text-sm ${
                    deal.manuallyActivated
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  title={deal.manuallyActivated ? 'Deactivate discount' : 'Activate discount'}
                >
                  {deal.manuallyActivated ? 'Inactive' : 'Active'}
                </button> */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditDeal(deal);
                  }}
                  className="px-3 py-1 rounded cursor-pointer bg-orange-500 hover:bg-orange-600 text-white text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm('Are you sure you want to delete this discount?')) return;
                    try {
                      const res = await axios.delete(
                        `${process.env.NEXT_PUBLIC_API_URL}/deals/${deal._id}`,
                        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                      );
                      if (res.data.success) {
                        setDeals(deals.filter((d) => d._id !== deal._id));
                      } else {
                        alert(res.data.message || 'Failed to delete discount.');
                      }
                    } catch (err) {
                      console.error('Error deleting discount:', err);
                      alert('Error deleting discount.');
                    }
                  }}
                  className="px-3 py-1 rounded cursor-pointer bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          />
        </>
      )}

      {activeTab === 'applications' && (
        <>
          <h2 className="text-3xl font-extrabold text-orange-700 mb-6">Applications</h2>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'pending', 'approved', 'rejected', 'archived'].map((status) => (
              <button
                key={status}
                className={`px-3 py-1 rounded-full text-sm font-semibold cursor-pointer ${
                  appStatusFilter === status
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setAppStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <AdminTable
            data={applications.filter((app) => {
              if (appStatusFilter === 'all') return true;
              if (appStatusFilter === 'archived') return app.isArchived;
              return app.status === appStatusFilter && !app.isArchived;
            })}
            columns={[
              {
                key: 'fullName',
                label: 'Contact Info',
                render: (app: Application) => `${app?.firstName || ''} ${app?.lastName || ''}`.trim(),
              },
              { key: 'email', label: 'Email' },
              {
                key: 'status',
                label: 'Status',
                render: (app: Application) => (
                  <div className="flex flex-col gap-1 w-25 items-center justify-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${app.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : app.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {app.status.toUpperCase()}
                    </span>
                    {app.isArchived && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                        ARCHIVED
                      </span>
                    )}
                  </div>
                ),
              },
              { key: 'dispensaryName', label: 'Dispensary' },
              { key: 'createdAt', label: 'Date of Application'}
            ]}
            actions={(app) => (
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded cursor-pointer text-white ${app.status === 'approved'
                    ? 'bg-red-600'
                    : 'bg-green-600'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (app.status === 'approved') {
                      handleRejectApplication(app._id);
                    } else {
                      handleApproveApplication(app._id);
                    }
                  }}
                >
                  {app.status === 'approved' ? 'Reject' : 'Approve'}
                </button>
                {app.status === 'rejected' && (
                  <button
                    className="px-3 py-1 rounded cursor-pointer bg-orange-500 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetApplication(app._id);
                    }}
                  >
                    Reset
                  </button>
                )}
                {app.isArchived ? (
                  <button
                    className="px-3 py-1 rounded cursor-pointer bg-blue-600 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnarchiveApplication(app._id);
                    }}
                  >
                    Unarchive
                  </button>
                ) : (
                  <button
                    className="px-3 py-1 rounded cursor-pointer bg-gray-600 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchiveApplication(app._id);
                    }}
                  >
                    Archive
                  </button>
                )}
              </div>
            )}
            onRowClick={handleViewApplication}
          />
        </>
      )}

      {activeTab === 'genericDispensaries' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="text-3xl font-extrabold text-orange-700">Generic Dispensaries</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddGenericModal(true)}
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 cursor-pointer transition"
              >
                + Add Row
              </button>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 cursor-pointer transition">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleGenericUpload}
                  disabled={genericUploading}
                />
                {genericUploading ? 'Uploading…' : 'Upload CSV or Excel'}
              </label>
            </div>
          </div>

          {/* Add Generic Dispensary Modal */}
          {showAddGenericModal && (
            <Modal isOpen={showAddGenericModal} onClose={() => setShowAddGenericModal(false)}>
              <div className="p-2 space-y-4">
                <h2 className="text-2xl font-extrabold text-orange-700 mb-4">Add Generic Dispensary</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    placeholder="Dispensary name"
                    value={newGenericData.name || ''}
                    onChange={(e) => setNewGenericData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:border-orange-500 focus:ring focus:ring-orange-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="Street address"
                    value={newGenericData.address?.street1 || ''}
                    onChange={(e) => setNewGenericData((prev) => ({ ...prev, address: { ...prev.address!, street1: e.target.value } }))}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:border-orange-500 focus:ring focus:ring-orange-200"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      placeholder="City"
                      value={newGenericData.address?.city || ''}
                      onChange={(e) => setNewGenericData((prev) => ({ ...prev, address: { ...prev.address!, city: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:border-orange-500 focus:ring focus:ring-orange-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      placeholder="State"
                      value={newGenericData.address?.state || ''}
                      onChange={(e) => setNewGenericData((prev) => ({ ...prev, address: { ...prev.address!, state: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:border-orange-500 focus:ring focus:ring-orange-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code *</label>
                    <input
                      type="text"
                      placeholder="Zip code"
                      value={newGenericData.address?.zipCode || ''}
                      onChange={(e) => setNewGenericData((prev) => ({ ...prev, address: { ...prev.address!, zipCode: e.target.value } }))}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:border-orange-500 focus:ring focus:ring-orange-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="Phone number"
                      value={newGenericData.phoneNumber || ''}
                      onChange={(e) => setNewGenericData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:border-orange-500 focus:ring focus:ring-orange-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="Email"
                      value={newGenericData.email || ''}
                      onChange={(e) => setNewGenericData((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:border-orange-500 focus:ring focus:ring-orange-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                    <input
                      type="text"
                      placeholder="License number"
                      value={newGenericData.licenseNumber || ''}
                      onChange={(e) => setNewGenericData((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:border-orange-500 focus:ring focus:ring-orange-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                    <input
                      type="text"
                      placeholder="Website URL"
                      value={newGenericData.websiteUrl || ''}
                      onChange={(e) => setNewGenericData((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:border-orange-500 focus:ring focus:ring-orange-200"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowAddGenericModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddGeneric}
                    disabled={addingGeneric}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {addingGeneric ? 'Adding…' : 'Add Dispensary'}
                  </button>
                </div>
              </div>
            </Modal>
          )}
          {genericUploadResult && (
            <div className="mb-4 p-4 rounded-lg bg-gray-100 border border-gray-200">
              <p className="text-sm text-gray-700">
                Imported: <strong>{genericUploadResult.imported}</strong> · Skipped (duplicates/invalid): <strong>{genericUploadResult.skipped}</strong>
              </p>
              {genericUploadResult.errors && genericUploadResult.errors.length > 0 && (
                <ul className="mt-2 text-sm text-amber-700 list-disc list-inside">
                  {genericUploadResult.errors.slice(0, 10).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                  {genericUploadResult.errors.length > 10 && (
                    <li>… and {genericUploadResult.errors.length - 10} more</li>
                  )}
                </ul>
              )}
            </div>
          )}
          {genericDispensariesLoading ? (
            <p className="text-gray-500">Loading generic dispensaries…</p>
          ) : (
            <AdminTable
              data={genericDispensaries}
              columns={[
                {
                  key: 'name',
                  label: 'Name',
                  render: (d: GenericDispensary) =>
                    editingGenericId === d._id ? (
                      <input
                        type="text"
                        value={editingGenericData.name || ''}
                        onChange={(e) => setEditingGenericData((prev) => ({ ...prev, name: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      d.name
                    ),
                },
                {
                  key: 'address',
                  label: 'Address',
                  render: (d: GenericDispensary) =>
                    editingGenericId === d._id ? (
                      <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          placeholder="Street"
                          value={editingGenericData.address?.street1 || ''}
                          onChange={(e) => setEditingGenericData((prev) => ({ ...prev, address: { ...prev.address!, street1: e.target.value } }))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="City"
                            value={editingGenericData.address?.city || ''}
                            onChange={(e) => setEditingGenericData((prev) => ({ ...prev, address: { ...prev.address!, city: e.target.value } }))}
                            className="w-1/2 border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={editingGenericData.address?.state || ''}
                            onChange={(e) => setEditingGenericData((prev) => ({ ...prev, address: { ...prev.address!, state: e.target.value } }))}
                            className="w-1/4 border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Zip"
                            value={editingGenericData.address?.zipCode || ''}
                            onChange={(e) => setEditingGenericData((prev) => ({ ...prev, address: { ...prev.address!, zipCode: e.target.value } }))}
                            className="w-1/4 border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      [d.address?.street1, d.address?.city, d.address?.state, d.address?.zipCode].filter(Boolean).join(', ')
                    ),
                },
                {
                  key: 'contact',
                  label: 'Contact',
                  render: (d: GenericDispensary) =>
                    editingGenericId === d._id ? (
                      <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          placeholder="Phone"
                          value={editingGenericData.phoneNumber || ''}
                          onChange={(e) => setEditingGenericData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={editingGenericData.email || ''}
                          onChange={(e) => setEditingGenericData((prev) => ({ ...prev, email: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    ) : (
                      d.phoneNumber || d.email || '—'
                    ),
                },
                {
                  key: 'licenseNumber',
                  label: 'License',
                  render: (d: GenericDispensary) =>
                    editingGenericId === d._id ? (
                      <input
                        type="text"
                        value={editingGenericData.licenseNumber || ''}
                        onChange={(e) => setEditingGenericData((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      d.licenseNumber || '—'
                    ),
                },
                {
                  key: 'websiteUrl',
                  label: 'Website',
                  render: (d: GenericDispensary) =>
                    editingGenericId === d._id ? (
                      <input
                        type="text"
                        value={editingGenericData.websiteUrl || ''}
                        onChange={(e) => setEditingGenericData((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      d.websiteUrl ? 'Yes' : '—'
                    ),
                },
                {
                  key: 'createdAt',
                  label: 'Added',
                  render: (d: GenericDispensary) =>
                    d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—',
                },
              ]}
              actions={(d) =>
                editingGenericId === d._id ? (
                  <div className="flex gap-2 items-start">
                    <button
                      className="px-3 h-8 rounded cursor-pointer bg-orange-500 hover:bg-orange-600 text-white text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveGeneric(d._id);
                      }}
                    >
                      Save
                    </button>
                    <button
                      className="px-3 h-8 rounded cursor-pointer bg-orange-500 hover:bg-orange-600 text-white text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGenericId(null);
                        setEditingGenericData({});
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-start">
                    <button
                      className="px-3 h-8 rounded cursor-pointer bg-orange-500 hover:bg-orange-600 text-white text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditGeneric(d);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 h-8 rounded cursor-pointer bg-red-600 hover:bg-red-700 text-white text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGeneric(d._id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )
              }
            />
          )}
        </>
      )}

      {showDealForm && selectedDeal && (
        <Modal isOpen={true} onClose={handleCancelForm}>
          <DealForm
            initialData={selectedDeal}
            onSave={handleSaveDeal}
            onCancel={handleCancelForm}
            dispensaryOptions={dispensaries.map(d => ({
              _id: d._id,
              name: d.name,
              isActive: d.isActive ?? false,
              isPurchased: d.isPurchased ?? false,
            }))}
            userId={
              typeof selectedDeal.dispensary === 'string'
                ? dispensaries.find(d => d._id === selectedDeal.dispensary)?.user || ''
                : selectedDeal.dispensary?.user || ''
            }
          />
        </Modal>
      )}
      {selectedApplication && (
        <ApplicationModal
          application={selectedApplication}
          isOpen={!!selectedApplication}
          onClose={handleCloseApplicationModal}
          onApprove={handleApproveApplication}
          onReject={handleRejectApplication}
        />
      )}

      {selectedDispensary && (
        <DispensaryModal
          dispensary={selectedDispensary}
          isOpen={!!selectedDispensary}
          onClose={handleCloseDispensaryModal}
          // onUpdateSubscription={handleUpdateSubscription}
          onUpdateExtraLimit={handleUpdateDispensaryExtraLimit}
        />
      )}

      {/* ADMIN ONLY - Analytics Tab */}
      {activeTab === 'analytics' && <Analytics />}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <Modal isOpen={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)}>
          <ChangePassword
            onSuccess={() => setShowChangePasswordModal(false)}
            onCancel={() => setShowChangePasswordModal(false)}
          />
        </Modal>
      )}
    </DashboardLayout>
  );
}
