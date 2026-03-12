'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useMemo } from 'react';
import { Plus, Eye, Pencil, Trash2, X, ShoppingCart, Filter } from 'lucide-react';
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

const STATUSES = ['not_started', 'started', 'finished', 'paid'] as const;

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  started: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  finished: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const INPUT_CLASS = 'w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20';
const FILTER_INPUT = 'border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20';

/** Get current date string (YYYY-MM-DD) in Baku timezone */
function getBakuDateStr(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Baku' });
}

/** Format a date string for display in Baku timezone */
function formatBakuDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('az-AZ', { timeZone: 'Asia/Baku', year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return dateStr;
  }
}

export default function Orders() {
  const { t, user, userProfile } = useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterOrderNumber, setFilterOrderNumber] = useState('');
  const [filterCustomerName, setFilterCustomerName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDeliveryFrom, setFilterDeliveryFrom] = useState('');
  const [filterDeliveryTo, setFilterDeliveryTo] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');


  // Form state — Customer Info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderDate, setOrderDate] = useState(getBakuDateStr());
  const [deliveryDate, setDeliveryDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // Form state — Order Info
  const [productName, setProductName] = useState('');
  const [source, setSource] = useState('instagram');
  const [qty, setQty] = useState(1);
  const [amount, setAmount] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Form state — Payment
  const [paymentType, setPaymentType] = useState('cash');
  const [paymentMethod, setPaymentMethod] = useState('full');
  const [fullPaymentAmount, setFullPaymentAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [remainingPaymentType, setRemainingPaymentType] = useState('cash');
  const [remainingBalance, setRemainingBalance] = useState('');

  // Edit status
  const [formStatus, setFormStatus] = useState('not_started');

  // Order sources (dynamic)
  const [orderSources, setOrderSources] = useState<{ name: string; value: string }[]>([
    { name: 'Instagram', value: 'instagram' },
    { name: 'Facebook', value: 'facebook' },
    { name: 'Digər', value: 'other' },
  ]);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchUsers();
    fetchOrderSources();

    // Real-time subscription for sync with Order Tracking board
    const channel = supabase
      .channel('orders-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => { fetchOrders(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (paymentMethod === 'deposit') {
      const rem = Math.max(0, (Number(amount) || 0) - (Number(depositAmount) || 0));
      setRemainingBalance(String(rem));
    }
  }, [amount, depositAmount, paymentMethod]);

  useEffect(() => {
    if (paymentMethod === 'full') {
      setFullPaymentAmount(amount);
    }
  }, [amount, paymentMethod]);


  async function fetchOrders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customer:customers(*)')
        .order('order_date', { ascending: false });
      if (!error) setOrders(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomers() {
    try {
      const { data, error } = await supabase.from('customers').select('*');
      if (!error) setCustomers(data || []);
    } catch {
      // ignore
    }
  }

  async function fetchUsers() {
    const { data } = await supabase.from('users').select('id, name');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((u: { id: string; name: string }) => { map[u.id] = u.name; });
      setUserMap(map);
    }
  }

  async function fetchOrderSources() {
    try {
      const { data } = await supabase.from('order_sources').select('name, value').order('created_at');
      if (data && data.length > 0) {
        setOrderSources(data);
      }
    } catch {
      // Table may not exist yet — use defaults
    }
  }

  const hasActiveFilters = filterDateFrom || filterDateTo || filterOrderNumber || filterCustomerName || filterStatus || filterDeliveryFrom || filterDeliveryTo || filterAmountMin || filterAmountMax;

  function clearFilters() {
    setFilterDateFrom(''); setFilterDateTo(''); setFilterOrderNumber('');
    setFilterCustomerName(''); setFilterStatus('');
    setFilterDeliveryFrom(''); setFilterDeliveryTo('');
    setFilterAmountMin(''); setFilterAmountMax('');
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Date filter
      if (filterDateFrom) {
        const d = o.order_date?.slice(0, 10) || '';
        if (d < filterDateFrom) return false;
      }
      if (filterDateTo) {
        const d = o.order_date?.slice(0, 10) || '';
        if (d > filterDateTo) return false;
      }
      // Order number
      if (filterOrderNumber && !String(o.order_number).includes(filterOrderNumber)) return false;
      // Customer name
      if (filterCustomerName && !(o.customer?.name || '').toLowerCase().includes(filterCustomerName.toLowerCase())) return false;
      // Status
      if (filterStatus && o.status !== filterStatus) return false;
      // Delivery date
      if (filterDeliveryFrom && (!o.delivery_date || o.delivery_date < filterDeliveryFrom)) return false;
      if (filterDeliveryTo && (!o.delivery_date || o.delivery_date > filterDeliveryTo)) return false;
      // Amount
      if (filterAmountMin && Number(o.total_price) < Number(filterAmountMin)) return false;
      if (filterAmountMax && Number(o.total_price) > Number(filterAmountMax)) return false;
      return true;
    });
  }, [orders, filterDateFrom, filterDateTo, filterOrderNumber, filterCustomerName, filterStatus, filterDeliveryFrom, filterDeliveryTo, filterAmountMin, filterAmountMax]);

  const totalAmount = useMemo(() => filteredOrders.reduce((s, o) => s + Number(o.total_price || 0), 0), [filteredOrders]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  function resetForm() {
    setCustomerName(''); setCustomerPhone('');
    setOrderDate(getBakuDateStr());
    setDeliveryDate(''); setAssignedTo('');
    setProductName(''); setSource(orderSources[0]?.value || 'instagram');
    setQty(1); setAmount(''); setOrderNotes('');
    setPaymentType('cash'); setPaymentMethod('full');
    setFullPaymentAmount(''); setDepositAmount('');
    setRemainingPaymentType('cash'); setRemainingBalance('');
    setEditingOrder(null); setCustomerSearch('');
    setShowCustomerDropdown(false); setFormStatus('not_started');
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
    setOrderDate(order.order_date ? getBakuDateStr(new Date(order.order_date)) : '');
    setDeliveryDate(order.delivery_date || '');
    setAssignedTo(order.assigned_to || '');
    setProductName(order.product_type || '');
    setSource(order.source || 'other');
    setQty(order.quantity);
    setAmount(String(Number(order.total_price)));
    setOrderNotes(order.notes || '');
    setPaymentType(order.payment_method || 'cash');
    setPaymentMethod(order.payment_type || 'full');
    setFullPaymentAmount(order.payment_type === 'full' ? String(Number(order.total_price)) : '');
    setDepositAmount(String(Number(order.deposit_amount || 0)));
    setRemainingPaymentType(order.payment_type_remaining || 'cash');
    setRemainingBalance(String(Number(order.remaining_balance || 0)));
    setFormStatus(order.status || 'not_started');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const numAmount = Number(amount) || 0;
      const numDeposit = Number(depositAmount) || 0;
      const numRemaining = Number(remainingBalance) || 0;
      const isFullyPaid = paymentMethod === 'full' || (paymentMethod === 'deposit' && numRemaining === 0);
      const hasDebt = paymentMethod === 'deposit' && numRemaining > 0;
      const autoStatus = isFullyPaid ? 'paid' : (hasDebt && (editingOrder ? formStatus : 'not_started') === 'paid' ? 'finished' : (editingOrder ? formStatus : 'not_started'));

      const orderPayload = {
        product_type: productName,
        quantity: qty,
        total_price: numAmount,
        payment_method: paymentType,
        payment_type: paymentMethod,
        deposit_amount: paymentMethod === 'deposit' ? numDeposit : numAmount,
        remaining_balance: paymentMethod === 'deposit' ? numRemaining : 0,
        payment_type_remaining: paymentMethod === 'deposit' ? remainingPaymentType : null,
        status: autoStatus,
        payment_status: isFullyPaid ? 'paid' : 'partially_paid',
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
      fetchCustomers();
      // fetchOrders not needed — realtime subscription handles it
    } finally {
      setSubmitting(false);
    }
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

  const sourceLabel = (s: string) => {
    const found = orderSources.find(src => src.value === s);
    if (found) return found.name;
    const map: Record<string, string> = {
      instagram: t('instagram'), facebook: t('facebook'), other: t('other'),
    };
    return map[s] || s;
  };

  const paymentTypeLabel = (s: string) => {
    const map: Record<string, string> = { cash: t('cash'), card: t('card'), bank_transfer: t('bankTransfer') };
    return map[s] || s;
  };

  const isAdmin = userProfile?.role === 'admin';

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

      {/* Filter Toggle + Summary */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition ${showFilters || hasActiveFilters ? 'bg-primary text-white border-primary' : 'border-[var(--border)] hover:bg-accent'}`}
        >
          <Filter size={16} />
          {t('filters')}
          {hasActiveFilters && <span className="bg-white/20 rounded-full px-1.5 text-xs">!</span>}
        </button>

      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('date')} ({t('startDate')})</label>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className={FILTER_INPUT + ' w-full'} />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('date')} ({t('endDate')})</label>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className={FILTER_INPUT + ' w-full'} />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('orderNumber')}</label>
              <input value={filterOrderNumber} onChange={e => setFilterOrderNumber(e.target.value)} placeholder="#" className={FILTER_INPUT + ' w-full'} />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('customerName')}</label>
              <input value={filterCustomerName} onChange={e => setFilterCustomerName(e.target.value)} className={FILTER_INPUT + ' w-full'} />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('status')}</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={FILTER_INPUT + ' w-full'}>
                <option value="">{t('allTime')}</option>
                {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('deliveryDate')} ({t('startDate')})</label>
              <input type="date" value={filterDeliveryFrom} onChange={e => setFilterDeliveryFrom(e.target.value)} className={FILTER_INPUT + ' w-full'} />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('deliveryDate')} ({t('endDate')})</label>
              <input type="date" value={filterDeliveryTo} onChange={e => setFilterDeliveryTo(e.target.value)} className={FILTER_INPUT + ' w-full'} />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('minAmount')}</label>
              <input type="number" value={filterAmountMin} onChange={e => setFilterAmountMin(e.target.value)} min={0} placeholder="0" className={FILTER_INPUT + ' w-full'} />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('maxAmount')}</label>
              <input type="number" value={filterAmountMax} onChange={e => setFilterAmountMax(e.target.value)} min={0} placeholder="∞" className={FILTER_INPUT + ' w-full'} />
            </div>
            <div className="flex items-end">
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 transition py-1.5 px-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                {t('clearFilters')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('date')} <span className="text-[10px] opacity-60">(BAKU)</span></th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('orderNumber')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('customerName')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('status')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('deliveryDate')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('amount')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('debt')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('author')}</th>
              <th className="text-left p-4 font-medium text-[var(--text-secondary)]">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-8 text-center text-[var(--text-secondary)]">{t('loading')}</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={9} className="p-8 text-center text-[var(--text-secondary)]">
                <div className="flex flex-col items-center gap-2">
                  <ShoppingCart size={40} className="text-[var(--text-secondary)]" />
                  {t('noData')}
                </div>
              </td></tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-[var(--border)] hover:bg-accent/30 transition">
                  <td className="p-4">{formatBakuDate(order.order_date)}</td>
                  <td className="p-4 font-mono text-xs">#{order.order_number}</td>
                  <td className="p-4 font-medium">{order.customer?.name || '-'}</td>
                  <td className="p-4">
                    {(() => {
                      const hasDebt = order.payment_type === 'deposit' && Number(order.remaining_balance) > 0;
                      const displayStatus = hasDebt && order.status === 'paid' ? 'finished' : order.status;
                      return (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${STATUS_COLORS[displayStatus] || ''}`}>
                          {statusLabel(displayStatus)}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-4 text-[var(--text-secondary)]">{order.delivery_date || '-'}</td>
                  <td className="p-4 font-medium">₼{Number(order.total_price).toLocaleString()}</td>
                  <td className="p-4">
                    {order.payment_type === 'deposit' && Number(order.remaining_balance) > 0 ? (
                      <span className="text-red-500 font-medium">₼{Number(order.remaining_balance).toLocaleString()}</span>
                    ) : (
                      <span className="text-green-500 text-xs">{t('noDebt')}</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-[var(--text-secondary)]">{userMap[order.created_by] || '-'}</td>
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

      {/* Total Summary — bottom right (admin only) */}
      {isAdmin && (
        <div className="flex justify-end">
          <div className="bg-[var(--card)] rounded-xl px-5 py-3 border border-[var(--border)] shadow-sm flex items-center gap-4">
            <span className="text-sm text-[var(--text-secondary)]">
              {filteredOrders.length} {t('orders').toLowerCase()}
            </span>
            <span className="text-sm font-semibold text-primary">
              {t('totalOrdersAmount')}: ₼{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      )}

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
                <div><span className="text-[var(--text-secondary)]">{t('author')}:</span> <span className="font-medium">{userMap[viewingOrder.created_by] || '-'}</span></div>
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

              {/* Author (read-only) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('author')}</label>
                  <input
                    value={editingOrder ? (userMap[editingOrder.created_by] || '-') : (userProfile?.name || '')}
                    readOnly
                    className={`${INPUT_CLASS} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`}
                  />
                </div>

                {/* Order Taken By (read-only, auto-filled with current user) */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('orderTakenBy')}</label>
                  <input
                    value={userProfile?.name || ''}
                    readOnly
                    className={`${INPUT_CLASS} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`}
                  />
                </div>
              </div>

              {/* SECTION: Customer Information */}
              <div>
                <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wide">{t('customerInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <button key={c.id} type="button" onMouseDown={() => selectCustomer(c)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition">
                            {c.name} {c.phone ? `— ${c.phone}` : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('customerPhoneNumber')}</label>
                    <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={INPUT_CLASS} />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('orderDate')}</label>
                    <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className={INPUT_CLASS} />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('deliveryDate')}</label>
                    <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={INPUT_CLASS} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('orderAssignedTo')}</label>
                    <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={INPUT_CLASS} />
                  </div>
                </div>
              </div>

              {/* SECTION: Order Information */}
              <div>
                <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wide">{t('orderInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('productName')}</label>
                    <input value={productName} onChange={(e) => setProductName(e.target.value)} className={INPUT_CLASS} />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('source')}</label>
                    <select value={source} onChange={(e) => setSource(e.target.value)} className={INPUT_CLASS}>
                      {orderSources.map((src) => (
                        <option key={src.value} value={src.value}>{src.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('quantity')}</label>
                    <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} min={1} className={INPUT_CLASS} />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('amount')}</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={0} step="0.01" className={INPUT_CLASS} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('notes')}</label>
                    <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} rows={3}
                      className={`${INPUT_CLASS} resize-none`} />
                  </div>
                </div>
              </div>

              {/* SECTION: Status (edit only) */}
              {editingOrder && (
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wide">{t('status')}</h3>
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className={INPUT_CLASS}>
                    {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
                </div>
              )}

              {/* SECTION: Payment */}
              <div>
                <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wide">{t('paymentInfo')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('paymentType')}</label>
                    <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={INPUT_CLASS}>
                      <option value="cash">{t('cash')}</option>
                      <option value="card">{t('card')}</option>
                      <option value="bank_transfer">{t('bankTransfer')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">{t('paymentMethod')}</label>
                    <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
                      <button type="button" onClick={() => setPaymentMethod('full')}
                        className={`flex-1 py-2.5 text-sm font-medium transition ${paymentMethod === 'full' ? 'bg-primary text-white' : 'bg-[var(--bg)] text-[var(--text-secondary)] hover:bg-accent/50'}`}>
                        {t('fullPayment')}
                      </button>
                      <button type="button" onClick={() => setPaymentMethod('deposit')}
                        className={`flex-1 py-2.5 text-sm font-medium transition border-l border-[var(--border)] ${paymentMethod === 'deposit' ? 'bg-primary text-white' : 'bg-[var(--bg)] text-[var(--text-secondary)] hover:bg-accent/50'}`}>
                        {t('deposit')}
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'full' && (
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('fullPaymentAmount')}</label>
                      <input type="number" value={fullPaymentAmount} onChange={(e) => setFullPaymentAmount(e.target.value)} min={0} step="0.01" className={INPUT_CLASS} />
                    </div>
                  )}

                  {paymentMethod === 'deposit' && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('depositAmount')}</label>
                        <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} min={0} step="0.01" className={INPUT_CLASS} />
                      </div>
                      <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--bg)]/50 space-y-3">
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{t('remainingBalance')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('paymentType')}</label>
                            <select value={remainingPaymentType} onChange={(e) => setRemainingPaymentType(e.target.value)} className={INPUT_CLASS}>
                              <option value="cash">{t('cash')}</option>
                              <option value="card">{t('card')}</option>
                              <option value="bank_transfer">{t('bankTransfer')}</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('amount')}</label>
                            <input type="number" value={remainingBalance} onChange={(e) => setRemainingBalance(e.target.value)} min={0} step="0.01" className={INPUT_CLASS} />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-5 py-2.5 rounded-lg text-sm border border-[var(--border)] hover:bg-accent transition font-medium">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={submitting}
                  className="px-6 py-2.5 rounded-lg text-sm bg-primary text-white font-medium hover:opacity-90 transition disabled:opacity-50">
                  {submitting ? t('loading') : editingOrder ? t('save') : t('createOrder')}
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
