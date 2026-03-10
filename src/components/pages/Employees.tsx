'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Calendar, RotateCcw } from 'lucide-react';
import { TranslationKey } from '@/lib/i18n';

const COLORS = ['#102041', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#DBDDEA'];

const MONTH_KEYS: TranslationKey[] = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

interface OrderRow {
  order_date: string;
  total_price: number;
  created_by: string;
}

export default function Employees() {
  const { t, userProfile } = useApp();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  const now = new Date();
  const [filterDay, setFilterDay] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(String(now.getMonth()));
  const [filterYear, setFilterYear] = useState<string>(String(now.getFullYear()));

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [ordersRes, usersRes] = await Promise.all([
      supabase.from('orders').select('order_date, total_price, created_by'),
      supabase.from('users').select('id, name'),
    ]);
    if (ordersRes.error) return;
    setOrders(ordersRes.data || []);
    if (usersRes.data) {
      const map: Record<string, string> = {};
      usersRes.data.forEach((u: { id: string; name: string }) => { map[u.id] = u.name; });
      setUserMap(map);
    }
  }

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

  const filteredOrders = useMemo(() => orders.filter(o => inRange(o.order_date)), [orders, filterDay, filterMonth, filterYear]);

  // Per-employee sales data for pie chart
  const employeeSalesData = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    filteredOrders.forEach(o => {
      const name = userMap[o.created_by] || o.created_by || 'Unknown';
      const prev = map.get(name) || { total: 0, count: 0 };
      map.set(name, { total: prev.total + Number(o.total_price || 0), count: prev.count + 1 });
    });
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      total: data.total,
      count: data.count,
    }));
  }, [filteredOrders, userMap]);

  // Per-employee bar chart data (sorted by total descending)
  const employeeBarData = useMemo(() => {
    return [...employeeSalesData].sort((a, b) => b.total - a.total);
  }, [employeeSalesData]);

  // Per-employee daily breakdown for selected period
  const employeeDailyData = useMemo(() => {
    const yr = filterYear !== 'all' ? Number(filterYear) : now.getFullYear();
    const mo = filterMonth !== 'all' ? Number(filterMonth) : now.getMonth();
    const maxDay = new Date(yr, mo + 1, 0).getDate();

    // Get unique employees
    const employees = new Set<string>();
    filteredOrders.forEach(o => {
      employees.add(userMap[o.created_by] || o.created_by || 'Unknown');
    });

    // Build per-day data
    const result = [];
    for (let d = 1; d <= maxDay; d++) {
      const entry: Record<string, number | string> = { day: d };
      employees.forEach(emp => { entry[emp] = 0; });

      filteredOrders.forEach(o => {
        const date = new Date(o.order_date);
        if (date.getDate() === d) {
          const name = userMap[o.created_by] || o.created_by || 'Unknown';
          entry[name] = (entry[name] as number) + Number(o.total_price || 0);
        }
      });
      result.push(entry);
    }
    return { data: result, employees: Array.from(employees) };
  }, [filteredOrders, userMap, filterMonth, filterYear]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    orders.forEach(o => { const y = o.order_date?.slice(0, 4); if (y) years.add(y); });
    return Array.from(years).sort();
  }, [orders]);

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-lg font-semibold">{t('accessDenied')}</p>
        <p className="text-sm text-[var(--text-secondary)]">{t('noPermission')}</p>
      </div>
    );
  }

  const SELECT_CLASS = 'border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--bg)] outline-none focus:ring-2 focus:ring-primary/20';
  const TOOLTIP_STYLE = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('employees')}</h1>

      {/* Filters */}
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

      {/* Employee Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {employeeBarData.map((emp, i) => (
          <div key={emp.name} className="bg-[var(--card)] rounded-xl p-5 border border-[var(--border)] shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                {emp.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{emp.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{emp.count} {t('orderCount').toLowerCase()}</p>
              </div>
            </div>
            <p className="text-xl font-bold text-primary">₼{emp.total.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Total Sales per Employee */}
        <div className="bg-[var(--card)] rounded-xl p-5 border border-[var(--border)] shadow-sm">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)]">{t('employeeSales')} — {t('totalSales')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={employeeBarData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" fontSize={12} width={100} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`₼${Number(value).toLocaleString()}`]} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {employeeBarData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sales Distribution Pie */}
        <div className="bg-[var(--card)] rounded-xl p-5 border border-[var(--border)] shadow-sm">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)]">{t('employeeSales')} — %</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={employeeSalesData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="total"
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {employeeSalesData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₼${Number(value).toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Breakdown per Employee (stacked bar) */}
        <div className="bg-[var(--card)] rounded-xl p-5 border border-[var(--border)] shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)]">{t('employeeSales')} — {t('day')}</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={employeeDailyData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={11} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`₼${Number(value).toLocaleString()}`]} />
              <Legend />
              {employeeDailyData.employees.map((emp, i) => (
                <Bar key={emp} dataKey={emp} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === employeeDailyData.employees.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
