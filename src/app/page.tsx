'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/pages/Dashboard';
import Orders from '@/components/pages/Orders';
import Inventory from '@/components/pages/Inventory';
import Expenses from '@/components/pages/Expenses';
import Analytics from '@/components/pages/Analytics';
import AuthPage from '@/components/pages/AuthPage';
import UserManagement from '@/components/pages/UserManagement';
import OrderTracking from '@/components/pages/OrderTracking';
import Settings from '@/components/pages/Settings';
import { useApp } from '@/context/AppContext';
import { TranslationKey } from '@/lib/i18n';
import { Loader2, Menu } from 'lucide-react';

const pages: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  orders: Orders,
  orderTracking: OrderTracking,
  inventory: Inventory,
  expenses: Expenses,
  analytics: Analytics,
  users: UserManagement,
  settings: Settings,
};

export default function Home() {
  const { currentPage, user, userProfile, authLoading, t } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <AuthPage />;
  }

  const PageComponent = pages[currentPage] || Dashboard;

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-primary flex items-center px-4 z-30 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg text-white hover:bg-white/10 transition"
        >
          <Menu size={22} />
        </button>
        <span className="ml-3 text-white font-semibold text-sm">{t(currentPage as TranslationKey)}</span>
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-6 pt-20 md:pt-6 bg-[var(--bg)] min-h-screen">
        <PageComponent />
      </main>
    </div>
  );
}
