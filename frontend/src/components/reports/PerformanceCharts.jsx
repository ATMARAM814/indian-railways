import React from 'react';
import LineChartCard from '../charts/LineChartCard';
import StackedBarChartCard from '../charts/StackedBarChartCard';
import DonutChartCard from '../charts/DonutChartCard';

const PerformanceCharts = ({ performance }) => {
  if (!performance) return null;

  const { scoreTrend, completionTrend, categoryDistribution, approvalDistribution } = performance;

  // 1. Map score trend (LineChart expects yKey, and data [{ month, Score }])
  const formattedScoreTrend = Array.isArray(scoreTrend)
    ? scoreTrend.map(item => ({
        month: item.month,
        Score: Number(item.averageScore || 0)
      }))
    : [];

  // 2. Map completion trend (StackedBar expects completed and pending keys)
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

  // 3. Map category distribution (Donut expects [{ name, value }])
  const formattedCategoryData = Array.isArray(categoryDistribution)
    ? categoryDistribution.map(item => ({
        name: `Category ${item.category}`,
        value: Number(item.count || 0)
      }))
    : [];

  const categoryColors = ['#16A34A', '#2B5CE6', '#D97706', '#DC2626', '#64748B']; // A, B, C, D, Unassigned colors

  // 4. Map approval distribution (Donut expects [{ name, value }])
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
      {/* 1. Score trend chart */}
      <LineChartCard
        title="Average Score Trend"
        subtitle="Monthly score progression across all completed assessments"
        data={formattedScoreTrend}
        xKey="month"
        yKey="Score"
        lineColor="#2B5CE6"
      />

      {/* 2. Completion trend chart */}
      <StackedBarChartCard
        title="Assessment Completion Trend"
        subtitle="Ratio of completed vs pending assessments by month"
        data={formattedCompletionTrend}
        xKey="month"
        bars={completionBars}
        stacked={false}
      />

      {/* 3. Category Distribution */}
      <DonutChartCard
        title="Category Distribution"
        subtitle="Staff allocation across safety categories"
        data={formattedCategoryData}
        colors={categoryColors}
      />

      {/* 4. Approval Outcome Distribution */}
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
