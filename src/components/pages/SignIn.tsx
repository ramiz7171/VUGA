'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { User, Lock, Loader2 } from 'lucide-react';

export default function SignIn() {
  const { t, signIn } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const email = username.includes('@') ? username : `${username}@vugacrm.com`;
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--card)] rounded-xl p-8 border border-[var(--border)] shadow-sm">
      <h2 className="text-xl font-bold text-center mb-6">{t('signIn')}</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">{t('username')}</label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="istifadəçi adı"
              className="w-full border border-[var(--border)] rounded-lg pl-10 pr-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">{t('password')}</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full border border-[var(--border)] rounded-lg pl-10 pr-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? t('signingIn') : t('signIn')}
        </button>
      </form>

    </div>
  );
}
