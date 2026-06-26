// LineChartCard.jsx
import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
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

const LineChartCard = ({ 
  title, 
  subtitle, 
  data = [], 
  xKey = 'month', 
  yKey = 'Score', 
  lineColor = '#2B5CE6',
  lines = [], // Pass multiple lines if needed: [{ key, color, name }]
  headerAction
}) => {
  const isMobile = useMobile();
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <ChartCard title={title} subtitle={subtitle} headerAction={headerAction}>
      {!hasData ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              allowDecimals={false}
            />
            <Tooltip />
            <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
            
            {lines.length > 0 ? (
              lines.map((line) => (
                <Line 
                  key={line.key}
                  type="monotone" 
                  dataKey={line.key} 
                  name={line.name || line.key}
                  stroke={line.color || lineColor} 
                  strokeWidth={2.5}
                  strokeDasharray={line.strokeDasharray}
                  activeDot={{ r: 6 }} 
                  dot={line.dot !== undefined ? line.dot : { r: 4, strokeWidth: 1.5 }}
                />
              ))
            ) : (
              <Line 
                type="monotone" 
                dataKey={yKey} 
                name={yKey}
                stroke={lineColor} 
                strokeWidth={2.5}
                activeDot={{ r: 6 }} 
                dot={{ r: 4, strokeWidth: 1.5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
};

export default LineChartCard;
