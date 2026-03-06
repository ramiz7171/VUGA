'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Mail, Lock, User, Loader2, CheckCircle } from 'lucide-react';

interface SignUpProps {
  onSwitchToSignIn: () => void;
}

export default function SignUp({ onSwitchToSignIn }: SignUpProps) {
  const { t, signUp } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPwd) {
      setError(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    const { error: err } = await signUp(email, password, name);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-[var(--card)] rounded-xl p-8 border border-[var(--border)] shadow-sm text-center">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">{t('signUpSuccess')}</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {t('signUpSuccess')}
        </p>
        <button
          onClick={onSwitchToSignIn}
          className="text-primary font-medium hover:underline text-sm"
        >
          {t('signIn')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] rounded-xl p-8 border border-[var(--border)] shadow-sm">
      <h2 className="text-xl font-bold text-center mb-6">{t('signUp')}</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">{t('fullName')}</label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={t('fullName')}
              className="w-full border border-[var(--border)] rounded-lg pl-10 pr-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">{t('email')}</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
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
              minLength={6}
              placeholder="••••••••"
              className="w-full border border-[var(--border)] rounded-lg pl-10 pr-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">{t('confirmPassword')}</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
              minLength={6}
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
          {loading ? t('signingUp') : t('signUp')}
        </button>
      </form>

      <p className="text-sm text-center mt-6 text-[var(--text-secondary)]">
        {t('haveAccount')}{' '}
        <button onClick={onSwitchToSignIn} className="text-primary font-medium hover:underline">
          {t('signIn')}
        </button>
      </p>
    </div>
  );
}
