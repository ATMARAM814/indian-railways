import React from 'react';

const RADIUS = 58;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ScoreSummaryCard = ({ assessment, resolveCategory }) => {
  if (!assessment) return null;

  const pct   = parseFloat(assessment.percentage || 0);
  const category = resolveCategory(pct, assessment.alcoholic_status);

  const catConfig = {
    A: { color: '#10B981', label: 'Cat A — Outstanding',  desc: 'Highly competent to execute safety-critical railway operations.', bg: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', border: '#86EFAC' },
    B: { color: '#3B82F6', label: 'Cat B — Good',          desc: 'Competent. Demonstrated standard knowledge & response profiles.', bg: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', border: '#93C5FD' },
    C: { color: '#F59E0B', label: 'Cat C — Needs Training', desc: 'Requires monitoring and recommended targeted counselling.', bg: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border: '#FCD34D' },
    D: { color: '#EF4444', label: 'Cat D — Critical',      desc: 'Unsatisfactory performance. Mandatory safety training required.', bg: 'linear-gradient(135deg,#FEF2F2,#FEE2E2)', border: '#FCA5A5' },
  };

  const cfg = catConfig[category] || { color: '#94A3B8', label: 'N/A', desc: 'No category assigned.', bg: '#F8FAFC', border: '#E2E8F0' };

  const offset = CIRCUMFERENCE * (1 - pct / 100);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header strip */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-navy)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Performance Summary
        </span>
        <span style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 11,
          fontWeight: 700, background: cfg.bg, color: cfg.color,
          border: `1px solid ${cfg.border}`
        }}>
          Category {category}
        </span>
      </div>

      {/* SVG Ring */}
      <div className="score-ring-wrapper">
        <svg width="160" height="160" className="score-ring-svg">
          <defs>
            <filter id="ringGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <circle
            cx="80" cy="80" r={RADIUS}
            className="score-ring-track"
          />

          {/* Filled arc */}
          <circle
            cx="80" cy="80" r={RADIUS}
            className={`score-ring-fill cat-${category?.toLowerCase()}`}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ filter: 'url(#ringGlow)' }}
          />

          {/* Center text */}
          <text x="80" y="74" className="score-ring-center-pct">{pct.toFixed(0)}%</text>
          <text x="80" y="93" className="score-ring-center-label">SCORE</text>
        </svg>
      </div>

      {/* Category label */}
      <div style={{ textAlign: 'center', padding: '0 20px 20px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-navy)', marginBottom: 6 }}>
          {cfg.label}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: 260, margin: '0 auto' }}>
          {cfg.desc}
        </div>
      </div>

      {/* Score mini cards */}
      <div className="score-stat-row">
        <div className="score-stat-item">
          <span className="score-stat-label">Overall Score</span>
          <span className="score-stat-value">
            {assessment.total_score ?? '—'}
            <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}> / 100</span>
          </span>
        </div>
        <div className="score-stat-item">
          <span className="score-stat-label">MCQ Score</span>
          <span className="score-stat-value" style={{ color: '#EA580C' }}>
            {assessment.mcq_score ?? '—'}
            <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}> / 25</span>
          </span>
        </div>
        <div className="score-stat-item">
          <span className="score-stat-label">Checklist Score</span>
          <span className="score-stat-value" style={{ color: '#059669' }}>
            {assessment.evaluation_score ?? '—'}
            <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}> / 75</span>
          </span>
        </div>
        <div className="score-stat-item">
          <span className="score-stat-label">Percentage</span>
          <span className="score-stat-value" style={{ color: cfg.color }}>
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScoreSummaryCard;
