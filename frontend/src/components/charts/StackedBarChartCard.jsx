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
import { useMobile } from '../../hooks/useMobile';
import '../../styles/charts.css';

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
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: data.length > 5 ? 25 : 0 }} key={JSON.stringify(data)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis 
              dataKey={xKey} 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              dy={isMobile ? 5 : 10} 
              interval={isMobile ? "preserveStartEnd" : 0}
              angle={isMobile ? -35 : 0}
              textAnchor={isMobile ? "end" : "middle"}
              height={isMobile ? 50 : 30}
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
      )}
    </ChartCard>
  );
};

export default StackedBarChartCard;
