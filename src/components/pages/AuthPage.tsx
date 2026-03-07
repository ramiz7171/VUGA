'use client';

import { useApp } from '@/context/AppContext';
import SignIn from './SignIn';
import { Languages, Sun, Moon } from 'lucide-react';

export default function AuthPage() {
  const { language, setLanguage, darkMode, toggleDarkMode } = useApp();

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 relative">
      <div className="fixed top-4 right-4 flex items-center gap-2">
        <button
          onClick={() => setLanguage(language === 'az' ? 'en' : 'az')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[var(--card)] border border-[var(--border)] hover:bg-accent transition"
        >
          <Languages size={16} />
          {language === 'az' ? 'EN' : 'AZ'}
        </button>
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[var(--card)] border border-[var(--border)] hover:bg-accent transition"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <img src="/logo.png" alt="VUGA" className="h-12 w-auto invert dark:invert-0" />
        </div>
        <SignIn />
      </div>
    </div>
  );
}
