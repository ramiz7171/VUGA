'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { X } from 'lucide-react';

interface OrderRaw {
  id: string;
  order_number: number;
  product_type: string;
  assigned_to: string;
  delivery_date: string;
  order_date: string;
  notes: string;
  status: string;
  customer_id: string;
  created_by: string;
  customer: { name: string } | { name: string }[] | null;
}

interface Order {
  id: string;
  order_number: number;
  product_type: string;
  assigned_to: string;
  delivery_date: string;
  order_date: string;
  notes: string;
  status: string;
  customer_id: string;
  created_by: string;
  customerName: string;
}

const COLUMN_IDS = ['not_started', 'started', 'finished'] as const;

const STATUSES = ['not_started', 'started', 'finished', 'paid'] as const;

const COLUMN_COLORS: Record<string, string> = {
  not_started: 'border-t-gray-400',
  started: 'border-t-orange-400',
  finished: 'border-t-blue-400',
};

const INPUT_CLASS = 'w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20';

function getDeadlineInfo(deliveryDate: string | null): { border: string; badge: string; badgeText: string; label: string } {
  if (!deliveryDate) return { border: 'border-l-gray-300 dark:border-l-gray-600', badge: '', badgeText: '', label: '' };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadline = new Date(deliveryDate);
  const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { border: 'border-l-red-900', badge: 'bg-red-900 text-white', badgeText: 'Gecikmiş', label: `${Math.abs(diffDays)} gün gecikmiş` };
  if (diffDays <= 1) return { border: 'border-l-red-500', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', badgeText: 'Təcili', label: diffDays === 0 ? 'Bu gün' : '1 gün qalıb' };
  if (diffDays <= 3) return { border: 'border-l-orange-400', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', badgeText: 'Xəbərdarlıq', label: `${diffDays} gün qalıb` };
  return { border: 'border-l-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', badgeText: 'Təhlükəsiz', label: `${diffDays} gün qalıb` };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

export default function OrderTracking() {
  const { t, user, userProfile } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  // Edit form state
  const [editProductType, setEditProductType] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editDeliveryDate, setEditDeliveryDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, product_type, assigned_to, delivery_date, order_date, notes, status, customer_id, created_by, customer:customers(name)')
        .in('status', ['not_started', 'started', 'finished'])
        .order('order_date', { ascending: true });
      if (error) { setTimeout(() => fetchOrders(), 2000); return; }
      const mapped: Order[] = (data || []).map((row: OrderRaw) => ({
        id: row.id,
        order_number: row.order_number,
        product_type: row.product_type || '',
        assigned_to: row.assigned_to || '',
        delivery_date: row.delivery_date || '',
        order_date: row.order_date || '',
        notes: row.notes || '',
        status: row.status,
        customer_id: row.customer_id || '',
        created_by: row.created_by || '',
        customerName: Array.isArray(row.customer) ? row.customer[0]?.name || '-' : row.customer?.name || '-',
      }));
      setOrders(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  async function fetchUsers() {
    const { data } = await supabase.from('users').select('id, name');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((u: { id: string; name: string }) => { map[u.id] = u.name; });
      setUserMap(map);
    }
  }

  useEffect(() => {
    fetchOrders();
    fetchUsers();

    const channel = supabase
      .channel('order-tracking')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => { fetchOrders(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const canEditOrder = (order: Order) => {
    if (!userProfile) return false;
    if (userProfile.role === 'admin' || userProfile.role === 'moderator') return true;
    return order.created_by === user?.id;
  };

  async function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;
    setOrders(prev => prev.map(o => o.id === draggableId ? { ...o, status: newStatus } : o));
    await supabase.from('orders').update({ status: newStatus }).eq('id', draggableId);
  }

  function openEditModal(order: Order) {
    setEditingOrder(order);
    setEditProductType(order.product_type);
    setEditAssignedTo(order.assigned_to);
    setEditDeliveryDate(order.delivery_date);
    setEditNotes(order.notes);
    setEditStatus(order.status);
    setEditCustomerName(order.customerName);
  }

  function closeEditModal() {
    setEditingOrder(null);
    setSaving(false);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingOrder) return;
    setSaving(true);

    // Update order fields
    await supabase.from('orders').update({
      product_type: editProductType,
      assigned_to: editAssignedTo,
      delivery_date: editDeliveryDate || null,
      notes: editNotes,
      status: editStatus,
    }).eq('id', editingOrder.id);

    // Update customer name if changed
    if (editCustomerName !== editingOrder.customerName && editingOrder.customer_id) {
      await supabase.from('customers').update({ name: editCustomerName }).eq('id', editingOrder.customer_id);
    }

    // Optimistic local update
    setOrders(prev => prev.map(o => o.id === editingOrder.id ? {
      ...o,
      product_type: editProductType,
      assigned_to: editAssignedTo,
      delivery_date: editDeliveryDate,
      notes: editNotes,
      status: editStatus,
      customerName: editCustomerName,
    } : o));

    closeEditModal();
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

  const COLUMNS = COLUMN_IDS.map(id => ({ id, title: statusLabel(id) }));

  const getColumnOrders = (columnId: string) => orders.filter(o => o.status === columnId);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t('orderTracking')}</h1>
        <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('orderTracking')}</h1>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((column) => {
            const columnOrders = getColumnOrders(column.id);
            return (
              <div key={column.id} className={`bg-[var(--card)] rounded-xl border border-[var(--border)] border-t-4 ${COLUMN_COLORS[column.id]} shadow-sm flex flex-col min-h-[300px]`}>
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{column.title}</h3>
                  <span className="text-xs text-[var(--text-secondary)] bg-accent px-2 py-0.5 rounded-full">
                    {columnOrders.length}
                  </span>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 space-y-2 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                    >
                      {columnOrders.map((order, index) => {
                        const dl = getDeadlineInfo(order.delivery_date);
                        return (
                        <Draggable key={order.id} draggableId={order.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => canEditOrder(order) && openEditModal(order)}
                              className={`bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)] border-l-4 ${dl.border} shadow-sm transition-shadow ${canEditOrder(order) ? 'cursor-pointer' : 'cursor-grab'} ${snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'}`}
                            >
                              {/* Order number + urgency badge */}
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-mono text-[var(--text-secondary)]">#{order.order_number}</span>
                                {dl.badge && (
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${dl.badge}`}>
                                    {dl.badgeText} · {dl.label}
                                  </span>
                                )}
                              </div>

                              {/* Dates row — always visible */}
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2 text-[10px] text-[var(--text-secondary)]">
                                <span>{t('date')}: {formatDate(order.order_date)}</span>
                                {order.delivery_date && (
                                  <span className="font-medium">{t('deliveryDate')}: {formatDate(order.delivery_date)}</span>
                                )}
                              </div>

                              <p className="text-sm font-medium mb-1 truncate">
                                {order.customerName}
                              </p>
                              {order.product_type && (
                                <p className="text-xs text-[var(--text-secondary)] truncate mb-1">
                                  {order.product_type}
                                </p>
                              )}
                              {order.assigned_to && (
                                <p className="text-xs text-[var(--text-secondary)] truncate">
                                  {t('assignedTo')}: {order.assigned_to}
                                </p>
                              )}
                              {userMap[order.created_by] && (
                                <p className="text-xs text-[var(--text-secondary)] truncate">
                                  {t('author')}: {userMap[order.created_by]}
                                </p>
                              )}
                            </div>
                          )}
                        </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      {columnOrders.length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-xs text-center text-[var(--text-secondary)] py-8">{t('noData')}</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Edit Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeEditModal}>
          <div className="bg-[var(--card)] rounded-xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">{t('editOrderCard')} — #{editingOrder.order_number}</h2>
              <button onClick={closeEditModal} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Order Number — read-only */}
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('orderNumber')}</label>
                <input value={`#${editingOrder.order_number}`} readOnly className={`${INPUT_CLASS} opacity-60 cursor-not-allowed`} />
              </div>

              {/* Customer Name */}
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('customerName')}</label>
                <input value={editCustomerName} onChange={(e) => setEditCustomerName(e.target.value)} className={INPUT_CLASS} />
              </div>

              {/* Product Name */}
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('productName')}</label>
                <input value={editProductType} onChange={(e) => setEditProductType(e.target.value)} className={INPUT_CLASS} />
              </div>

              {/* Assigned Person */}
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('orderAssignedTo')}</label>
                <input value={editAssignedTo} onChange={(e) => setEditAssignedTo(e.target.value)} className={INPUT_CLASS} />
              </div>

              {/* Delivery Date */}
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('deliveryDate')}</label>
                <input type="date" value={editDeliveryDate} onChange={(e) => setEditDeliveryDate(e.target.value)} className={INPUT_CLASS} />
              </div>

              {/* Order Notes */}
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('notes')}</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} className={`${INPUT_CLASS} resize-none`} />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('status')}</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={INPUT_CLASS}>
                  {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={closeEditModal}
                  className="px-5 py-2.5 rounded-lg text-sm border border-[var(--border)] hover:bg-accent transition font-medium">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 rounded-lg text-sm bg-primary text-white font-medium hover:opacity-90 transition disabled:opacity-50">
                  {t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
