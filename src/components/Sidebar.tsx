'use client';

import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Warehouse,
  Receipt,
  BarChart3,
  Users,
  Sun,
  Moon,
  Languages,
  LogOut,
} from 'lucide-react';

const menuItems = [
  { key: 'dashboard', icon: LayoutDashboard, labelKey: 'dashboard' as const },
  { key: 'orders', icon: ShoppingCart, labelKey: 'orders' as const },
  { key: 'inventory', icon: Warehouse, labelKey: 'inventory' as const },
  { key: 'expenses', icon: Receipt, labelKey: 'expenses' as const },
  { key: 'analytics', icon: BarChart3, labelKey: 'analytics' as const },
  { key: 'users', icon: Users, labelKey: 'users' as const },
];

export default function Sidebar() {
  const {
    t, currentPage, setCurrentPage,
    darkMode, toggleDarkMode,
    language, setLanguage,
    userProfile, signOut, hasAccess,
  } = useApp();

  const filteredMenuItems = menuItems.filter((item) => hasAccess(item.key));

  const roleLabel = userProfile
    ? { admin: t('roleAdmin'), moderator: t('roleModerator'), user: t('roleUser') }[userProfile.role]
    : '';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-primary text-white z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <img src="/logo.png" alt="VUGA" className="h-30 w-auto" />
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {filteredMenuItems.map((item) => {
          const isActive = currentPage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setCurrentPage(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent text-primary'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {t(item.labelKey)}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      {userProfile && (
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userProfile.name}</p>
              <p className="text-xs text-white/50 truncate">{roleLabel}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="px-3 pb-4 space-y-1">
        <button
          onClick={() => setLanguage(language === 'az' ? 'en' : 'az')}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          <Languages size={18} />
          {language === 'az' ? 'English' : 'Azərbaycan'}
        </button>

        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {darkMode ? t('lightMode') : t('darkMode')}
        </button>

        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogOut size={18} />
          {t('signOutLabel')}
        </button>
      </div>
    </aside>
  );
}
