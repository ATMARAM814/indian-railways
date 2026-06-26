// DonutChartCard.jsx
import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';
import ChartCard from '../dashboard/ChartCard';
import EmptyState from '../dashboard/EmptyState';
import '../../styles/charts.css';

const DEFAULT_COLORS = ['#16A34A', '#2B5CE6', '#D97706', '#DC2626']; // A, B, C, D themed

const DonutChartCard = ({ 
  title, 
  subtitle, 
  data = [], 
  colors = DEFAULT_COLORS,
  headerAction
}) => {
  // Filter out items with value = 0 to avoid rendering issues
  const filteredData = Array.isArray(data) 
    ? data.filter(item => item.value > 0) 
    : [];
    
  const hasData = filteredData.length > 0;

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    if (!percent) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 15;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const originalIndex = data.findIndex(item => item.name === name);
    const color = colors[originalIndex] !== undefined ? colors[originalIndex] : DEFAULT_COLORS[originalIndex % DEFAULT_COLORS.length];
    
    return (
      <text 
        x={x} 
        y={y} 
        fill={color} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        style={{ fontSize: '12.5px', fontWeight: 600 }}
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartCard title={title} subtitle={subtitle} headerAction={headerAction}>
      {!hasData ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart key={JSON.stringify(filteredData)}>
            <Pie
              data={filteredData}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
              label={renderCustomLabel}
              labelLine={false}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {filteredData.map((entry, index) => {
                const originalIndex = data.findIndex(item => item.name === entry.name);
                const cellColor = colors[originalIndex] !== undefined ? colors[originalIndex] : DEFAULT_COLORS[originalIndex % DEFAULT_COLORS.length];
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={cellColor} 
                  />
                );
              })}
            </Pie>
            <Tooltip formatter={(value) => [`${value} Staff`, 'Count']} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
};

export default DonutChartCard;
