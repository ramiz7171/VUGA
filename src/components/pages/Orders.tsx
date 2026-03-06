'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Plus, Eye, Pencil, Trash2, X } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface Order {
  id: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes: string;
  product_type: string;
  product_image_url: string;
  order_date: string;
  customer?: { name: string; phone: string; address: string };
  product?: { name: string };
}


interface Product {
  id: string;
  name: string;
  selling_price: number;
  category: string;
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-gray-200 text-gray-700',
  started: 'bg-blue-100 text-blue-700',
  finished: 'bg-green-100 text-green-700',
  paid: 'bg-purple-100 text-purple-700',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-700',
  partially_paid: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
};

export default function Orders() {
  const { t, user, userProfile } = useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productType, setProductType] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderStatus, setOrderStatus] = useState('not_started');

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, customer:customers(*), product:products(name)')
      .order('order_date', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*');
    setProducts(data || []);
  }

  function resetForm() {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerNotes('');
    setSelectedProduct('');
    setProductType('');
    setQty(1);
    setPrice(0);
    setPaymentMethod('cash');
    setOrderStatus('not_started');
    setEditingOrder(null);
  }

  function openEdit(order: Order) {
    setEditingOrder(order);
    setCustomerName(order.customer?.name || '');
    setCustomerPhone(order.customer?.phone || '');
    setCustomerAddress(order.customer?.address || '');
    setCustomerNotes(order.notes || '');
    setSelectedProduct(order.product_id || '');
    setProductType(order.product_type || '');
    setQty(order.quantity);
    setPrice(order.total_price);
    setPaymentMethod(order.payment_method);
    setOrderStatus(order.status);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingOrder) {
      // Update order
      await supabase
        .from('orders')
        .update({
          quantity: qty,
          total_price: price,
          payment_method: paymentMethod,
          status: orderStatus,
          payment_status: orderStatus === 'paid' ? 'paid' : 'unpaid',
          notes: customerNotes,
          product_type: productType,
        })
        .eq('id', editingOrder.id);

      // Update customer
      if (editingOrder.customer_id) {
        await supabase
          .from('customers')
          .update({ name: customerName, phone: customerPhone, address: customerAddress })
          .eq('id', editingOrder.customer_id);
      }
    } else {
      // Create customer
      const { data: customer } = await supabase
        .from('customers')
        .insert({ name: customerName, phone: customerPhone, address: customerAddress })
        .select()
        .single();

      if (customer) {
        await supabase.from('orders').insert({
          customer_id: customer.id,
          product_id: selectedProduct || null,
          quantity: qty,
          total_price: price,
          payment_method: paymentMethod,
          status: orderStatus,
          payment_status: orderStatus === 'paid' ? 'paid' : 'unpaid',
          notes: customerNotes,
          product_type: productType,
          created_by: user?.id,
        });
      }
    }

    resetForm();
    setShowForm(false);
    fetchOrders();
  }

  async function handleDelete(id: string) {
    await supabase.from('orders').delete().eq('id', id);
    setDeleteId(null);
    fetchOrders();
  }

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      not_started: t('notStarted'),
      started: t('started'),
      finished: t('finished'),
      paid: t('paid'),
    };
    return map[s] || s;
  };

  const paymentLabel = (s: string) => {
    const map: Record<string, string> = {
      cash: t('cash'),
      card: t('card'),
      bank_transfer: t('bankTransfer'),
    };
    return map[s] || s;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('orders')}</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus size={18} />
          {t('createNewOrder')}
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('date')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('customerName')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('phone')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('productName')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('quantity')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('totalPrice')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('status')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('paymentStatus')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-8 text-center text-[var(--text-secondary)]">{t('loading')}</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={9} className="p-8 text-center text-[var(--text-secondary)]">{t('noData')}</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-[var(--border)] hover:bg-accent/30 transition">
                  <td className="p-4">{new Date(order.order_date).toLocaleDateString()}</td>
                  <td className="p-4 font-medium">{order.customer?.name || '-'}</td>
                  <td className="p-4">{order.customer?.phone || '-'}</td>
                  <td className="p-4">{order.product?.name || '-'}</td>
                  <td className="p-4">{order.quantity}</td>
                  <td className="p-4 font-medium">₼{Number(order.total_price).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || ''}`}>
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[order.payment_status] || ''}`}>
                      {order.payment_status === 'paid' ? t('paid') : t('unpaid')}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <button onClick={() => setViewingOrder(order)} className="p-1.5 rounded hover:bg-accent transition" title={t('view')}>
                        <Eye size={16} />
                      </button>
                      <button onClick={() => openEdit(order)} className="p-1.5 rounded hover:bg-accent transition" title={t('edit')}>
                        <Pencil size={16} />
                      </button>
                      {userProfile?.role !== 'user' && (
                        <button onClick={() => setDeleteId(order.id)} className="p-1.5 rounded hover:bg-red-100 text-red-500 transition" title={t('delete')}>
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

      {/* View Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingOrder(null)}>
          <div className="bg-[var(--card)] rounded-xl p-6 max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{t('view')} - {viewingOrder.customer?.name}</h2>
              <button onClick={() => setViewingOrder(null)} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-[var(--text-secondary)]">{t('customerName')}:</span> <span className="font-medium">{viewingOrder.customer?.name}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('phone')}:</span> <span className="font-medium">{viewingOrder.customer?.phone}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('address')}:</span> <span className="font-medium">{viewingOrder.customer?.address}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('productName')}:</span> <span className="font-medium">{viewingOrder.product?.name}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('quantity')}:</span> <span className="font-medium">{viewingOrder.quantity}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('totalPrice')}:</span> <span className="font-medium">₼{Number(viewingOrder.total_price).toLocaleString()}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('paymentMethod')}:</span> <span className="font-medium">{paymentLabel(viewingOrder.payment_method)}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('status')}:</span> <span className="font-medium">{statusLabel(viewingOrder.status)}</span></div>
              </div>
              {viewingOrder.notes && (
                <div><span className="text-[var(--text-secondary)]">{t('notes')}:</span> <p className="mt-1">{viewingOrder.notes}</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="bg-[var(--card)] rounded-xl p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">{editingOrder ? t('edit') : t('createNewOrder')}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">{t('customerInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={t('customerName')} required
                    className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder={t('customerPhone')}
                    className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder={t('customerAddress')}
                    className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none md:col-span-2" />
                </div>
              </div>

              {/* Product Info */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">{t('productInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select value={selectedProduct} onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    const p = products.find((p) => p.id === e.target.value);
                    if (p) setPrice(Number(p.selling_price) * qty);
                  }}
                    className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                    <option value="">{t('productName')}</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input value={productType} onChange={(e) => setProductType(e.target.value)} placeholder={t('productType')}
                    className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  <input type="number" value={qty} onChange={(e) => {
                    const q = Number(e.target.value);
                    setQty(q);
                    const p = products.find((p) => p.id === selectedProduct);
                    if (p) setPrice(Number(p.selling_price) * q);
                  }} min={1} placeholder={t('quantity')}
                    className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                  <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0} step="0.01" placeholder={t('totalPrice')}
                    className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
              </div>

              {/* Payment & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-1 block">{t('paymentMethod')}</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                    <option value="cash">{t('cash')}</option>
                    <option value="card">{t('card')}</option>
                    <option value="bank_transfer">{t('bankTransfer')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-1 block">{t('orderStatusLabel')}</label>
                  <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                    <option value="not_started">{t('notStarted')}</option>
                    <option value="started">{t('started')}</option>
                    <option value="finished">{t('finished')}</option>
                    <option value="paid">{t('paid')}</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder={t('additionalNotes')} rows={3}
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />

              {/* Submit */}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2.5 rounded-lg text-sm border border-[var(--border)] hover:bg-accent transition">
                  {t('cancel')}
                </button>
                <button type="submit"
                  className="px-6 py-2.5 rounded-lg text-sm bg-primary text-white font-medium hover:opacity-90 transition">
                  {editingOrder ? t('save') : t('create')}
                </button>
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
