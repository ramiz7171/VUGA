'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import AuthPage from '@/components/pages/AuthPage';
import { getPageKeyFromPath, getPathFromKey } from '@/lib/routes';
import { TranslationKey } from '@/lib/i18n';
import { Loader2, Menu } from 'lucide-react';

const DEFAULT_PAGE: Record<string, string> = {
  admin: 'dashboard',
  moderator: 'dashboard',
  user: 'orders',
};

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, authLoading, t, hasAccess } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const pageKey = getPageKeyFromPath(pathname);

  // Redirect if user doesn't have access to this route
  useEffect(() => {
    if (authLoading || !user || !userProfile) return;
    if (!hasAccess(pageKey)) {
      const defaultKey = DEFAULT_PAGE[userProfile.role] || 'orders';
      router.replace(getPathFromKey(defaultKey));
    }
  }, [pathname, authLoading, user, userProfile, pageKey, hasAccess, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !userProfile) {
    return <AuthPage />;
  }

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
        <span className="ml-3 text-white font-semibold text-sm">
          {t(pageKey as TranslationKey)}
        </span>
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-6 pt-20 md:pt-6 bg-[var(--bg)] min-h-screen">
        {hasAccess(pageKey) ? children : null}
      </main>
    </div>
  );
}
