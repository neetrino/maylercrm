'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatAmd, formatAmdNumber } from '@/lib/formatAmd';

type TimelineData = {
  month: string;
  count: number;
  amount: number;
};

export default function SalesTimeline() {
  const [data, setData] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const response = await fetch('/api/dashboard/timeline');
      if (!response.ok) throw new Error('Failed to load');
      const timeline = await response.json();
      setData(timeline);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">Sales Timeline by Month</h2>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const chartData = data.map((item) => ({
    month: formatMonth(item.month),
    monthRaw: item.month, // Сохраняем оригинальный формат для сортировки
    'Deals Count': item.count,
    'Amount (AMD)': item.amount,
  }));

  // Автоматическая настройка отображения меток на оси X
  const dataLength = chartData.length;
  // Если данных больше 12 месяцев, показываем метки через интервал
  const tickInterval = dataLength > 24 ? Math.ceil(dataLength / 12) : dataLength > 12 ? 2 : 1;
  // Наклон меток если данных много
  const angle = dataLength > 18 ? -45 : 0;
  const textAnchor = dataLength > 18 ? 'end' : 'middle';
  const tickMargin = dataLength > 18 ? 10 : 5;

  return (
    <div className="card p-6">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Sales Timeline by Month</h2>
      
      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No sales data available
        </div>
      ) : (
        <div className="space-y-6">
          {/* Bar Chart - Deals Count */}
          <div>
            <h3 className="mb-4 text-sm font-medium text-gray-700">Number of Deals</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  angle={angle}
                  textAnchor={textAnchor}
                  height={angle !== 0 ? 60 : 30}
                  interval={tickInterval === 1 ? 0 : tickInterval - 1}
                  tickMargin={tickMargin}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar 
                  dataKey="Deals Count" 
                  fill="#3b82f6" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart - Amount */}
          <div>
            <h3 className="mb-4 text-sm font-medium text-gray-700">Sales Amount</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  angle={angle}
                  textAnchor={textAnchor}
                  height={angle !== 0 ? 60 : 30}
                  interval={tickInterval === 1 ? 0 : tickInterval - 1}
                  tickMargin={tickMargin}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v: number) => formatAmdNumber(v)}
                />
                <Tooltip 
                  formatter={(value: number | undefined) =>
                    value !== undefined ? formatAmd(value) : ''
                  }
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Amount (AMD)" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Data table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Month
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Deals Count
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.map((item) => (
                  <tr key={item.month} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {formatMonth(item.month)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                      {item.count}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      {formatAmd(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
