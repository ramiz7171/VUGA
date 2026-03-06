'use client';

import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/pages/Dashboard';
import Orders from '@/components/pages/Orders';
import Inventory from '@/components/pages/Inventory';
import Expenses from '@/components/pages/Expenses';
import Analytics from '@/components/pages/Analytics';
import AuthPage from '@/components/pages/AuthPage';
import UserManagement from '@/components/pages/UserManagement';
import { useApp } from '@/context/AppContext';
import { Loader2 } from 'lucide-react';

const pages: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  orders: Orders,
  inventory: Inventory,
  expenses: Expenses,
  analytics: Analytics,
  users: UserManagement,
};

export default function Home() {
  const { currentPage, user, userProfile, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-bold text-2xl text-white">
            V
          </div>
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
      <Sidebar />
      <main className="flex-1 ml-64 p-6 bg-[var(--bg)] min-h-screen">
        <PageComponent />
      </main>
    </div>
  );
}
