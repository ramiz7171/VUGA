'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Search, Shield, Plus, Pencil, Trash2, X, Loader2, Ban, CheckCircle } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  disabled: boolean;
  created_at: string;
}

const INPUT_CLASS = 'w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20';

export default function UserManagement() {
  const { t, userProfile } = useApp();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Create form
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('user');

  // Edit form
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('user');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  async function callAdminApi(body: Record<string, unknown>) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-manage-users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(body),
      }
    );
    return res.json();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    const result = await callAdminApi({
      action: 'create_user',
      email: createEmail,
      password: createPassword,
      name: createName,
      role: createRole,
    });
    setFormLoading(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setShowCreateModal(false);
    setCreateName(''); setCreateEmail(''); setCreatePassword(''); setCreateRole('user');
    fetchUsers();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setFormError('');
    setFormLoading(true);
    const result = await callAdminApi({
      action: 'update_user',
      userId: editingUser.id,
      name: editName,
      email: editEmail,
      role: editRole,
    });
    setFormLoading(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setShowEditModal(false);
    setEditingUser(null);
    fetchUsers();
  }

  async function handleToggleDisable(user: UserRow) {
    await callAdminApi({
      action: 'disable_user',
      userId: user.id,
      disabled: !user.disabled,
    });
    fetchUsers();
  }

  async function handleDelete(userId: string) {
    await callAdminApi({ action: 'delete_user', userId });
    setDeleteUserId(null);
    fetchUsers();
  }

  function openEdit(user: UserRow) {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setFormError('');
    setShowEditModal(true);
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
    const map: Record<string, string> = { admin: t('roleAdmin'), moderator: t('roleModerator'), user: t('roleUser') };
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
        <button
          onClick={() => { setFormError(''); setShowCreateModal(true); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus size={18} />
          {t('createUser')}
        </button>
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
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('status')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('date')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-[var(--text-secondary)]">{t('loading')}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-[var(--text-secondary)]">{t('noData')}</td></tr>
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
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      u.disabled
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {u.disabled ? t('disabled') : t('enabled')}
                    </span>
                  </td>
                  <td className="p-4 text-[var(--text-secondary)]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {u.id === userProfile.id ? (
                      <span className="text-xs text-[var(--text-secondary)]">—</span>
                    ) : (
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-accent transition" title={t('edit')}>
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleDisable(u)}
                          className={`p-1.5 rounded transition ${u.disabled ? 'hover:bg-green-100 text-green-600' : 'hover:bg-orange-100 text-orange-500'}`}
                          title={u.disabled ? t('enableUser') : t('disableUser')}
                        >
                          {u.disabled ? <CheckCircle size={16} /> : <Ban size={16} />}
                        </button>
                        <button onClick={() => setDeleteUserId(u.id)} className="p-1.5 rounded hover:bg-red-100 text-red-500 transition" title={t('delete')}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-[var(--card)] rounded-xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">{t('createUser')}</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
            </div>
            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('fullName')}</label>
                <input value={createName} onChange={(e) => setCreateName(e.target.value)} required className={INPUT_CLASS} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('email')}</label>
                <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required className={INPUT_CLASS} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('password')}</label>
                <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} required minLength={6} className={INPUT_CLASS} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('role')}</label>
                <select value={createRole} onChange={(e) => setCreateRole(e.target.value)} className={INPUT_CLASS}>
                  <option value="admin">{t('roleAdmin')}</option>
                  <option value="moderator">{t('roleModerator')}</option>
                  <option value="user">{t('roleUser')}</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-lg text-sm border border-[var(--border)] hover:bg-accent transition font-medium">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={formLoading}
                  className="px-6 py-2.5 rounded-lg text-sm bg-primary text-white font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2">
                  {formLoading && <Loader2 size={16} className="animate-spin" />}
                  {formLoading ? t('creatingUser') : t('createUser')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-[var(--card)] rounded-xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">{t('editUser')}</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
            </div>
            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('fullName')}</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} required className={INPUT_CLASS} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('email')}</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required className={INPUT_CLASS} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('role')}</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className={INPUT_CLASS}>
                  <option value="admin">{t('roleAdmin')}</option>
                  <option value="moderator">{t('roleModerator')}</option>
                  <option value="user">{t('roleUser')}</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-lg text-sm border border-[var(--border)] hover:bg-accent transition font-medium">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={formLoading}
                  className="px-6 py-2.5 rounded-lg text-sm bg-primary text-white font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2">
                  {formLoading && <Loader2 size={16} className="animate-spin" />}
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={!!deleteUserId}
        title={t('deleteUser')}
        message={t('deleteUserWarning')}
        variant="danger"
        confirmLabel={t('delete')}
        onConfirm={() => deleteUserId && handleDelete(deleteUserId)}
        onCancel={() => setDeleteUserId(null)}
      />
    </div>
  );
}
