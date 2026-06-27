// StackedBarChartCard.jsx
import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import ChartCard from '../dashboard/ChartCard';
import EmptyState from '../dashboard/EmptyState';
import '../../styles/charts.css';
import useMobile from '../../hooks/useMobile';

const DEFAULT_STACK_BARS = [
  { key: 'Category A', color: '#16A34A', name: 'Cat A' },
  { key: 'Category B', color: '#2B5CE6', name: 'Cat B' },
  { key: 'Category C', color: '#D97706', name: 'Cat C' },
  { key: 'Category D', color: '#DC2626', name: 'Cat D' }
];

const StackedBarChartCard = ({ 
  title, 
  subtitle, 
  data = [], 
  xKey = 'stationName', 
  bars = DEFAULT_STACK_BARS,
  stacked = true
}) => {
  const isMobile = useMobile();
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {!hasData ? (
        <EmptyState />
      ) : (
        <div className="chart-scroll-container">
          <div style={{ minWidth: isMobile ? `${Math.max(800, data.length * 130)}px` : 'auto', width: '100%' }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} margin={{ top: 10, right: 15, left: 0, bottom: data.length > 5 ? 30 : 15 }} key={JSON.stringify(data)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis 
              dataKey={xKey} 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              dy={10} 
              angle={0}
              textAnchor="middle"
              height={30}
              interval={0}
            />
            <YAxis 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              dx={-5} 
            />
            <Tooltip />
            <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
            
            {bars.map((bar) => (
              <Bar 
                key={bar.key}
                dataKey={bar.key} 
                name={bar.name || bar.key}
                stackId={stacked ? "stack" : undefined} 
                fill={bar.color} 
                radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
          </div>
        </div>
      )}
    </ChartCard>
  );
};

export default StackedBarChartCard;
