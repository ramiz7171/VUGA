'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import AuthPage from '@/components/pages/AuthPage';
import { getPathFromKey } from '@/lib/routes';
import { Loader2 } from 'lucide-react';

const DEFAULT_PAGE: Record<string, string> = {
  admin: 'dashboard',
  moderator: 'dashboard',
  user: 'orders',
};

export default function Home() {
  const { user, userProfile, authLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user || !userProfile) return;
    const defaultKey = DEFAULT_PAGE[userProfile.role] || 'orders';
    router.replace(getPathFromKey(defaultKey));
  }, [authLoading, user, userProfile, router]);

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

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-primary" />
    </div>
  );
}
