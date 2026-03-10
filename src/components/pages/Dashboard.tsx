'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { DollarSign, ShoppingCart, Package, TrendingDown } from 'lucide-react';

const COLORS = ['#102041', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface StatCard {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

export default function Dashboard() {
  const { t, userProfile } = useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, expenses: 0, orders: 0, products: 0 });
  const [dailySales, setDailySales] = useState<{ date: string; total: number }[]>([]);
  const [monthlySales, setMonthlySales] = useState<{ month: string; total: number }[]>([]);
  const [dailyProfit, setDailyProfit] = useState<{ date: string; profit: number }[]>([]);
  const [monthlyProfit, setMonthlyProfit] = useState<{ month: string; profit: number }[]>([]);
  const [sourcesDist, setSourcesDist] = useState<{ name: string; value: number }[]>([]);
  const [expenseDist, setExpenseDist] = useState<{ name: string; value: number }[]>([]);
  const [orderStatusDist, setOrderStatusDist] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'moderator')) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-lg font-semibold">{t('accessDenied')}</p>
        <p className="text-sm text-[var(--text-secondary)]">{t('noPermission')}</p>
      </div>
    );
  }

  async function fetchData() {
    setLoading(true);
    try {
      const [ordersRes, expensesRes, productsRes, customersRes] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('products').select('id'),
        supabase.from('customers').select('source'),
      ]);

      if (ordersRes.error || expensesRes.error) return;

    const orders = ordersRes.data || [];
    const expenses = expensesRes.data || [];
    const products = productsRes.data || [];
    const customers = customersRes.data || [];

    // Stats
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total_price || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    setStats({ revenue: totalRevenue, expenses: totalExpenses, orders: orders.length, products: products.length });

    // Daily Sales (last 7 days)
    const dailyMap = new Map<string, number>();
    orders.forEach((o) => {
      const d = new Date(o.order_date).toISOString().split('T')[0];
      dailyMap.set(d, (dailyMap.get(d) || 0) + Number(o.total_price || 0));
    });
    setDailySales(
      Array.from(dailyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-7)
        .map(([date, total]) => ({ date: date.slice(5), total }))
    );

    // Monthly Sales
    const monthlyMap = new Map<string, number>();
    orders.forEach((o) => {
      const m = new Date(o.order_date).toISOString().slice(0, 7);
      monthlyMap.set(m, (monthlyMap.get(m) || 0) + Number(o.total_price || 0));
    });
    setMonthlySales(
      Array.from(monthlyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([month, total]) => ({ month, total }))
    );

    // Daily Profit
    const dailyExpMap = new Map<string, number>();
    expenses.forEach((e) => {
      dailyExpMap.set(e.date, (dailyExpMap.get(e.date) || 0) + Number(e.amount || 0));
    });
    setDailyProfit(
      Array.from(dailyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-7)
        .map(([date, total]) => ({ date: date.slice(5), profit: total - (dailyExpMap.get(date) || 0) }))
    );

    // Monthly Profit
    const monthlyExpMap = new Map<string, number>();
    expenses.forEach((e) => {
      const m = e.date?.slice(0, 7);
      if (m) monthlyExpMap.set(m, (monthlyExpMap.get(m) || 0) + Number(e.amount || 0));
    });
    setMonthlyProfit(
      Array.from(monthlyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([month, total]) => ({ month, profit: total - (monthlyExpMap.get(month) || 0) }))
    );

    // Source Distribution (from orders.source)
    const srcMap = new Map<string, number>();
    customers.forEach((c) => {
      const src = c.source || 'other';
      srcMap.set(src, (srcMap.get(src) || 0) + 1);
    });
    setSourcesDist(Array.from(srcMap.entries()).map(([name, value]) => ({ name, value })));

    // Expense Distribution
    const expCatMap = new Map<string, number>();
    expenses.forEach((e) => {
      expCatMap.set(e.category, (expCatMap.get(e.category) || 0) + Number(e.amount || 0));
    });
    setExpenseDist(Array.from(expCatMap.entries()).map(([name, value]) => ({ name, value })));

    // Order Status
    const statusMap = new Map<string, number>();
    orders.forEach((o) => {
      statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1);
    });
    setOrderStatusDist(Array.from(statusMap.entries()).map(([name, value]) => ({ name, value })));
    } finally {
      setLoading(false);
    }
  }

  const statCards: StatCard[] = [
    { label: t('totalRevenue'), value: `₼${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-500' },
    { label: t('totalExpenses'), value: `₼${stats.expenses.toLocaleString()}`, icon: TrendingDown, color: 'text-red-500' },
    { label: t('totalOrders'), value: stats.orders.toString(), icon: ShoppingCart, color: 'text-blue-500' },
    { label: t('totalProducts'), value: stats.products.toString(), icon: Package, color: 'text-purple-500' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-[var(--card)] rounded-xl p-5 border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <card.icon size={28} className={card.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={t('dailySales')}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="total" fill="#102041" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('monthlySales')}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('dailyProfit')}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyProfit}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('monthlyProfit')}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyProfit}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="profit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title={t('sourceDistribution')}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={sourcesDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                {sourcesDist.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('expenseDistribution')}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={expenseDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                {expenseDist.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('completedWork')}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={orderStatusDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                {orderStatusDist.map((_, i) => (
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--card)] rounded-xl p-5 border border-[var(--border)] shadow-sm">
      <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)]">{title}</h3>
      {children}
    </div>
  );
}
