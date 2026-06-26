// HorizontalBarChartCard.jsx
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

const HorizontalBarChartCard = ({ 
  title, 
  subtitle, 
  data = [], 
  yKey = 'tiName', 
  xKey = 'Score', 
  barColor = '#3B82F6' 
}) => {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {!hasData ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart 
            data={data} 
            layout="vertical"
            margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
            key={JSON.stringify(data)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis 
              type="number" 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              type="category" 
              dataKey={yKey} 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              width={100}
            />
            <Tooltip />
            <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
            <Bar 
              dataKey={xKey} 
              name={xKey} 
              fill={barColor} 
              radius={[0, 4, 4, 0]} 
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
};

export default HorizontalBarChartCard;
