'use client';

import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LabelList,
} from 'recharts';
import type { LegendPayload } from 'recharts/types/component/DefaultLegendContent';

type FinancialData = {
  sold: {
    amount: number;
    paid: number;
    balance: number;
  };
  notSold: {
    upcoming: number;
    available: number;
    reserved: number;
  };
};

export default function FinancialSummary() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancial();
  }, []);

  const fetchFinancial = async () => {
    try {
      const response = await fetch('/api/dashboard/financial');
      if (!response.ok) throw new Error('Failed to load');
      const financial = await response.json();
      setData(financial);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">Financial Summary</h2>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M AMD`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K AMD`;
    }
    return `${amount.toFixed(0)} AMD`;
  };

  // Расчеты
  const totalSold = data.sold.amount;
  const totalNotSold = data.notSold.upcoming + data.notSold.available + data.notSold.reserved;
  const totalPortfolio = totalSold + totalNotSold;
  const soldPercentage = totalPortfolio > 0 ? (totalSold / totalPortfolio) * 100 : 0;
  const paidPercentage = totalSold > 0 ? (data.sold.paid / totalSold) * 100 : 0;
  const balancePercentage = totalSold > 0 ? (data.sold.balance / totalSold) * 100 : 0;

  // Данные для круговой диаграммы
  const pieData = [
    { name: 'Sold', value: totalSold, color: '#3b82f6' },
    { name: 'Available', value: data.notSold.available, color: '#10b981' },
    { name: 'Reserved', value: data.notSold.reserved, color: '#f59e0b' },
    { name: 'Upcoming', value: data.notSold.upcoming, color: '#9ca3af' },
  ].filter(item => item.value > 0);

  const COLORS = pieData.map(item => item.color);

  return (
    <div className="card p-6">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Financial Summary</h2>
      
      {/* Total Portfolio Overview */}
      <div className="mb-6 rounded-xl border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Total Portfolio Value</h3>
          <p className="text-3xl font-bold text-gray-900">{formatAmount(totalPortfolio)}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-medium text-gray-500">Sold</p>
            <p className="text-xl font-bold text-blue-600">{formatAmount(totalSold)}</p>
            <p className="mt-1 text-xs text-gray-500">{soldPercentage.toFixed(1)}% of portfolio</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-medium text-gray-500">Not Sold</p>
            <p className="text-xl font-bold text-gray-700">{formatAmount(totalNotSold)}</p>
            <p className="mt-1 text-xs text-gray-500">{(100 - soldPercentage).toFixed(1)}% of portfolio</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-medium text-gray-500">Sales Progress</p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${soldPercentage}%` }}
              ></div>
            </div>
            <p className="mt-1 text-xs text-gray-500">{soldPercentage.toFixed(1)}% sold</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sold Section - Expanded */}
        <div className="lg:col-span-2 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-600"></div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-blue-900">
              Sold Apartments
            </h3>
          </div>
          <div className="space-y-6">
            <div>
              <p className="mb-1 text-xs font-medium text-blue-700">Total Contract Value</p>
              <p className="text-3xl font-bold text-blue-900">
                {formatAmount(data.sold.amount)}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-white/60 p-4">
                <p className="mb-1 text-xs font-medium text-blue-700">Paid</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatAmount(data.sold.paid)}
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-200">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${paidPercentage}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-xs text-blue-600">{paidPercentage.toFixed(1)}% paid</p>
              </div>
              <div className="rounded-lg bg-white/60 p-4">
                <p className="mb-1 text-xs font-medium text-blue-700">Outstanding Balance</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatAmount(data.sold.balance)}
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-200">
                  <div
                    className="h-full bg-blue-800 transition-all duration-500"
                    style={{ width: `${balancePercentage}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-xs text-blue-600">{balancePercentage.toFixed(1)}% remaining</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-blue-200 pt-4">
              <div className="text-center">
                <p className="text-xs font-medium text-blue-700">Payment Status</p>
                <p className="mt-1 text-sm font-bold text-blue-900">
                  {paidPercentage >= 100 ? 'Fully Paid' : paidPercentage >= 50 ? 'Partially Paid' : 'Initial Payment'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-blue-700">Collection Rate</p>
                <p className="mt-1 text-sm font-bold text-blue-900">{paidPercentage.toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-blue-700">Outstanding</p>
                <p className="mt-1 text-sm font-bold text-blue-900">{balancePercentage.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700">
            Portfolio Distribution
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  label={(props: { percent?: number }) => {
                    const { percent } = props;
                    if (percent !== undefined && percent > 0.05) {
                      return `${(percent * 100).toFixed(0)}%`;
                    }
                    return '';
                  }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number | undefined) => value ? formatAmount(value) : ''}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={60}
                  formatter={(value: string, entry: LegendPayload) => {
                    const percent = (
                      entry.payload as { percent?: number } | undefined
                    )?.percent;
                    return `${value}: ${percent ? (percent * 100).toFixed(0) : 0}%`;
                  }}
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Not Sold Section - Expanded */}
      <div className="mt-6 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-600"></div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
            Not Sold Apartments
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border-2 border-gray-300 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-gray-400"></div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Upcoming</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatAmount(data.notSold.upcoming)}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {totalPortfolio > 0 ? ((data.notSold.upcoming / totalPortfolio) * 100).toFixed(1) : 0}% of total
            </p>
          </div>
          <div className="rounded-lg border-2 border-green-300 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Available</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatAmount(data.notSold.available)}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {totalPortfolio > 0 ? ((data.notSold.available / totalPortfolio) * 100).toFixed(1) : 0}% of total
            </p>
          </div>
          <div className="rounded-lg border-2 border-yellow-300 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reserved</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatAmount(data.notSold.reserved)}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {totalPortfolio > 0 ? ((data.notSold.reserved / totalPortfolio) * 100).toFixed(1) : 0}% of total
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
