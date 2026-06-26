import React from 'react';
import { Target, Shield, Zap, Crown, Star, Smile } from 'lucide-react';

const DOMAIN_CONFIG = [
  { key: 'mcq_score',            name: 'MCQ Online Examination',          max: 25, color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', icon: Target  },
  { key: 'alertness_score',      name: 'Alertness & Reflexes Test',       max: 20, color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', icon: Zap    },
  { key: 'safety_record_score',  name: 'Safety Record & Rules Compliance',max: 15, color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', icon: Shield  },
  { key: 'leadership_score',     name: 'Leadership & Crisis Management',  max: 12, color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', icon: Crown  },
  { key: 'discipline_score',     name: 'Discipline & Conduct',            max: 10, color: '#EC4899', bg: '#FDF2F8', border: '#F9A8D4', icon: Star   },
  { key: 'appearance_score',     name: 'Appearance & Demeanor',           max:  8, color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD', icon: Smile  },
];

const PerformanceBreakdown = ({ assessment }) => {
  if (!assessment) return null;

  return (
    <div className="card" style={{ padding: '22px 24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border-light)'
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary-navy)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Domain Performance Breakdown
        </h3>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
          6 evaluation domains
        </span>
      </div>

      <div className="performance-list">
        {DOMAIN_CONFIG.map((dom) => {
          const score = assessment[dom.key] ?? 0;
          const pct   = dom.max > 0 ? (score / dom.max) * 100 : 0;
          const Icon  = dom.icon;

          return (
            <div key={dom.key} className="performance-item">
              {/* Label row */}
              <div className="performance-label-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                    background: dom.bg, border: `1px solid ${dom.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: dom.color
                  }}>
                    <Icon size={13} strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {dom.name}
                  </span>
                </div>
                <div style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                  background: dom.bg, color: dom.color, border: `1px solid ${dom.border}`,
                  whiteSpace: 'nowrap', flexShrink: 0
                }}>
                  {score} / {dom.max}
                  <span style={{ fontWeight: 500, opacity: 0.75, marginLeft: 3 }}>
                    ({pct.toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="performance-progress-bar">
                <div
                  className="performance-progress-fill"
                  style={{ width: `${pct}%`, backgroundColor: dom.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total row */}
      <div style={{
        marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-light)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          Total Score
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary-navy)' }}>
            {assessment.total_score ?? 0}
          </span>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
            / 100
          </span>
          <span style={{
            marginLeft: 8, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE'
          }}>
            {parseFloat(assessment.percentage || 0).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceBreakdown;
