'use client';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#102041', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#DBDDEA'];

export default function Analytics() {
  const { t, userProfile } = useApp();
  const [dailySales, setDailySales] = useState<{ date: string; sales: number }[]>([]);
  const [yearlySales, setYearlySales] = useState<{ year: string; sales: number }[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<{ date: string; revenue: number }[]>([]);
  const [yearlyRevenue, setYearlyRevenue] = useState<{ year: string; revenue: number }[]>([]);
  const [sourceDistribution, setSourceDistribution] = useState<{ name: string; value: number }[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<{ name: string; value: number }[]>([]);
  const [completedWork, setCompletedWork] = useState<{ name: string; value: number }[]>([]);

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
    const [ordersRes, expensesRes, customersRes] = await Promise.all([
      supabase.from('orders').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('customers').select('source'),
    ]);

    const orders = ordersRes.data || [];
    const expenses = expensesRes.data || [];
    const customers = customersRes.data || [];

    // Daily Sales (count of orders per day, last 7 days)
    const dailySalesMap = new Map<string, number>();
    orders.forEach((o) => {
      const d = new Date(o.order_date).toISOString().split('T')[0];
      dailySalesMap.set(d, (dailySalesMap.get(d) || 0) + 1);
    });
    setDailySales(
      Array.from(dailySalesMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-7)
        .map(([date, sales]) => ({ date: date.slice(5), sales }))
    );

    // Yearly Sales (count of orders per year)
    const yearlySalesMap = new Map<string, number>();
    orders.forEach((o) => {
      const y = new Date(o.order_date).getFullYear().toString();
      yearlySalesMap.set(y, (yearlySalesMap.get(y) || 0) + 1);
    });
    setYearlySales(
      Array.from(yearlySalesMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([year, sales]) => ({ year, sales }))
    );

    // Daily Revenue (sum of total_price per day, last 7 days)
    const dailyRevMap = new Map<string, number>();
    orders.forEach((o) => {
      const d = new Date(o.order_date).toISOString().split('T')[0];
      dailyRevMap.set(d, (dailyRevMap.get(d) || 0) + Number(o.total_price || 0));
    });
    setDailyRevenue(
      Array.from(dailyRevMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-7)
        .map(([date, revenue]) => ({ date: date.slice(5), revenue }))
    );

    // Yearly Revenue
    const yearlyRevMap = new Map<string, number>();
    orders.forEach((o) => {
      const y = new Date(o.order_date).getFullYear().toString();
      yearlyRevMap.set(y, (yearlyRevMap.get(y) || 0) + Number(o.total_price || 0));
    });
    setYearlyRevenue(
      Array.from(yearlyRevMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([year, revenue]) => ({ year, revenue }))
    );

    // Source Distribution (from customers)
    const srcMap = new Map<string, number>();
    customers.forEach((c) => {
      const src = c.source || 'other';
      srcMap.set(src, (srcMap.get(src) || 0) + 1);
    });
    setSourceDistribution(Array.from(srcMap.entries()).map(([name, value]) => ({ name, value })));

    // Expense Categories
    const expCatMap = new Map<string, number>();
    expenses.forEach((e) => {
      expCatMap.set(e.category, (expCatMap.get(e.category) || 0) + Number(e.amount || 0));
    });
    setExpenseCategories(Array.from(expCatMap.entries()).map(([name, value]) => ({ name, value })));

    // Completed Work (order status distribution)
    const statusMap = new Map<string, number>();
    orders.forEach((o) => {
      statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1);
    });
    setCompletedWork(Array.from(statusMap.entries()).map(([name, value]) => ({ name, value })));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('analytics')}</h1>

      {/* Sales Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={t('dailySales')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="sales" fill="#102041" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('yearlySales')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={yearlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Revenue Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={t('dailyRevenue')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('yearlyRevenue')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={yearlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
