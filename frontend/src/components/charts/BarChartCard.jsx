// BarChartCard.jsx
import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  Rectangle,
  LabelList,
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

const BarChartCard = ({ 
  title, 
  subtitle, 
  data = [], 
  xKey = 'stationName', 
  yKey = 'Score', 
  yKeyName,
  barColor = '#0B2341',
  bars = [], // Support multiple bars for grouped chart: [{ key, color, name }]
  barSize = 40,
  headerAction,
  hideLegend = false,
  yInterval,
  height = 250
}) => {
  const isMobile = useMobile();
  const hasData = Array.isArray(data) && data.length > 0;
  const nameToUse = yKeyName || yKey;

  // Calculate custom ticks if yInterval is specified
  let ticks = undefined;
  let domain = undefined;
  if (yInterval && hasData) {
    let maxVal = 0;
    if (bars && bars.length > 0) {
      data.forEach(item => {
        bars.forEach(bar => {
          const val = Number(item[bar.key] || 0);
          if (val > maxVal) maxVal = val;
        });
      });
    } else {
      data.forEach(item => {
        const val = Number(item[yKey] || 0);
        if (val > maxVal) maxVal = val;
      });
    }
    // Pad maxVal to have at least one tick above it
    const numTicks = Math.ceil(maxVal / yInterval) + 1;
    ticks = Array.from({ length: numTicks }, (_, i) => i * yInterval);
    domain = [0, ticks[ticks.length - 1]];
  }

  return (
    <ChartCard title={title} subtitle={subtitle} headerAction={headerAction}>
      {!hasData ? (
        <EmptyState />
      ) : (
        <div className="chart-scroll-container">
          <div style={{ minWidth: isMobile ? `${Math.max(800, data.length * 130)}px` : 'auto', width: '100%' }}>
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={data} margin={{ top: 20, right: 15, left: 0, bottom: data.length > 5 ? 30 : 15 }} key={JSON.stringify(data)}>
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
              allowDecimals={false}
              ticks={ticks}
              domain={domain}
            />
            <Tooltip />
            {!hideLegend && <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />}
            
            {bars.length > 0 ? (
              bars.map((bar) => (
                <Bar 
                  key={bar.key}
                  dataKey={bar.key} 
                  name={bar.name || bar.key}
                  fill={bar.color || barColor} 
                  radius={[4, 4, 0, 0]} 
                  barSize={barSize}
                  isAnimationActive={true}
                  animationBegin={0}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              ))
            ) : (
              <Bar 
                dataKey={yKey} 
                name={nameToUse}
                fill={barColor} 
                barSize={barSize}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
                shape={(props) => (
                  <Rectangle 
                    {...props} 
                    fill={props.payload?.fill || props.fill || barColor} 
                    radius={[4, 4, 0, 0]} 
                  />
                )}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill || barColor} 
                  />
                ))}
                <LabelList dataKey={yKey} position="top" style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
          </div>
        </div>
      )}
    </ChartCard>
  );
};

export default BarChartCard;
