'use client';

import { useAuth } from '@/context/AuthContext'; 
import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export type TabKey = 'overview' | 'deals' | 'dispensary' | 'user' | 'users' | 'adminOverview' | 'applications' | 'planSelection' | 'mapView' | 'analytics' | 'genericDispensaries';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: TabKey;
  onTabChange: (tabKey: TabKey) => void;
  isAdmin?: boolean;
}

export default function DashboardLayout({
  children,
  activeTab,
  onTabChange,
  isAdmin = false,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push(isAdmin ? '/admin-login' : '/partner-login');
  };

  const handleTabChange = (tabKey: TabKey) => {
    onTabChange(tabKey);
    setSidebarOpen(false); // Close sidebar on mobile when tab changes
  };

  return (
    <div className="flex min-h-screen bg-gray-100 w-full max-w-full overflow-x-hidden">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        isAdmin={isAdmin}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex flex-col flex-1 lg:ml-0 w-full max-w-full">
        <Topbar 
          partnerName={user?.name} 
          user={user}
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="p-4 sm:p-6 w-full max-w-full">{children}</main>
      </div>
    </div>
  );
}
