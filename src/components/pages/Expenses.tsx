'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface Expense {
  id: string;
  category: string;
  amount: number;
  note: string;
  created_by: string;
  date: string;
}

const CATEGORIES = ['advertising', 'salary', 'logistics', 'officeSupplies', 'other'] as const;

export default function Expenses() {
  const { t, userProfile } = useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [createdBy, setCreatedBy] = useState('');
  const [category, setCategory] = useState('advertising');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => { fetchData(); }, []);

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-lg font-semibold">{t('accessDenied')}</p>
        <p className="text-sm text-[var(--text-secondary)]">{t('noPermission')}</p>
      </div>
    );
  }

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (error) { setTimeout(() => fetchData(), 2000); return; }
    setExpenses(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    await supabase.from('expenses').insert({
      date,
      created_by: createdBy,
      category,
      amount: Number(amount),
      note,
    });
    setAmount('');
    setNote('');
    setCreatedBy('');
    fetchData();
  }

  async function handleDelete(id: string) {
    await supabase.from('expenses').delete().eq('id', id);
    setDeleteId(null);
    fetchData();
  }

  const categoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      advertising: t('advertising'),
      salary: t('salary'),
      logistics: t('logistics'),
      officeSupplies: t('officeSupplies'),
      other: t('other'),
    };
    return map[cat] || cat;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('expenses')}</h1>

      {/* Add Expense Form */}
      <div className="bg-[var(--card)] rounded-xl p-5 border border-[var(--border)] shadow-sm">
        <h2 className="text-sm font-semibold mb-4 text-[var(--text-secondary)]">{t('addExpense')}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('date')}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('enteredBy')}</label>
            <input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} placeholder={t('name')}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('expenseType')}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20">
              {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('amount')}</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={0} step="0.01" required placeholder="0.00"
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('notes')}</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('description')}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <button type="submit"
            className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition">
            <Plus size={18} />
            {t('addExpense')}
          </button>
        </form>
      </div>

      {/* Expense History */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm overflow-x-auto">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)]">{t('expenseHistory')}</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('date')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('enteredBy')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('expenseType')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('amount')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('notes')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-[var(--text-secondary)]">{t('loading')}</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-[var(--text-secondary)]">{t('noData')}</td></tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id} className="border-b border-[var(--border)] hover:bg-accent/30 transition">
                  <td className="p-4">{exp.date}</td>
                  <td className="p-4">{exp.created_by || '-'}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-primary">
                      {categoryLabel(exp.category)}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-red-500">₼{Number(exp.amount).toLocaleString()}</td>
                  <td className="p-4 text-[var(--text-secondary)]">{exp.note || '-'}</td>
                  <td className="p-4">
                    <button onClick={() => setDeleteId(exp.id)} className="p-1.5 rounded hover:bg-red-100 text-red-500 transition" title={t('delete')}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={!!deleteId}
        title={t('delete')}
        message={t('deleteWarning')}
        variant="danger"
        confirmLabel={t('delete')}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
