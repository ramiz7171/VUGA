'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { DollarSign, CreditCard, Building2, Wallet, Calendar, RotateCcw } from 'lucide-react';
import { TranslationKey } from '@/lib/i18n';

const COLORS = ['#102041', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#DBDDEA'];

const MONTH_KEYS: TranslationKey[] = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

interface Order {
  order_date: string;
  total_price: number;
  payment_method: string;
  status: string;
}

interface ExpenseRow {
  date: string;
  amount: number;
  category: string;
}

export default function Analytics() {
  const { t, userProfile } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [customers, setCustomers] = useState<{ source: string }[]>([]);

  // Month/Year filter — default to current month and year
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState<string>(String(now.getMonth())); // 0-11 or 'all'
  const [filterYear, setFilterYear] = useState<string>(String(now.getFullYear())); // year or 'all'

  useEffect(() => { fetchAnalytics(); }, []);

  async function fetchAnalytics() {
    const [ordersRes, expensesRes, customersRes] = await Promise.all([
      supabase.from('orders').select('order_date, total_price, payment_method, status'),
      supabase.from('expenses').select('date, amount, category'),
      supabase.from('customers').select('source'),
    ]);
    if (ordersRes.error || expensesRes.error) { setTimeout(() => fetchAnalytics(), 2000); return; }
    setOrders(ordersRes.data || []);
    setExpenses(expensesRes.data || []);
    setCustomers(customersRes.data || []);
  }

  // Filter helper
  function inRange(dateStr: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (filterYear !== 'all' && d.getFullYear() !== Number(filterYear)) return false;
    if (filterMonth !== 'all' && d.getMonth() !== Number(filterMonth)) return false;
    return true;
  }

  function resetFilters() {
    setFilterMonth('all');
    setFilterYear('all');
  }

  const filteredOrders = useMemo(() => orders.filter(o => inRange(o.order_date)), [orders, filterMonth, filterYear]);
  const filteredExpenses = useMemo(() => expenses.filter(e => inRange(e.date)), [expenses, filterMonth, filterYear]);

  // Payment type totals
  const cashTotal = filteredOrders.filter(o => o.payment_method === 'cash').reduce((s, o) => s + Number(o.total_price || 0), 0);
  const cardTotal = filteredOrders.filter(o => o.payment_method === 'card').reduce((s, o) => s + Number(o.total_price || 0), 0);
  const bankTotal = filteredOrders.filter(o => o.payment_method === 'bank_transfer').reduce((s, o) => s + Number(o.total_price || 0), 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const kassaBalance = cashTotal - totalExpenses;

  // Monthly Sales (count per month)
  const monthlySalesData = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach(o => {
      const m = o.order_date?.slice(0, 7) || '';
      if (m) map.set(m, (map.get(m) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([month, sales]) => ({ month, sales }));
  }, [filteredOrders]);

  // Monthly Revenue
  const monthlyRevenueData = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach(o => {
      const m = o.order_date?.slice(0, 7) || '';
      if (m) map.set(m, (map.get(m) || 0) + Number(o.total_price || 0));
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([month, revenue]) => ({ month, revenue }));
  }, [filteredOrders]);

  // Monthly Expenses
  const monthlyExpensesData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e => {
      const m = e.date?.slice(0, 7) || '';
      if (m) map.set(m, (map.get(m) || 0) + Number(e.amount || 0));
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([month, amount]) => ({ month, amount }));
  }, [filteredExpenses]);

  // Source Distribution
  const sourceDistribution = useMemo(() => {
    const map = new Map<string, number>();
    customers.forEach(c => {
      const src = c.source || 'other';
      map.set(src, (map.get(src) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [customers]);

  // Expense Categories
  const expenseCategories = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + Number(e.amount || 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  // Order Status Distribution
  const completedWork = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach(o => {
      map.set(o.status, (map.get(o.status) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // Paid vs Unpaid
  const paymentStatusData = useMemo(() => {
    const paid = filteredOrders.filter(o => o.status === 'paid').length;
    const unpaid = filteredOrders.length - paid;
    return [
      { name: t('paidOrders'), value: paid },
      { name: t('unpaidOrders'), value: unpaid },
    ];
  }, [filteredOrders, t]);

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    orders.forEach(o => { const y = o.order_date?.slice(0, 4); if (y) years.add(y); });
    expenses.forEach(e => { const y = e.date?.slice(0, 4); if (y) years.add(y); });
    return Array.from(years).sort();
  }, [orders, expenses]);

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-lg font-semibold">{t('accessDenied')}</p>
        <p className="text-sm text-[var(--text-secondary)]">{t('noPermission')}</p>
      </div>
    );
  }

  const SELECT_CLASS = 'border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('analytics')}</h1>

      {/* Date Filter Bar */}
      <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <Calendar size={16} className="text-[var(--text-secondary)]" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">{t('month')}:</span>
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className={SELECT_CLASS}>
              <option value="all">{t('all')}</option>
              {MONTH_KEYS.map((key, i) => (
                <option key={i} value={String(i)}>{t(key)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">{t('year')}:</span>
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className={SELECT_CLASS}>
              <option value="all">{t('all')}</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-primary transition px-3 py-2 rounded-lg hover:bg-accent"
          >
            <RotateCcw size={14} />
            {t('resetFilter')}
          </button>
        </div>
      </div>

      {/* Payment Type Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign size={24} />} label={t('cashPayments')} value={cashTotal} color="text-green-500" />
        <StatCard icon={<CreditCard size={24} />} label={t('cardPayments')} value={cardTotal} color="text-blue-500" />
        <StatCard icon={<Building2 size={24} />} label={t('bankTransferPayments')} value={bankTotal} color="text-purple-500" />
        <StatCard icon={<Wallet size={24} />} label={t('kassaBalance')} value={kassaBalance} color={kassaBalance >= 0 ? 'text-green-500' : 'text-red-500'} />
      </div>

      {/* Monthly Sales & Monthly Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={t('monthlySales')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="sales" fill="#102041" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('monthlyExpenses')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyExpensesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} formatter={(value) => [`₼${Number(value).toLocaleString()}`]} />
              <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Monthly Revenue */}
      <div className="grid grid-cols-1 gap-4">
        <ChartCard title={t('monthlyRevenue')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} formatter={(value) => [`₼${Number(value).toLocaleString()}`]} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Paid vs Unpaid */}
        <ChartCard title={`${t('paymentStatusOverview')} (${filteredOrders.length} ${t('orders').toLowerCase()})`}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={paymentStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value, percent }) => `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`}>
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Order Status Distribution */}
        <ChartCard title={t('completedWork')}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={completedWork} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                {completedWork.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Source Distribution */}
        <ChartCard title={t('sourceDistribution')}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={sourceDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                {sourceDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Expense Categories */}
        <ChartCard title={t('expenseCategories')}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={expenseCategories} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label>
                {expenseCategories.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-[var(--card)] rounded-xl p-5 border border-[var(--border)] shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>₼{value.toLocaleString()}</p>
        </div>
        <div className={color}>{icon}</div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--card)] rounded-xl p-5 border border-[var(--border)] shadow-sm">
      <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)]">{title}</h3>
      {children}
    </div>
  );
}
