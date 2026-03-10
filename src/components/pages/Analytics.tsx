'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { DollarSign, CreditCard, Building2, Wallet, Calendar, RotateCcw, Pencil, X, ChevronDown, ChevronUp } from 'lucide-react';
import { TranslationKey } from '@/lib/i18n';

const COLORS = ['#102041', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#DBDDEA'];

const MONTH_KEYS: TranslationKey[] = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

interface OrderRow {
  order_date: string;
  total_price: number;
  payment_method: string;
  status: string;
  created_by: string;
  source: string;
}

interface ExpenseRow {
  date: string;
  amount: number;
  category: string;
}

interface BalanceLog {
  id: string;
  old_balance: number;
  new_balance: number;
  note: string;
  changed_by: string;
  created_at: string;
}

const INPUT_CLASS = 'w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20';

export default function Analytics() {
  const { t, userProfile } = useApp();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [orderSources, setOrderSources] = useState<{ name: string; value: string }[]>([]);

  // Kassa balance
  const [kassaBalance, setKassaBalance] = useState(0);
  const [kassaId, setKassaId] = useState('');
  const [balanceLogs, setBalanceLogs] = useState<BalanceLog[]>([]);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [showLogs, setShowLogs] = useState(false);

  // Day/Month/Year filter — default to "all" (no specific date selected)
  const now = new Date();
  const [filterDay, setFilterDay] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const [ordersRes, expensesRes, balanceRes, logsRes, usersRes, sourcesRes] = await Promise.all([
        supabase.from('orders').select('order_date, total_price, payment_method, status, created_by, source'),
        supabase.from('expenses').select('date, amount, category'),
        supabase.from('kassa_balance').select('*').limit(1).single(),
        supabase.from('kassa_balance_logs').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('users').select('id, name'),
        supabase.from('order_sources').select('name, value').order('created_at'),
      ]);
      if (ordersRes.error || expensesRes.error) return;
      setOrders(ordersRes.data || []);
      setExpenses(expensesRes.data || []);
      if (balanceRes.data) {
        setKassaBalance(Number(balanceRes.data.balance));
        setKassaId(balanceRes.data.id);
      }
      setBalanceLogs(logsRes.data || []);
      if (usersRes.data) {
        const map: Record<string, string> = {};
        usersRes.data.forEach((u: { id: string; name: string }) => { map[u.id] = u.name; });
        setUserMap(map);
      }
      if (sourcesRes.data && sourcesRes.data.length > 0) {
        setOrderSources(sourcesRes.data);
      }
    } finally {
      setLoading(false);
    }
  }

  // Filter helper
  function inRange(dateStr: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (filterYear !== 'all' && d.getFullYear() !== Number(filterYear)) return false;
    if (filterMonth !== 'all' && d.getMonth() !== Number(filterMonth)) return false;
    if (filterDay !== 'all' && d.getDate() !== Number(filterDay)) return false;
    return true;
  }

  function resetFilters() {
    setFilterDay('all');
    setFilterMonth('all');
    setFilterYear('all');
  }

  const filteredOrders = useMemo(() => orders.filter(o => inRange(o.order_date)), [orders, filterMonth, filterYear]);
  const filteredExpenses = useMemo(() => expenses.filter(e => inRange(e.date)), [expenses, filterMonth, filterYear]);

  // Payment type totals
  const cashTotal = filteredOrders.filter(o => o.payment_method === 'cash').reduce((s, o) => s + Number(o.total_price || 0), 0);
  const cardTotal = filteredOrders.filter(o => o.payment_method === 'card').reduce((s, o) => s + Number(o.total_price || 0), 0);
  const bankTotal = filteredOrders.filter(o => o.payment_method === 'bank_transfer').reduce((s, o) => s + Number(o.total_price || 0), 0);

  // Translation helpers
  const statusTranslate = (s: string) => {
    const map: Record<string, string> = { not_started: t('notStarted'), started: t('started'), finished: t('finished'), paid: t('paid') };
    return map[s] || s;
  };
  const sourceTranslate = (s: string) => {
    const found = orderSources.find(src => src.value === s);
    if (found) return found.name;
    const map: Record<string, string> = { instagram: t('instagram'), facebook: t('facebook'), other: t('other'), referral: t('referral') };
    return map[s] || s;
  };
  const categoryTranslate = (c: string) => {
    const map: Record<string, string> = { advertising: t('advertising'), salary: t('salary'), logistics: t('logistics'), officeSupplies: t('officeSupplies'), other: t('other') };
    return map[c] || c;
  };

  // ---- NEW CHARTS DATA ----

  // 1. Daily Sales by days (revenue per day for selected month)
  const dailySalesByDays = useMemo(() => {
    const yr = filterYear !== 'all' ? Number(filterYear) : now.getFullYear();
    const mo = filterMonth !== 'all' ? Number(filterMonth) : now.getMonth();
    const map = new Map<number, number>();
    orders.forEach(o => {
      const d = new Date(o.order_date);
      if (d.getFullYear() === yr && d.getMonth() === mo) {
        const day = d.getDate();
        map.set(day, (map.get(day) || 0) + Number(o.total_price || 0));
      }
    });
    const maxDay = new Date(yr, mo + 1, 0).getDate();
    const result = [];
    for (let i = 1; i <= maxDay; i++) {
      result.push({ day: i, sales: map.get(i) || 0 });
    }
    return result;
  }, [orders, filterMonth, filterYear]);

  // 2b. Daily Profit by days (revenue - expenses per day for selected month)
  const dailyProfitByDays = useMemo(() => {
    const yr = filterYear !== 'all' ? Number(filterYear) : now.getFullYear();
    const mo = filterMonth !== 'all' ? Number(filterMonth) : now.getMonth();
    const revenueMap = new Map<number, number>();
    const expenseMap = new Map<number, number>();
    orders.forEach(o => {
      const d = new Date(o.order_date);
      if (d.getFullYear() === yr && d.getMonth() === mo) {
        const day = d.getDate();
        revenueMap.set(day, (revenueMap.get(day) || 0) + Number(o.total_price || 0));
      }
    });
    expenses.forEach(e => {
      const d = new Date(e.date);
      if (d.getFullYear() === yr && d.getMonth() === mo) {
        const day = d.getDate();
        expenseMap.set(day, (expenseMap.get(day) || 0) + Number(e.amount || 0));
      }
    });
    const maxDay = new Date(yr, mo + 1, 0).getDate();
    const result = [];
    for (let i = 1; i <= maxDay; i++) {
      result.push({ day: i, profit: (revenueMap.get(i) || 0) - (expenseMap.get(i) || 0) });
    }
    return result;
  }, [orders, expenses, filterMonth, filterYear]);

  // 3. Yearly Sales by months (total revenue per month for selected year)
  const yearlySalesByMonths = useMemo(() => {
    const yr = filterYear !== 'all' ? Number(filterYear) : now.getFullYear();
    const map = new Map<number, number>();
    orders.forEach(o => {
      const d = new Date(o.order_date);
      if (d.getFullYear() === yr) {
        map.set(d.getMonth(), (map.get(d.getMonth()) || 0) + Number(o.total_price || 0));
      }
    });
    return MONTH_KEYS.map((key, i) => ({ month: t(key), sales: map.get(i) || 0 }));
  }, [orders, filterYear, t]);

  // 4. Yearly Profit by months (revenue - expenses per month for selected year)
  const yearlyProfitByMonths = useMemo(() => {
    const yr = filterYear !== 'all' ? Number(filterYear) : now.getFullYear();
    const revenueMap = new Map<number, number>();
    const expenseMap = new Map<number, number>();
    orders.forEach(o => {
      const d = new Date(o.order_date);
      if (d.getFullYear() === yr) {
        revenueMap.set(d.getMonth(), (revenueMap.get(d.getMonth()) || 0) + Number(o.total_price || 0));
      }
    });
    expenses.forEach(e => {
      const d = new Date(e.date);
      if (d.getFullYear() === yr) {
        expenseMap.set(d.getMonth(), (expenseMap.get(d.getMonth()) || 0) + Number(e.amount || 0));
      }
    });
    return MONTH_KEYS.map((key, i) => ({
      month: t(key),
      profit: (revenueMap.get(i) || 0) - (expenseMap.get(i) || 0),
    }));
  }, [orders, expenses, filterYear, t]);

  // ---- PIE CHART DATA (with translations) ----

  // Source Distribution (from orders for consistency with Orders page)
  const sourceDistribution = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach(o => {
      const src = o.source || 'other';
      map.set(src, (map.get(src) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name: sourceTranslate(name), value }));
  }, [filteredOrders, orderSources, t]);

  // Expense Categories
  const expenseCategoriesData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + Number(e.amount || 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name: categoryTranslate(name), value }));
  }, [filteredExpenses, t]);

  // Order Status Distribution (translated)
  const completedWork = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach(o => {
      map.set(o.status, (map.get(o.status) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name: statusTranslate(name), value }));
  }, [filteredOrders, t]);

  // Paid vs Unpaid
  const paymentStatusData = useMemo(() => {
    const paid = filteredOrders.filter(o => o.status === 'paid').length;
    const unpaid = filteredOrders.length - paid;
    return [
      { name: t('paidOrders'), value: paid },
      { name: t('unpaidOrders'), value: unpaid },
    ];
  }, [filteredOrders, t]);

  // User Payment Distribution
  const userPaymentDistribution = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach(o => {
      const userName = userMap[o.created_by] || 'Unknown';
      map.set(userName, (map.get(userName) || 0) + Number(o.total_price || 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredOrders, userMap]);

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    orders.forEach(o => { const y = o.order_date?.slice(0, 4); if (y) years.add(y); });
    expenses.forEach(e => { const y = e.date?.slice(0, 4); if (y) years.add(y); });
    return Array.from(years).sort();
  }, [orders, expenses]);

  // Kassa balance handlers
  async function handleSaveBalance() {
    const newVal = Number(newBalance);
    if (isNaN(newVal)) return;

    // Log the change
    await supabase.from('kassa_balance_logs').insert({
      old_balance: kassaBalance,
      new_balance: newVal,
      note: balanceReason,
      changed_by: userProfile?.name || '',
    });

    if (kassaId) {
      // Update existing row
      await supabase.from('kassa_balance').update({ balance: newVal, updated_at: new Date().toISOString() }).eq('id', kassaId);
    } else {
      // No row exists — create one
      const { data } = await supabase.from('kassa_balance').insert({ balance: newVal, updated_at: new Date().toISOString() }).select().single();
      if (data) setKassaId(data.id);
    }

    setKassaBalance(newVal);
    setShowBalanceModal(false);
    setNewBalance('');
    setBalanceReason('');
    // Refresh logs
    const { data } = await supabase.from('kassa_balance_logs').select('*').order('created_at', { ascending: false }).limit(20);
    setBalanceLogs(data || []);
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-lg font-semibold">{t('accessDenied')}</p>
        <p className="text-sm text-[var(--text-secondary)]">{t('noPermission')}</p>
      </div>
    );
  }

  const SELECT_CLASS = 'border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20';
  const TOOLTIP_STYLE = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('analytics')}</h1>
        <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('analytics')}</h1>

      {/* Date Filter Bar */}
      <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <Calendar size={16} className="text-[var(--text-secondary)]" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">{t('day')}:</span>
            <select value={filterDay} onChange={e => setFilterDay(e.target.value)} className={SELECT_CLASS}>
              <option value="all">{t('all')}</option>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
              ))}
            </select>
          </div>

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

        {/* Kassa Balance — editable */}
        <div className="bg-[var(--card)] rounded-xl p-5 border border-[var(--border)] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">{t('kassaBalance')}</p>
              <p className={`text-2xl font-bold mt-1 ${kassaBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ₼{kassaBalance.toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className={kassaBalance >= 0 ? 'text-green-500' : 'text-red-500'}><Wallet size={24} /></div>
              <button
                onClick={() => { setNewBalance(String(kassaBalance)); setShowBalanceModal(true); }}
                className="p-1 rounded hover:bg-accent transition"
                title={t('editBalance')}
              >
                <Pencil size={14} className="text-[var(--text-secondary)]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Last Balance Update Info */}
      {balanceLogs.length > 0 && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-4 text-sm text-[var(--text-secondary)]">
          <p>
            {t('changedBy')}: <span className="font-medium text-[var(--text)]">{balanceLogs[0].changed_by}</span>
            {' — '}
            {new Date(balanceLogs[0].created_at).toLocaleString()}
            {balanceLogs[0].note && <> — {balanceLogs[0].note}</>}
          </p>
        </div>
      )}

      {/* Balance Logs (collapsible) */}
      {balanceLogs.length > 0 && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="w-full flex items-center justify-between p-4 text-sm font-semibold text-[var(--text-secondary)] hover:bg-accent/30 transition rounded-xl"
          >
            {t('balanceLog')}
            {showLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showLogs && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-b border-[var(--border)]">
                    <th className="text-left p-3 font-medium text-[var(--text-secondary)]">{t('date')}</th>
                    <th className="text-left p-3 font-medium text-[var(--text-secondary)]">{t('oldBalance')}</th>
                    <th className="text-left p-3 font-medium text-[var(--text-secondary)]">{t('newBalance')}</th>
                    <th className="text-left p-3 font-medium text-[var(--text-secondary)]">{t('reason')}</th>
                    <th className="text-left p-3 font-medium text-[var(--text-secondary)]">{t('changedBy')}</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceLogs.map(log => (
                    <tr key={log.id} className="border-b border-[var(--border)]">
                      <td className="p-3">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="p-3">₼{Number(log.old_balance).toLocaleString()}</td>
                      <td className="p-3 font-medium">₼{Number(log.new_balance).toLocaleString()}</td>
                      <td className="p-3 text-[var(--text-secondary)]">{log.note || '-'}</td>
                      <td className="p-3">{log.changed_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bar Charts — 2x2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Sales by Days */}
        <ChartCard title={t('dailySalesChart')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailySalesByDays}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={11} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`₼${Number(value).toLocaleString()}`]} />
              <Bar dataKey="sales" fill="#102041" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Daily Profit by Days */}
        <ChartCard title={t('dailyProfitChart')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyProfitByDays}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={11} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`₼${Number(value).toLocaleString()}`]} />
              <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Yearly Sales by Months */}
        <ChartCard title={t('yearlySales')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={yearlySalesByMonths}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`₼${Number(value).toLocaleString()}`]} />
              <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Yearly Profit by Months */}
        <ChartCard title={t('yearlyProfit')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={yearlyProfitByMonths}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`₼${Number(value).toLocaleString()}`]} />
              <Bar dataKey="profit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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
              <Pie data={expenseCategoriesData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label>
                {expenseCategoriesData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* User Payment Distribution */}
        <ChartCard title={t('paymentDistribution')}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={userPaymentDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ₼${Number(value).toLocaleString()}`}>
                {userPaymentDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₼${Number(value).toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Balance Edit Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowBalanceModal(false)}>
          <div className="bg-[var(--card)] rounded-xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{t('editBalance')}</h2>
              <button onClick={() => setShowBalanceModal(false)} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('kassaBalance')} ({t('oldBalance')})</label>
                <input value={`₼${kassaBalance.toLocaleString()}`} readOnly className={`${INPUT_CLASS} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('newBalance')}</label>
                <input type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)} step="0.01" className={INPUT_CLASS} autoFocus />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{t('reason')}</label>
                <input value={balanceReason} onChange={e => setBalanceReason(e.target.value)} className={INPUT_CLASS} />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowBalanceModal(false)}
                  className="px-5 py-2.5 rounded-lg text-sm border border-[var(--border)] hover:bg-accent transition font-medium">
                  {t('cancel')}
                </button>
                <button onClick={handleSaveBalance}
                  className="px-6 py-2.5 rounded-lg text-sm bg-primary text-white font-medium hover:opacity-90 transition">
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
