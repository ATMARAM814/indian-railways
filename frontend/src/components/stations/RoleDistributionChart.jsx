import React from 'react';
import { ResponsiveContainer, BarChart, Bar, Rectangle, Cell, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import useMobile from '../../hooks/useMobile';

export const RoleDistributionChart = ({ data }) => {
  const isMobile = useMobile();
  if (!data) return null;

  return (
    <div className="trend-card-full" style={{ minHeight: '320px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
          Role-wise Staff Distribution
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: '#64748B' }}>
          Designation breakdown of safety personnel
        </p>
      </div>
      <div style={{ width: '100%', height: '240px' }}>
        {data.length > 0 ? (
          <div className="chart-scroll-container">
            <div style={{ minWidth: isMobile ? `${Math.max(800, data.length * 130)}px` : 'auto', width: '100%' }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} key={JSON.stringify(data)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="role" 
                stroke="#64748B" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                dy={10} 
                interval={0}
                textAnchor="middle"
                height={30}
              />
              <YAxis 
                stroke="#64748B" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                dx={-5} 
                allowDecimals={false}
              />
              <Tooltip formatter={(value) => [value, 'Staff Count']} />
              <Bar 
                dataKey="Count" 
                name="Staff Count"
                fill="#0B2341" 
                barSize={40}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
                shape={(props) => (
                  <Rectangle 
                    {...props} 
                    fill={props.payload?.fill || props.fill || "#0B2341"} 
                    radius={[4, 4, 0, 0]} 
                  />
                )}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill || "#0B2341"} 
                  />
                ))}
                <LabelList dataKey="Count" position="top" style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94A3B8', fontSize: '13.5px' }}>
            No workforce roles to display.
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleDistributionChart;
