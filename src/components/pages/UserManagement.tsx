'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Search, Shield } from 'lucide-react';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UserManagement() {
  const { t, userProfile } = useApp();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  async function changeRole(userId: string, newRole: string) {
    await supabase.from('users').update({ role: newRole }).eq('id', userId);
    fetchUsers();
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--text-secondary)]">{t('noPermission')}</p>
      </div>
    );
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      admin: t('roleAdmin'),
      moderator: t('roleModerator'),
      user: t('roleUser'),
    };
    return map[role] || role;
  };

  const roleBadgeColor = (role: string) => {
    const map: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      moderator: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      user: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };
    return map[role] || '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-primary" />
          <h1 className="text-2xl font-bold">{t('userManagement')}</h1>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchUsers')}
          className="w-full border border-[var(--border)] rounded-lg pl-10 pr-3 py-2.5 text-sm bg-[var(--card)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('name')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('email')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('role')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('date')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('changeRole')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]">
                  {t('loading')}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]">
                  {t('noData')}
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)] hover:bg-accent/30 transition">
                  <td className="p-4 font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      {u.name || '-'}
                    </div>
                  </td>
                  <td className="p-4 text-[var(--text-secondary)]">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleBadgeColor(u.role)}`}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="p-4 text-[var(--text-secondary)]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {u.id === userProfile.id ? (
                      <span className="text-xs text-[var(--text-secondary)]">—</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="admin">{t('roleAdmin')}</option>
                        <option value="moderator">{t('roleModerator')}</option>
                        <option value="user">{t('roleUser')}</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
