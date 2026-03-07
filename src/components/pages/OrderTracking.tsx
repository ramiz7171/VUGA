'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface OrderRaw {
  id: string;
  order_number: number;
  product_type: string;
  assigned_to: string;
  delivery_date: string;
  status: string;
  customer: { name: string } | { name: string }[] | null;
}

interface Order {
  id: string;
  order_number: number;
  product_type: string;
  assigned_to: string;
  delivery_date: string;
  status: string;
  customerName: string;
}

const COLUMNS = [
  { id: 'not_started', title: 'Not Started' },
  { id: 'started', title: 'Started' },
  { id: 'finished', title: 'Finished' },
] as const;

const COLUMN_COLORS: Record<string, string> = {
  not_started: 'border-t-gray-400',
  started: 'border-t-orange-400',
  finished: 'border-t-blue-400',
};

function getDeadlineColor(deliveryDate: string | null): string {
  if (!deliveryDate) return 'border-l-gray-300 dark:border-l-gray-600';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadline = new Date(deliveryDate);
  const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'border-l-red-500';
  if (diffDays <= 3) return 'border-l-orange-400';
  return 'border-l-green-500';
}

export default function OrderTracking() {
  const { t, userProfile } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, product_type, assigned_to, delivery_date, status, customer:customers(name)')
      .in('status', ['not_started', 'started', 'finished'])
      .order('order_date', { ascending: true });
    const mapped: Order[] = (data || []).map((row: OrderRaw) => ({
      id: row.id,
      order_number: row.order_number,
      product_type: row.product_type,
      assigned_to: row.assigned_to,
      delivery_date: row.delivery_date,
      status: row.status,
      customerName: Array.isArray(row.customer) ? row.customer[0]?.name || '-' : row.customer?.name || '-',
    }));
    setOrders(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();

    // Real-time subscription for instant sync with Orders page
    const channel = supabase
      .channel('order-tracking')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'moderator')) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-lg font-semibold">{t('accessDenied')}</p>
        <p className="text-sm text-[var(--text-secondary)]">{t('noPermission')}</p>
      </div>
    );
  }

  async function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;

    // Optimistic update
    setOrders(prev => prev.map(o => o.id === draggableId ? { ...o, status: newStatus } : o));

    // Persist to DB
    await supabase.from('orders').update({ status: newStatus }).eq('id', draggableId);
  }

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
                {/* Column Header */}
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{column.title}</h3>
                  <span className="text-xs text-[var(--text-secondary)] bg-accent px-2 py-0.5 rounded-full">
                    {columnOrders.length}
                  </span>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 space-y-2 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                    >
                      {columnOrders.map((order, index) => (
                        <Draggable key={order.id} draggableId={order.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)] border-l-4 ${getDeadlineColor(order.delivery_date)} shadow-sm transition-shadow ${snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-mono text-[var(--text-secondary)]">#{order.order_number}</span>
                                {order.delivery_date && (
                                  <span className="text-[10px] text-[var(--text-secondary)]">
                                    {order.delivery_date}
                                  </span>
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
                            </div>
                          )}
                        </Draggable>
                      ))}
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
    </div>
  );
}
