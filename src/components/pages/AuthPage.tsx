'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import SignIn from './SignIn';
import SignUp from './SignUp';
import { Languages, Sun, Moon } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const { language, setLanguage, darkMode, toggleDarkMode } = useApp();

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 relative">
      {/* Top controls */}
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
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-bold text-2xl text-white shadow-lg">
            V
          </div>
          <span className="text-2xl font-bold tracking-wide">VUGA</span>
        </div>

        {mode === 'signin' ? (
          <SignIn onSwitchToSignUp={() => setMode('signup')} />
        ) : (
          <SignUp onSwitchToSignIn={() => setMode('signin')} />
        )}
      </div>
    </div>
  );
}
