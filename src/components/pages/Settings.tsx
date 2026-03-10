'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, Lock, Shield, Globe, Check, AlertCircle, LogOut, Plus, Trash2, Tag, MapPin } from 'lucide-react';

export default function Settings() {
  const { t, userProfile, refreshProfile, signOut } = useApp();

  // Account info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preferences
  const [currency, setCurrency] = useState('AZN');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security
  const [securityMsg, setSecurityMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Expense Types
  const [expenseTypes, setExpenseTypes] = useState<{ id: string; name: string }[]>([]);
  const [newExpenseType, setNewExpenseType] = useState('');
  const [expenseTypeMsg, setExpenseTypeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Order Sources
  const [orderSources, setOrderSources] = useState<{ id: string; name: string; value: string }[]>([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceValue, setNewSourceValue] = useState('');
  const [orderSourceMsg, setOrderSourceMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setEmail(userProfile.email || '');
      setPhone(userProfile.phone || '');
      setCurrency(userProfile.default_currency || 'AZN');
      setEmailNotifications(userProfile.email_notifications !== false);
    }
  }, [userProfile]);

  useEffect(() => {
    if (isAdmin) {
      fetchExpenseTypes();
      fetchOrderSources();
    }
  }, [isAdmin]);

  async function fetchExpenseTypes() {
    const { data } = await supabase.from('expense_types').select('*').order('created_at');
    if (data) setExpenseTypes(data);
  }

  async function fetchOrderSources() {
    const { data } = await supabase.from('order_sources').select('*').order('created_at');
    if (data) setOrderSources(data);
  }

  async function handleAddExpenseType() {
    if (!newExpenseType.trim()) return;
    setExpenseTypeMsg(null);
    const { error } = await supabase.from('expense_types').insert({ name: newExpenseType.trim() });
    if (error) {
      setExpenseTypeMsg({ type: 'error', text: error.message });
      return;
    }
    setNewExpenseType('');
    setExpenseTypeMsg({ type: 'success', text: t('profileUpdated') });
    fetchExpenseTypes();
  }

  async function handleDeleteExpenseType(id: string) {
    await supabase.from('expense_types').delete().eq('id', id);
    fetchExpenseTypes();
  }

  async function handleAddOrderSource() {
    if (!newSourceName.trim() || !newSourceValue.trim()) return;
    setOrderSourceMsg(null);
    const { error } = await supabase.from('order_sources').insert({ name: newSourceName.trim(), value: newSourceValue.trim().toLowerCase().replace(/\s+/g, '_') });
    if (error) {
      setOrderSourceMsg({ type: 'error', text: error.message });
      return;
    }
    setNewSourceName('');
    setNewSourceValue('');
    setOrderSourceMsg({ type: 'success', text: t('profileUpdated') });
    fetchOrderSources();
  }

  async function handleDeleteOrderSource(id: string) {
    await supabase.from('order_sources').delete().eq('id', id);
    fetchOrderSources();
  }

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const { error } = await supabase
        .from('users')
        .update({ name, email, phone })
        .eq('id', userProfile.id);
      if (error) throw error;
      await refreshProfile();
      setProfileMsg({ type: 'success', text: t('profileUpdated') });
    } catch {
      setProfileMsg({ type: 'error', text: t('authError') });
    }
    setSavingProfile(false);
  };

  const handleUpdatePassword = async () => {
    setPasswordMsg(null);
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: t('passwordMismatch') });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: t('passwordTooShort') });
      return;
    }
    setSavingPassword(true);
    try {
      // Verify current password by re-signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userProfile?.email || '',
        password: currentPassword,
      });
      if (signInError) {
        setPasswordMsg({ type: 'error', text: t('invalidCredentials') });
        setSavingPassword(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg({ type: 'success', text: t('passwordUpdated') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch {
      setPasswordMsg({ type: 'error', text: t('authError') });
    }
    setSavingPassword(false);
  };

  const handleLogoutAll = async () => {
    setSecurityMsg(null);
    try {
      await supabase.auth.signOut({ scope: 'global' });
      setSecurityMsg({ type: 'success', text: t('loggedOutAll') });
      setTimeout(() => signOut(), 1500);
    } catch {
      setSecurityMsg({ type: 'error', text: t('authError') });
    }
  };

  const handleSavePreferences = async () => {
    if (!userProfile) return;
    setSavingPrefs(true);
    setPrefsMsg(null);
    try {
      const { error } = await supabase
        .from('users')
        .update({ default_currency: currency, email_notifications: emailNotifications })
        .eq('id', userProfile.id);
      if (error) throw error;
      await refreshProfile();
      setPrefsMsg({ type: 'success', text: t('profileUpdated') });
    } catch {
      setPrefsMsg({ type: 'error', text: t('authError') });
    }
    setSavingPrefs(false);
  };

  const MessageBanner = ({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) => {
    if (!msg) return null;
    return (
      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
        msg.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
      }`}>
        {msg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
        {msg.text}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('settings')}</h1>

      {/* Account Information */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">{t('accountInfo')}</h2>
        </div>

        <MessageBanner msg={profileMsg} />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('fullName')}</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-[var(--border)] rounded-lg pl-10 pr-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('email')}</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[var(--border)] rounded-lg pl-10 pr-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('phoneNumber')}</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+994 XX XXX XX XX"
                className="w-full border border-[var(--border)] rounded-lg pl-10 pr-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {savingProfile ? t('savingChanges') : t('saveChanges')}
        </button>
      </div>

      {/* Change Password */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">{t('changePassword')}</h2>
        </div>

        <MessageBanner msg={passwordMsg} />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('currentPassword')}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full border border-[var(--border)] rounded-lg pl-10 pr-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('newPassword')}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full border border-[var(--border)] rounded-lg pl-10 pr-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('confirmNewPassword')}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full border border-[var(--border)] rounded-lg pl-10 pr-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleUpdatePassword}
          disabled={savingPassword || !currentPassword || !newPassword || !confirmNewPassword}
          className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {savingPassword ? t('updatingPassword') : t('updatePassword')}
        </button>
      </div>

      {/* Security */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">{t('security')}</h2>
        </div>

        <MessageBanner msg={securityMsg} />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t('logoutAllDevices')}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t('logoutAllDevicesDesc')}</p>
          </div>
          <button
            onClick={handleLogoutAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20 transition"
          >
            <LogOut size={16} />
            {t('logoutAllDevices')}
          </button>
        </div>
      </div>

      {/* Account Preferences */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">{t('accountPreferences')}</h2>
        </div>

        <MessageBanner msg={prefsMsg} />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('defaultCurrency')}</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="AZN">AZN - Azerbaijani Manat</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="TRY">TRY - Turkish Lira</option>
              <option value="RUB">RUB - Russian Ruble</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t('emailNotifications')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('emailNotificationsDesc')}</p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                emailNotifications ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  emailNotifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={handleSavePreferences}
          disabled={savingPrefs}
          className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {savingPrefs ? t('savingChanges') : t('saveChanges')}
        </button>
      </div>

      {/* Expense Types Management (Admin only) */}
      {isAdmin && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag size={20} className="text-primary" />
            <div>
              <h2 className="text-lg font-semibold">{t('expenseTypes')}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{t('manageExpenseTypes')}</p>
            </div>
          </div>

          <MessageBanner msg={expenseTypeMsg} />

          <div className="flex gap-2">
            <input
              value={newExpenseType}
              onChange={(e) => setNewExpenseType(e.target.value)}
              placeholder={t('typeName')}
              onKeyDown={(e) => e.key === 'Enter' && handleAddExpenseType()}
              className="flex-1 border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            <button
              onClick={handleAddExpenseType}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition"
            >
              <Plus size={16} />
              {t('addExpenseType')}
            </button>
          </div>

          <div className="space-y-2">
            {expenseTypes.map((et) => (
              <div key={et.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]">
                <span className="text-sm">{et.name}</span>
                <button
                  onClick={() => handleDeleteExpenseType(et.id)}
                  className="p-1.5 rounded hover:bg-red-100 text-red-500 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {expenseTypes.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4">{t('noData')}</p>
            )}
          </div>
        </div>
      )}

      {/* Order Sources Management (Admin only) */}
      {isAdmin && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={20} className="text-primary" />
            <div>
              <h2 className="text-lg font-semibold">{t('orderSources')}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{t('manageOrderSources')}</p>
            </div>
          </div>

          <MessageBanner msg={orderSourceMsg} />

          <div className="flex gap-2">
            <input
              value={newSourceName}
              onChange={(e) => { setNewSourceName(e.target.value); if (!newSourceValue || newSourceValue === newSourceName.trim().toLowerCase().replace(/\s+/g, '_')) setNewSourceValue(e.target.value.trim().toLowerCase().replace(/\s+/g, '_')); }}
              placeholder={t('sourceName')}
              className="flex-1 border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            <input
              value={newSourceValue}
              onChange={(e) => setNewSourceValue(e.target.value)}
              placeholder={t('sourceValue')}
              className="flex-1 border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            <button
              onClick={handleAddOrderSource}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition"
            >
              <Plus size={16} />
              {t('addSource')}
            </button>
          </div>

          <div className="space-y-2">
            {orderSources.map((src) => (
              <div key={src.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]">
                <div>
                  <span className="text-sm font-medium">{src.name}</span>
                  <span className="text-xs text-[var(--text-secondary)] ml-2">({src.value})</span>
                </div>
                <button
                  onClick={() => handleDeleteOrderSource(src.id)}
                  className="p-1.5 rounded hover:bg-red-100 text-red-500 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {orderSources.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4">{t('noData')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
