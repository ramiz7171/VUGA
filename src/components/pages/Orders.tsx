'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useMemo } from 'react';
import { Plus, Eye, Pencil, Trash2, X, Search, ShoppingCart } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface Order {
  id: string;
  order_number: number;
  customer_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  payment_method: string;
  payment_status: string;
  payment_type: string;
  deposit_amount: number;
  remaining_balance: number;
  status: string;
  notes: string;
  source: string;
  assigned_to: string;
  delivery_date: string;
  order_date: string;
  customer?: Customer;
  product?: { name: string };
}

interface Product {
  id: string;
  name: string;
  selling_price: number;
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-gray-200 text-gray-700',
  started: 'bg-blue-100 text-blue-700',
  finished: 'bg-green-100 text-green-700',
  paid: 'bg-purple-100 text-purple-700',
};

export default function Orders() {
  const { t, user, userProfile } = useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state - Customer Info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // Form state - Order Info
  const [selectedProduct, setSelectedProduct] = useState('');
  const [source, setSource] = useState('instagram');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [orderStatus, setOrderStatus] = useState('not_started');
  const [customerNotes, setCustomerNotes] = useState('');

  // Form state - Payment
  const [paymentType, setPaymentType] = useState('full');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [depositAmount, setDepositAmount] = useState(0);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchCustomers();
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
    const { data } = await supabase.from('products').select('id, name, selling_price');
    setProducts(data || []);
  }

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('*');
    setCustomers(data || []);
  }

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter((o) =>
      (o.customer?.name || '').toLowerCase().includes(q) ||
      (o.customer?.phone || '').toLowerCase().includes(q) ||
      String(o.order_number).includes(q)
    );
  }, [orders, searchQuery]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  function resetForm() {
    setCustomerName('');
    setCustomerPhone('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setDeliveryDate('');
    setAssignedTo('');
    setSelectedProduct('');
    setSource('instagram');
    setQty(1);
    setPrice(0);
    setOrderStatus('not_started');
    setCustomerNotes('');
    setPaymentType('full');
    setPaymentMethod('cash');
    setDepositAmount(0);
    setEditingOrder(null);
    setCustomerSearch('');
  }

  function selectCustomer(c: Customer) {
    setCustomerName(c.name);
    setCustomerPhone(c.phone || '');
    setCustomerSearch(c.name);
    setShowCustomerDropdown(false);
  }

  function openEdit(order: Order) {
    setEditingOrder(order);
    setCustomerName(order.customer?.name || '');
    setCustomerPhone(order.customer?.phone || '');
    setCustomerSearch(order.customer?.name || '');
    setOrderDate(order.order_date ? new Date(order.order_date).toISOString().split('T')[0] : '');
    setDeliveryDate(order.delivery_date || '');
    setAssignedTo(order.assigned_to || '');
    setSelectedProduct(order.product_id || '');
    setSource(order.source || 'other');
    setQty(order.quantity);
    setPrice(Number(order.total_price));
    setOrderStatus(order.status);
    setCustomerNotes(order.notes || '');
    setPaymentType(order.payment_type || 'full');
    setPaymentMethod(order.payment_method || 'cash');
    setDepositAmount(Number(order.deposit_amount || 0));
    setShowForm(true);
  }

  const remainingBalance = paymentType === 'deposit' ? Math.max(0, price - depositAmount) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const orderPayload = {
      quantity: qty,
      total_price: price,
      payment_method: paymentMethod,
      payment_type: paymentType,
      deposit_amount: paymentType === 'deposit' ? depositAmount : price,
      remaining_balance: paymentType === 'deposit' ? remainingBalance : 0,
      status: orderStatus,
      payment_status: paymentType === 'full' || remainingBalance === 0 ? 'paid' : 'partially_paid',
      notes: customerNotes,
      source,
      delivery_date: deliveryDate || null,
      assigned_to: assignedTo,
    };

    if (editingOrder) {
      await supabase.from('orders').update(orderPayload).eq('id', editingOrder.id);
      if (editingOrder.customer_id) {
        await supabase.from('customers').update({ name: customerName, phone: customerPhone }).eq('id', editingOrder.customer_id);
      }
    } else {
      // Find or create customer
      let customerId: string | null = null;
      const existing = customers.find((c) => c.name === customerName && c.phone === customerPhone);
      if (existing) {
        customerId = existing.id;
      } else {
        const { data: newCust } = await supabase.from('customers').insert({ name: customerName, phone: customerPhone, source }).select().single();
        if (newCust) customerId = newCust.id;
      }

      if (customerId) {
        await supabase.from('orders').insert({
          ...orderPayload,
          customer_id: customerId,
          product_id: selectedProduct || null,
          order_date: orderDate,
          created_by: user?.id,
        });
      }
    }

    resetForm();
    setShowForm(false);
    fetchOrders();
    fetchCustomers();
  }

  async function handleDelete(id: string) {
    await supabase.from('orders').delete().eq('id', id);
    setDeleteId(null);
    fetchOrders();
  }

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      not_started: t('notStarted'), started: t('started'), finished: t('finished'), paid: t('paid'),
    };
    return map[s] || s;
  };

  const sourceLabel = (s: string) => {
    const map: Record<string, string> = {
      instagram: t('instagram'), facebook: t('facebook'), referral: t('referral'), other: t('other'),
    };
    return map[s] || s;
  };

  const paymentLabel = (s: string) => {
    const map: Record<string, string> = { cash: t('cash'), card: t('card'), bank_transfer: t('bankTransfer') };
    return map[s] || s;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('orders')}</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus size={18} />
          {t('createNewOrder')}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchOrders')}
          className="w-full pl-10 pr-4 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('date')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('orderNumber')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('customerName')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('status')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('deliveryDate')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('amount')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-[var(--text-secondary)]">{t('loading')}</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-[var(--text-secondary)]">
                <div className="flex flex-col items-center gap-2">
                  <ShoppingCart size={40} className="text-[var(--text-secondary)]" />
                  {t('noData')}
                </div>
              </td></tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-[var(--border)] hover:bg-accent/30 transition">
                  <td className="p-4">{new Date(order.order_date).toLocaleDateString()}</td>
                  <td className="p-4 font-mono text-xs">#{order.order_number}</td>
                  <td className="p-4 font-medium">{order.customer?.name || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || ''}`}>
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td className="p-4 text-[var(--text-secondary)]">{order.delivery_date || '-'}</td>
                  <td className="p-4 font-medium">₼{Number(order.total_price).toLocaleString()}</td>
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
              <h2 className="text-lg font-bold">#{viewingOrder.order_number} — {viewingOrder.customer?.name}</h2>
              <button onClick={() => setViewingOrder(null)} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-[var(--text-secondary)]">{t('customerName')}:</span> <span className="font-medium">{viewingOrder.customer?.name}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('phone')}:</span> <span className="font-medium">{viewingOrder.customer?.phone || '-'}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('source')}:</span> <span className="font-medium">{sourceLabel(viewingOrder.source)}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('assignedTo')}:</span> <span className="font-medium">{viewingOrder.assigned_to || '-'}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('productName')}:</span> <span className="font-medium">{viewingOrder.product?.name || '-'}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('quantity')}:</span> <span className="font-medium">{viewingOrder.quantity}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('totalPrice')}:</span> <span className="font-medium">₼{Number(viewingOrder.total_price).toLocaleString()}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('status')}:</span> <span className="font-medium">{statusLabel(viewingOrder.status)}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('deliveryDate')}:</span> <span className="font-medium">{viewingOrder.delivery_date || '-'}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('paymentMethod')}:</span> <span className="font-medium">{paymentLabel(viewingOrder.payment_method)}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('paymentType')}:</span> <span className="font-medium">{viewingOrder.payment_type === 'deposit' ? t('deposit') : t('fullPayment')}</span></div>
                {viewingOrder.payment_type === 'deposit' && (
                  <>
                    <div><span className="text-[var(--text-secondary)]">{t('depositAmount')}:</span> <span className="font-medium">₼{Number(viewingOrder.deposit_amount).toLocaleString()}</span></div>
                    <div><span className="text-[var(--text-secondary)]">{t('remainingBalance')}:</span> <span className="font-medium text-red-500">₼{Number(viewingOrder.remaining_balance).toLocaleString()}</span></div>
                  </>
                )}
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
              {/* Customer Info Section */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">{t('customerInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      value={customerSearch}
                      onChange={(e) => { setCustomerSearch(e.target.value); setCustomerName(e.target.value); setShowCustomerDropdown(true); }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder={t('customerName')}
                      required
                      className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredCustomers.slice(0, 5).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => selectCustomer(c)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition"
                          >
                            {c.name} {c.phone ? `— ${c.phone}` : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder={t('phone')}
                    className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 outline-none" />
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('orderDate')}</label>
                    <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)}
                      className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('deliveryDate')}</label>
                    <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder={t('assignedTo')}
                    className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 outline-none md:col-span-2" />
                </div>
              </div>

              {/* Order Info Section */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">{t('orderInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select value={selectedProduct} onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    const p = products.find((pr) => pr.id === e.target.value);
                    if (p) setPrice(Number(p.selling_price) * qty);
                  }}
                    className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 outline-none">
                    <option value="">{t('productName')}</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select value={source} onChange={(e) => setSource(e.target.value)}
                    className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 outline-none">
                    <option value="instagram">{t('instagram')}</option>
                    <option value="facebook">{t('facebook')}</option>
                    <option value="referral">{t('referral')}</option>
                    <option value="other">{t('other')}</option>
                  </select>
                  <input type="number" value={qty} onChange={(e) => {
                    const q = Number(e.target.value);
                    setQty(q);
                    const p = products.find((pr) => pr.id === selectedProduct);
                    if (p) setPrice(Number(p.selling_price) * q);
                  }} min={1} placeholder={t('quantity')}
                    className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 outline-none" />
                  <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0} step="0.01" placeholder={t('amount')}
                    className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 outline-none" />
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('orderStatusLabel')}</label>
                    <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}
                      className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 outline-none">
                      <option value="not_started">{t('notStarted')}</option>
                      <option value="started">{t('started')}</option>
                      <option value="finished">{t('finished')}</option>
                      <option value="paid">{t('paid')}</option>
                    </select>
                  </div>
                </div>
                <textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder={t('additionalNotes')} rows={2}
                  className="w-full mt-3 border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
              </div>

              {/* Payment Section */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">{t('paymentInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('paymentMethod')}</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 outline-none">
                      <option value="cash">{t('cash')}</option>
                      <option value="card">{t('card')}</option>
                      <option value="bank_transfer">{t('bankTransfer')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('paymentType')}</label>
                    <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}
                      className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 outline-none">
                      <option value="full">{t('fullPayment')}</option>
                      <option value="deposit">{t('deposit')}</option>
                    </select>
                  </div>
                </div>

                {paymentType === 'deposit' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('depositAmount')}</label>
                      <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} min={0} step="0.01"
                        className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('remainingBalance')}</label>
                      <div className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] text-red-500 font-medium">
                        ₼{remainingBalance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

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
