// PerformanceTrendChart.jsx
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const PerformanceTrendChart = ({ data }) => {
  if (!data) return null;

  return (
    <div className="trend-card-full">
      <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
        Periodic Performance & Compliance Trend (Last 6 Months)
      </h3>
      <div style={{ width: '100%', height: '240px' }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #D7E3EF' }}
                formatter={(value, name) => [`${value}%`, name === 'averageScore' ? 'Avg Assessment Score' : 'Safety Compliance Rate']}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="plainline"
                formatter={(value) => <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{value === 'averageScore' ? 'Average Score' : 'Safety Compliance %'}</span>}
              />
              <Line 
                type="monotone" 
                dataKey="averageScore" 
                stroke="#0B2341" 
                strokeWidth={3} 
                activeDot={{ r: 6 }} 
                dot={{ strokeWidth: 2, r: 4 }} 
              />
              <Line 
                type="monotone" 
                dataKey="safetyCompliance" 
                stroke="#3B82F6" 
                strokeWidth={3} 
                activeDot={{ r: 6 }} 
                dot={{ strokeWidth: 2, r: 4 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94A3B8', fontSize: '13.5px' }}>
            No performance trend data recorded to display.
          </div>
        )}
      </div>
    </div>
  );
};
export default PerformanceTrendChart;
