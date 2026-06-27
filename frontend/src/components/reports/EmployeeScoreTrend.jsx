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
import useMobile from '../../hooks/useMobile';

const EmployeeScoreTrend = ({ scoreTrend }) => {
  const isMobile = useMobile();
  const hasData = Array.isArray(scoreTrend) && scoreTrend.length > 0;

  // Format date to local date string for the trend chart
  const formattedData = hasData 
    ? scoreTrend.map((item, idx) => ({
        date: item.date ? new Date(item.date).toLocaleDateString('en-GB') : `Assmt ${idx + 1}`,
        Score: Number(item.score || 0)
      }))
    : [];

  return (
    <ChartCard 
      title="Assessment Score Progression" 
      subtitle="Tracking final scores across all completed cycles"
    >
      {!hasData ? (
        <div className="py-12 text-center text-slate-500">
          No assessment history available yet.
        </div>
      ) : (
        <div className="chart-scroll-container">
          <div style={{ minWidth: isMobile ? `${Math.max(800, formattedData.length * 130)}px` : 'auto', width: '100%' }}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              dy={10} 
            />
            <YAxis 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              dx={-5} 
              domain={[0, 100]}
              allowDecimals={false}
            />
            <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
            <Line 
              type="monotone" 
              dataKey="Score" 
              name="Evaluation Score"
              stroke="#2B5CE6" 
              strokeWidth={2.5}
              activeDot={{ r: 6 }} 
              dot={{ r: 4, strokeWidth: 1.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
          </div>
        </div>
      )}
    </ChartCard>
  );
};

export default EmployeeScoreTrend;
