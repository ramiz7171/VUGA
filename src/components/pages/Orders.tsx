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
  product_type: string;
  quantity: number;
  total_price: number;
  payment_method: string;
  payment_status: string;
  payment_type: string;
  deposit_amount: number;
  remaining_balance: number;
  payment_type_remaining: string;
  status: string;
  notes: string;
  source: string;
  assigned_to: string;
  delivery_date: string;
  order_date: string;
  created_by: string;
  customer?: Customer;
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-gray-200 text-gray-700',
  started: 'bg-blue-100 text-blue-700',
  finished: 'bg-green-100 text-green-700',
  paid: 'bg-purple-100 text-purple-700',
};

const INPUT_CLASS = 'w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20';

export default function Orders() {
  const { t, user, userProfile } = useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state — Customer Info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // Form state — Order Info
  const [productName, setProductName] = useState('');
  const [source, setSource] = useState('instagram');
  const [qty, setQty] = useState(1);
  const [amount, setAmount] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');

  // Form state — Payment
  const [paymentType, setPaymentType] = useState('cash');           // Payment Type dropdown (Cash/Card/Bank Transfer)
  const [paymentMethod, setPaymentMethod] = useState('full');       // Payment Method toggle (full / deposit)
  const [fullPaymentAmount, setFullPaymentAmount] = useState(0);    // Full Payment input
  const [depositAmount, setDepositAmount] = useState(0);            // Deposit input
  const [remainingPaymentType, setRemainingPaymentType] = useState('cash'); // Remaining Balance payment type
  const [remainingBalance, setRemainingBalance] = useState(0);      // Remaining Balance amount

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, []);

  // Auto-calculate remaining balance when deposit changes
  useEffect(() => {
    if (paymentMethod === 'deposit') {
      setRemainingBalance(Math.max(0, amount - depositAmount));
    }
  }, [amount, depositAmount, paymentMethod]);

  // Sync full payment amount with total amount
  useEffect(() => {
    if (paymentMethod === 'full') {
      setFullPaymentAmount(amount);
    }
  }, [amount, paymentMethod]);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, customer:customers(*)')
      .order('order_date', { ascending: false });
    setOrders(data || []);
    setLoading(false);
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
    setProductName('');
    setSource('instagram');
    setQty(1);
    setAmount(0);
    setOrderNotes('');
    setPaymentType('cash');
    setPaymentMethod('full');
    setFullPaymentAmount(0);
    setDepositAmount(0);
    setRemainingPaymentType('cash');
    setRemainingBalance(0);
    setEditingOrder(null);
    setCustomerSearch('');
    setShowCustomerDropdown(false);
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
    setProductName(order.product_type || '');
    setSource(order.source || 'other');
    setQty(order.quantity);
    setAmount(Number(order.total_price));
    setOrderNotes(order.notes || '');
    setPaymentType(order.payment_method || 'cash');
    setPaymentMethod(order.payment_type || 'full');
    setFullPaymentAmount(order.payment_type === 'full' ? Number(order.total_price) : 0);
    setDepositAmount(Number(order.deposit_amount || 0));
    setRemainingPaymentType(order.payment_type_remaining || 'cash');
    setRemainingBalance(Number(order.remaining_balance || 0));
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const orderPayload = {
      product_type: productName,
      quantity: qty,
      total_price: amount,
      payment_method: paymentType,               // Cash/Card/Bank Transfer
      payment_type: paymentMethod,                // full/deposit
      deposit_amount: paymentMethod === 'deposit' ? depositAmount : amount,
      remaining_balance: paymentMethod === 'deposit' ? remainingBalance : 0,
      payment_type_remaining: paymentMethod === 'deposit' ? remainingPaymentType : null,
      status: editingOrder ? editingOrder.status : 'not_started',
      payment_status: paymentMethod === 'full' || remainingBalance === 0 ? 'paid' : 'partially_paid',
      notes: orderNotes,
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
      instagram: t('instagram'), facebook: t('facebook'), other: t('other'),
    };
    return map[s] || s;
  };

  const paymentTypeLabel = (s: string) => {
    const map: Record<string, string> = { cash: t('cash'), card: t('card'), bank_transfer: t('bankTransfer') };
    return map[s] || s;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('orders')}</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus size={18} />
          {t('newOrder')}
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
                      {(userProfile?.role !== 'user' || order.created_by === user?.id) && (
                        <button onClick={() => openEdit(order)} className="p-1.5 rounded hover:bg-accent transition" title={t('edit')}>
                          <Pencil size={16} />
                        </button>
                      )}
                      {(userProfile?.role !== 'user' || order.created_by === user?.id) && (
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
                <div><span className="text-[var(--text-secondary)]">{t('productName')}:</span> <span className="font-medium">{viewingOrder.product_type || '-'}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('quantity')}:</span> <span className="font-medium">{viewingOrder.quantity}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('amount')}:</span> <span className="font-medium">₼{Number(viewingOrder.total_price).toLocaleString()}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('status')}:</span> <span className="font-medium">{statusLabel(viewingOrder.status)}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('deliveryDate')}:</span> <span className="font-medium">{viewingOrder.delivery_date || '-'}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('paymentType')}:</span> <span className="font-medium">{paymentTypeLabel(viewingOrder.payment_method)}</span></div>
                <div><span className="text-[var(--text-secondary)]">{t('paymentMethod')}:</span> <span className="font-medium">{viewingOrder.payment_type === 'deposit' ? t('deposit') : t('fullPayment')}</span></div>
                {viewingOrder.payment_type === 'deposit' && (
                  <>
                    <div><span className="text-[var(--text-secondary)]">{t('depositAmount')}:</span> <span className="font-medium">₼{Number(viewingOrder.deposit_amount).toLocaleString()}</span></div>
                    <div><span className="text-[var(--text-secondary)]">{t('remainingBalance')}:</span> <span className="font-medium text-red-500">₼{Number(viewingOrder.remaining_balance).toLocaleString()}</span></div>
                    <div><span className="text-[var(--text-secondary)]">{t('remainingPaymentType')}:</span> <span className="font-medium">{paymentTypeLabel(viewingOrder.payment_type_remaining)}</span></div>
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
              <h2 className="text-lg font-bold">{editingOrder ? t('edit') : t('newOrder')}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ── SECTION: Customer Information ── */}
              <div>
                <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wide">{t('customerInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Name (searchable) */}
                  <div className="relative">
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('customerName')}</label>
                    <input
                      value={customerSearch}
                      onChange={(e) => { setCustomerSearch(e.target.value); setCustomerName(e.target.value); setShowCustomerDropdown(true); }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                      required
                      className={INPUT_CLASS}
                    />
                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredCustomers.slice(0, 5).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => selectCustomer(c)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition"
                          >
                            {c.name} {c.phone ? `— ${c.phone}` : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Customer Phone Number */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('customerPhoneNumber')}</label>
                    <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={INPUT_CLASS} />
                  </div>

                  {/* Order Date */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('orderDate')}</label>
                    <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className={INPUT_CLASS} />
                  </div>

                  {/* Delivery Date */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('deliveryDate')}</label>
                    <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={INPUT_CLASS} />
                  </div>

                  {/* Order Assigned To */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('orderAssignedTo')}</label>
                    <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={INPUT_CLASS} />
                  </div>
                </div>
              </div>

              {/* ── SECTION: Order Information ── */}
              <div>
                <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wide">{t('orderInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Name (text input) */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('productName')}</label>
                    <input value={productName} onChange={(e) => setProductName(e.target.value)} className={INPUT_CLASS} />
                  </div>

                  {/* Source */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('source')}</label>
                    <select value={source} onChange={(e) => setSource(e.target.value)} className={INPUT_CLASS}>
                      <option value="instagram">{t('instagram')}</option>
                      <option value="facebook">{t('facebook')}</option>
                      <option value="other">{t('other')}</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('quantity')}</label>
                    <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} min={1} className={INPUT_CLASS} />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('amount')}</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={0} step="0.01" className={INPUT_CLASS} />
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('notes')}</label>
                    <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} rows={3}
                      className={`${INPUT_CLASS} resize-none`} />
                  </div>
                </div>
              </div>

              {/* ── SECTION: Payment ── */}
              <div>
                <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wide">{t('paymentInfo')}</h3>
                <div className="space-y-4">

                  {/* Payment Type (Cash / Card / Bank Transfer) */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('paymentType')}</label>
                    <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={INPUT_CLASS}>
                      <option value="cash">{t('cash')}</option>
                      <option value="card">{t('card')}</option>
                      <option value="bank_transfer">{t('bankTransfer')}</option>
                    </select>
                  </div>

                  {/* Payment Method — Full Payment / Deposit toggle */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">{t('paymentMethod')}</label>
                    <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('full')}
                        className={`flex-1 py-2.5 text-sm font-medium transition ${
                          paymentMethod === 'full'
                            ? 'bg-primary text-white'
                            : 'bg-[var(--bg)] text-[var(--text-secondary)] hover:bg-accent/50'
                        }`}
                      >
                        {t('fullPayment')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('deposit')}
                        className={`flex-1 py-2.5 text-sm font-medium transition border-l border-[var(--border)] ${
                          paymentMethod === 'deposit'
                            ? 'bg-primary text-white'
                            : 'bg-[var(--bg)] text-[var(--text-secondary)] hover:bg-accent/50'
                        }`}
                      >
                        {t('deposit')}
                      </button>
                    </div>
                  </div>

                  {/* Full Payment — amount input */}
                  {paymentMethod === 'full' && (
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('fullPaymentAmount')}</label>
                      <input
                        type="number"
                        value={fullPaymentAmount}
                        onChange={(e) => setFullPaymentAmount(Number(e.target.value))}
                        min={0}
                        step="0.01"
                        className={INPUT_CLASS}
                      />
                    </div>
                  )}

                  {/* Deposit — amount input + Remaining Balance */}
                  {paymentMethod === 'deposit' && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('depositAmount')}</label>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(Number(e.target.value))}
                          min={0}
                          step="0.01"
                          className={INPUT_CLASS}
                        />
                      </div>

                      {/* Remaining Balance sub-section */}
                      <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--bg)]/50 space-y-3">
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{t('remainingBalance')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('paymentType')}</label>
                            <select
                              value={remainingPaymentType}
                              onChange={(e) => setRemainingPaymentType(e.target.value)}
                              className={INPUT_CLASS}
                            >
                              <option value="cash">{t('cash')}</option>
                              <option value="card">{t('card')}</option>
                              <option value="bank_transfer">{t('bankTransfer')}</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('amount')}</label>
                            <input
                              type="number"
                              value={remainingBalance}
                              onChange={(e) => setRemainingBalance(Number(e.target.value))}
                              min={0}
                              step="0.01"
                              className={INPUT_CLASS}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ── Buttons ── */}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-5 py-2.5 rounded-lg text-sm border border-[var(--border)] hover:bg-accent transition font-medium">
                  {t('cancel')}
                </button>
                <button type="submit"
                  className="px-6 py-2.5 rounded-lg text-sm bg-primary text-white font-medium hover:opacity-90 transition">
                  {editingOrder ? t('save') : t('createOrder')}
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
