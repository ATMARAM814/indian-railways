import React from 'react';
import StackedBarChartCard from '../charts/StackedBarChartCard';
import DonutChartCard from '../charts/DonutChartCard';

const PerformanceCharts = ({ performance }) => {
  if (!performance) return null;

  const { completionTrend, approvalDistribution } = performance;

  // 1. Map completion trend (StackedBar expects completed and pending keys)
  const formattedCompletionTrend = Array.isArray(completionTrend)
    ? completionTrend.map(item => ({
        month: item.month,
        completed: item.completed || 0,
        pending: item.pending || 0
      }))
    : [];

  const completionBars = [
    { key: 'completed', color: '#16A34A', name: 'Completed' },
    { key: 'pending', color: '#D97706', name: 'Pending' }
  ];

  // 2. Map approval distribution (Donut expects [{ name, value }])
  const formattedApprovalData = Array.isArray(approvalDistribution)
    ? approvalDistribution.map(item => {
        const name = (item.status === 'pending_approval' ? 'Pending' : item.status.charAt(0).toUpperCase() + item.status.slice(1));
        return {
          name,
          value: Number(item.count || 0)
        };
      })
    : [];

  const approvalColors = ['#16A34A', '#DC2626', '#D97706']; // Approved (Green), Rejected (Red), Pending (Yellow)

  return (
    <div className="charts-grid" style={{ marginBottom: '24px' }}>
      {/* 1. Completion trend chart */}
      <StackedBarChartCard
        title="Assessment Completion Trend"
        subtitle="Ratio of completed vs pending assessments by month"
        data={formattedCompletionTrend}
        xKey="month"
        bars={completionBars}
        stacked={false}
      />

      {/* 2. Approval Outcome Distribution */}
      <DonutChartCard
        title="Approval Outcome Distribution"
        subtitle="Outcomes of submitted evaluations in approval workflow"
        data={formattedApprovalData}
        colors={approvalColors}
      />
    </div>
  );
};

export default PerformanceCharts;
