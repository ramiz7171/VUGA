'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ROUTE_MAP } from '@/lib/routes';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Warehouse,
  Receipt,
  BarChart3,
  Users,
  UsersRound,
  Settings,
  Languages,
  LogOut,
  X,
} from 'lucide-react';

const menuItems = [
  { key: 'dashboard', icon: LayoutDashboard, labelKey: 'dashboard' as const },
  { key: 'orders', icon: ShoppingCart, labelKey: 'orders' as const },
  { key: 'orderTracking', icon: ClipboardList, labelKey: 'orderTracking' as const },
  { key: 'inventory', icon: Warehouse, labelKey: 'inventory' as const },
  { key: 'expenses', icon: Receipt, labelKey: 'expenses' as const },
  { key: 'analytics', icon: BarChart3, labelKey: 'analytics' as const },
  { key: 'employees', icon: UsersRound, labelKey: 'employees' as const },
  { key: 'users', icon: Users, labelKey: 'users' as const },
  { key: 'settings', icon: Settings, labelKey: 'settings' as const },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const {
    t, darkMode, toggleDarkMode,
    language, setLanguage,
    userProfile, signOut, hasAccess,
  } = useApp();

  const pathname = usePathname();
  const router = useRouter();

  const filteredMenuItems = menuItems.filter((item) => hasAccess(item.key));

  const roleLabel = userProfile
    ? { admin: t('roleAdmin'), moderator: t('roleModerator'), user: t('roleUser') }[userProfile.role]
    : '';

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen w-64 flex flex-col bg-primary text-white z-50 transition-transform duration-300 ${
        open ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        {/* Logo + Mobile close button */}
        <div className="flex items-center justify-center px-6 py-6 border-b border-white/10 relative">
          <img src="/logo.png" alt="VUGA" className="h-20 w-auto" />
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 transition md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Controls Section — under logo */}
        {userProfile && (
          <div className="px-3 py-3 border-b border-white/10 space-y-2">
            {/* User info */}
            <div className="flex items-center gap-3 px-3 py-1.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userProfile.name}</p>
                <p className="text-xs text-white/50 truncate">{roleLabel}</p>
              </div>
            </div>

            {/* Language selector */}
            <button
              onClick={() => setLanguage(language === 'az' ? 'en' : 'az')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <Languages size={16} />
              {language === 'az' ? 'English' : 'Azərbaycan'}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <span>{t('darkMode')}</span>
              <div className={`w-9 h-5 rounded-full transition-colors relative ${darkMode ? 'bg-white/30' : 'bg-white/10'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const path = ROUTE_MAP[item.key]?.path || '/dashboard';
            const isActive = pathname === path;
            return (
              <Link
                key={item.key}
                href={path}
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-accent text-primary'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out — bottom */}
        <div className="px-3 pb-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all"
          >
            <LogOut size={18} />
            {t('signOutLabel')}
          </button>
        </div>
      </aside>
    </>
  );
}
