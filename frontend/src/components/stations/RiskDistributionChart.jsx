// RiskDistributionChart.jsx
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export const RiskDistributionChart = ({ data }) => {
  if (!data) return null;

  const COLORS = {
    'Low Risk': '#10B981',
    'Medium Risk': '#F59E0B',
    'High Risk': '#EF4444',
    'Critical Risk': '#991B1B',
  };

  const chartData = data.filter(d => d.value > 0);

  // If no risk data yet, show empty placeholder slice
  const isEmpty = chartData.length === 0;
  const displayData = isEmpty ? [{ name: 'No Data', value: 1 }] : chartData;

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
        Workforce Risk Segment Distribution
      </h3>
      <div style={{ flex: 1, width: '100%', minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={isEmpty ? 0 : 3}
              dataKey="value"
            >
              {displayData.map((entry, index) => {
                const color = isEmpty ? '#E2E8F0' : (COLORS[entry.name] || '#64748B');
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Pie>
            <Tooltip
              enabled={!isEmpty}
              contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #D7E3EF' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default RiskDistributionChart;
