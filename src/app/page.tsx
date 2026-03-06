'use client';

import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/pages/Dashboard';
import Orders from '@/components/pages/Orders';
import Inventory from '@/components/pages/Inventory';
import Expenses from '@/components/pages/Expenses';
import Analytics from '@/components/pages/Analytics';
import { useApp } from '@/context/AppContext';

const pages: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  orders: Orders,
  inventory: Inventory,
  expenses: Expenses,
  analytics: Analytics,
};

export default function Home() {
  const { currentPage } = useApp();
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
