'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Package } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  color: string;
  selling_price: number;
  updated_at: string;
}

export default function Inventory() {
  const { t, userProfile } = useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Form
  const [name, setName] = useState('');
  const [stockQty, setStockQty] = useState(0);
  const [color, setColor] = useState('');
  const [productValue, setProductValue] = useState(0);

  useEffect(() => { fetchProducts(); }, []);

  if (!userProfile || !['admin', 'moderator'].includes(userProfile.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-lg font-semibold">{t('accessDenied')}</p>
        <p className="text-sm text-[var(--text-secondary)]">{t('noPermission')}</p>
      </div>
    );
  }

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      setProducts(data || []);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  }

  function resetForm() {
    setName(''); setStockQty(0); setColor(''); setProductValue(0); setEditing(null);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setName(p.name);
    setStockQty(p.stock_quantity);
    setColor(p.color || '');
    setProductValue(Number(p.selling_price));
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      stock_quantity: stockQty,
      color,
      selling_price: productValue,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('products').insert(payload);
    }
    resetForm();
    setShowForm(false);
    fetchProducts();
  }

  async function handleDelete(id: string) {
    await supabase.from('products').delete().eq('id', id);
    setDeleteId(null);
    fetchProducts();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('inventory')}</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition">
          <Plus size={18} />
          {t('addNewProduct')}
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('productName')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('quantity')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('color')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('productValue')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('lastUpdated')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-[var(--text-secondary)]">{t('loading')}</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-[var(--text-secondary)]">
                <div className="flex flex-col items-center gap-2">
                  <Package size={40} className="text-[var(--text-secondary)]" />
                  {t('noData')}
                </div>
              </td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)] hover:bg-accent/30 transition">
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4">
                    <span className={`font-medium ${p.stock_quantity <= 5 ? 'text-red-500' : ''}`}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="p-4">{p.color || '-'}</td>
                  <td className="p-4">₼{Number(p.selling_price).toLocaleString()}</td>
                  <td className="p-4 text-[var(--text-secondary)]">{new Date(p.updated_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-accent transition" title={t('edit')}>
                        <Pencil size={16} />
                      </button>
                      {userProfile?.role === 'admin' && (
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded hover:bg-red-100 text-red-500 transition" title={t('delete')}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="bg-[var(--card)] rounded-xl p-6 max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">{editing ? t('editProduct') : t('addNewProduct')}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('productName')} required
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('quantity')}</label>
                  <input type="number" value={stockQty} onChange={(e) => setStockQty(Number(e.target.value))} min={0}
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('color')}</label>
                  <input value={color} onChange={(e) => setColor(e.target.value)} placeholder={t('color')}
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('productValue')}</label>
                  <input type="number" value={productValue} onChange={(e) => setProductValue(Number(e.target.value))} min={0} step="0.01"
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-3">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2.5 rounded-lg text-sm border border-[var(--border)] hover:bg-accent transition">{t('cancel')}</button>
                <button type="submit"
                  className="px-6 py-2.5 rounded-lg text-sm bg-primary text-white font-medium hover:opacity-90 transition">{editing ? t('save') : t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
