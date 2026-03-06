'use client';

import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Warehouse,
  Receipt,
  BarChart3,
  Sun,
  Moon,
  Languages,
} from 'lucide-react';

const menuItems = [
  { key: 'dashboard', icon: LayoutDashboard, labelKey: 'dashboard' as const },
  { key: 'orders', icon: ShoppingCart, labelKey: 'orders' as const },
  { key: 'inventory', icon: Warehouse, labelKey: 'inventory' as const },
  { key: 'expenses', icon: Receipt, labelKey: 'expenses' as const },
  { key: 'analytics', icon: BarChart3, labelKey: 'analytics' as const },
];

export default function Sidebar() {
  const { t, currentPage, setCurrentPage, darkMode, toggleDarkMode, language, setLanguage } = useApp();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-primary text-white z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xl">
          V
        </div>
        <span className="text-xl font-bold tracking-wide">VUGA</span>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menuItems.map((item) => {
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

      {/* Bottom controls */}
      <div className="px-3 pb-4 space-y-2">
        {/* Language toggle */}
        <button
          onClick={() => setLanguage(language === 'az' ? 'en' : 'az')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          <Languages size={20} />
          {language === 'az' ? 'English' : 'Azərbaycan'}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          {darkMode ? t('lightMode') : t('darkMode')}
        </button>
      </div>
    </aside>
  );
}
