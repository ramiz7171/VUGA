'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, X, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  stock_quantity: number;
  purchase_price: number;
  selling_price: number;
  image_url: string;
  updated_at: string;
}

export default function Inventory() {
  const { t } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [stockModal, setStockModal] = useState<{ product: Product; type: 'increase' | 'decrease' } | null>(null);
  const [stockAmount, setStockAmount] = useState(1);
  const [loading, setLoading] = useState(true);

  // Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [stockQty, setStockQty] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }

  function resetForm() {
    setName(''); setCategory(''); setStockQty(0); setPurchasePrice(0); setSellingPrice(0); setEditing(null);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setName(p.name);
    setCategory(p.category || '');
    setStockQty(p.stock_quantity);
    setPurchasePrice(Number(p.purchase_price));
    setSellingPrice(Number(p.selling_price));
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name, category, stock_quantity: stockQty, purchase_price: purchasePrice, selling_price: sellingPrice, updated_at: new Date().toISOString() };

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
    if (!confirm(t('deleteConfirm'))) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  }

  async function handleStockChange() {
    if (!stockModal) return;
    const newQty = stockModal.type === 'increase'
      ? stockModal.product.stock_quantity + stockAmount
      : Math.max(0, stockModal.product.stock_quantity - stockAmount);

    await supabase.from('products').update({ stock_quantity: newQty, updated_at: new Date().toISOString() }).eq('id', stockModal.product.id);
    setStockModal(null);
    setStockAmount(1);
    fetchProducts();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('inventory')}</h1>
        <div className="flex gap-2">
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition">
            <Plus size={18} />
            {t('addNewProduct')}
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('productName')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('category')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('stockQuantity')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('purchasePrice')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('sellingPrice')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('lastUpdated')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-[var(--text-secondary)]">{t('loading')}</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-[var(--text-secondary)]">
                <div className="flex flex-col items-center gap-2">
                  <Package size={40} className="text-[var(--text-secondary)]" />
                  {t('noData')}
                </div>
              </td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)] hover:bg-accent/30 transition">
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4">{p.category || '-'}</td>
                  <td className="p-4">
                    <span className={`font-medium ${p.stock_quantity <= 5 ? 'text-red-500' : ''}`}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="p-4">₼{Number(p.purchase_price).toLocaleString()}</td>
                  <td className="p-4">₼{Number(p.selling_price).toLocaleString()}</td>
                  <td className="p-4 text-[var(--text-secondary)]">{new Date(p.updated_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <button onClick={() => setStockModal({ product: p, type: 'increase' })} className="p-1.5 rounded hover:bg-green-100 text-green-600 transition" title={t('increaseStock')}>
                        <ArrowUp size={16} />
                      </button>
                      <button onClick={() => setStockModal({ product: p, type: 'decrease' })} className="p-1.5 rounded hover:bg-orange-100 text-orange-600 transition" title={t('decreaseStock')}>
                        <ArrowDown size={16} />
                      </button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-accent transition" title={t('edit')}>
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-100 text-red-500 transition" title={t('delete')}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stock Modal */}
      {stockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setStockModal(null)}>
          <div className="bg-[var(--card)] rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{stockModal.type === 'increase' ? t('increaseStock') : t('decreaseStock')}</h2>
              <button onClick={() => setStockModal(null)} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-3">{stockModal.product.name} — {t('stockQuantity')}: {stockModal.product.stock_quantity}</p>
            <input type="number" value={stockAmount} onChange={(e) => setStockAmount(Number(e.target.value))} min={1}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] mb-4 outline-none focus:ring-2 focus:ring-primary/20" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setStockModal(null)} className="px-4 py-2 rounded-lg text-sm border border-[var(--border)] hover:bg-accent transition">{t('cancel')}</button>
              <button onClick={handleStockChange} className="px-4 py-2 rounded-lg text-sm bg-primary text-white font-medium hover:opacity-90 transition">{t('confirm')}</button>
            </div>
          </div>
        </div>
      )}

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
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('category')}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20" />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('stockQuantity')}</label>
                  <input type="number" value={stockQty} onChange={(e) => setStockQty(Number(e.target.value))} min={0}
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('purchasePrice')}</label>
                  <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value))} min={0} step="0.01"
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('sellingPrice')}</label>
                  <input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(Number(e.target.value))} min={0} step="0.01"
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
    </div>
  );
}
