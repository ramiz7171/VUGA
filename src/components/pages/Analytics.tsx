'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#102041', '#DBDDEA', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const { t, userProfile } = useApp();
  const [revenueOverTime, setRevenueOverTime] = useState<{ date: string; revenue: number }[]>([]);
  const [profitTrends, setProfitTrends] = useState<{ date: string; profit: number }[]>([]);
  const [productSales, setProductSales] = useState<{ name: string; value: number }[]>([]);
  const [customerSources, setCustomerSources] = useState<{ name: string; value: number }[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => { fetchAnalytics(); }, []);

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-lg font-semibold">{t('accessDenied')}</p>
        <p className="text-sm text-[var(--text-secondary)]">{t('noPermission')}</p>
      </div>
    );
  }

  async function fetchAnalytics() {
    const [ordersRes, expensesRes, , customersRes] = await Promise.all([
      supabase.from('orders').select('*, product:products(name)'),
      supabase.from('expenses').select('*'),
      supabase.from('products').select('*'),
      supabase.from('customers').select('*'),
    ]);

    const orders = ordersRes.data || [];
    const expenses = expensesRes.data || [];
    const customers = customersRes.data || [];

    // Revenue over time (monthly)
    const revMap = new Map<string, number>();
    orders.forEach((o) => {
      const m = new Date(o.order_date).toISOString().slice(0, 7);
      revMap.set(m, (revMap.get(m) || 0) + Number(o.total_price || 0));
    });
    setRevenueOverTime(
      Array.from(revMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, revenue]) => ({ date, revenue }))
    );

    // Profit trends (monthly)
    const expMap = new Map<string, number>();
    expenses.forEach((e) => {
      const m = e.date?.slice(0, 7);
      if (m) expMap.set(m, (expMap.get(m) || 0) + Number(e.amount || 0));
    });
    const allMonths = new Set([...Array.from(revMap.keys()), ...Array.from(expMap.keys())]);
    setProfitTrends(
      Array.from(allMonths)
        .sort()
        .map((date) => ({ date, profit: (revMap.get(date) || 0) - (expMap.get(date) || 0) }))
    );

    // Product sales distribution
    const prodSalesMap = new Map<string, number>();
    orders.forEach((o) => {
      const name = o.product?.name || 'Unknown';
      prodSalesMap.set(name, (prodSalesMap.get(name) || 0) + Number(o.total_price || 0));
    });
    setProductSales(
      Array.from(prodSalesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }))
    );

    // Customer acquisition sources
    const srcMap = new Map<string, number>();
    customers.forEach((c) => {
      const src = c.source || 'other';
      srcMap.set(src, (srcMap.get(src) || 0) + 1);
    });
    setCustomerSources(Array.from(srcMap.entries()).map(([name, value]) => ({ name, value })));

    // Expense breakdown
    const expCatMap = new Map<string, number>();
    expenses.forEach((e) => {
      expCatMap.set(e.category, (expCatMap.get(e.category) || 0) + Number(e.amount || 0));
    });
    setExpenseBreakdown(Array.from(expCatMap.entries()).map(([name, value]) => ({ name, value })));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('analytics')}</h1>

      {/* Revenue Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={t('revenueOverTime')}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="revenue" stroke="#102041" strokeWidth={2} dot={{ fill: '#102041' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('profitTrends')}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={profitTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Product Sales & Customer Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={t('productSalesDistribution')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productSales} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} width={100} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('customerAcquisition')}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={customerSources} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                {customerSources.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={t('expenseBreakdown')}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
                {expenseBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('expenseBreakdown')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expenseBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
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
