// CategoryDistributionChart.jsx
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

export const CategoryDistributionChart = ({ data }) => {
  if (!data) return null;

  const COLORS = {
    'Category A': '#0284C7',
    'Category B': '#7C3AED',
    'Category C': '#F59E0B',
    'Category D': '#EF4444',
  };

  const chartData = data.map(item => ({
    ...item,
    color: COLORS[item.name] || '#64748B'
  }));

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #D7E3EF',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '300px'
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
        Staff Category Distribution
      </h3>
      <div style={{ flex: 1, width: '100%', minHeight: '200px' }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="horizontal" margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
            <YAxis type="number" stroke="#64748B" fontSize={11} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #D7E3EF' }}
              formatter={(value) => [value, 'Staff Count']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default CategoryDistributionChart;
