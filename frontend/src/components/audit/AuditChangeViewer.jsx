import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Database } from 'lucide-react';

const AuditChangeViewer = ({ oldData, newData }) => {
  const [showRawOld, setShowRawOld] = useState(false);
  const [showRawNew, setShowRawNew] = useState(false);

  // Helper to check if value is an object
  const isObject = (val) => val !== null && typeof val === 'object';

  // Helper to format values for display
  const formatVal = (val) => {
    if (val === null || val === undefined) return <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>null</span>;
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (isObject(val)) return JSON.stringify(val);
    return String(val);
  };

  // Build key comparison list
  const getComparisonData = () => {
    const keys = new Set();
    const result = [];

    const parseObjectKeys = (obj) => {
      if (isObject(obj)) {
        Object.keys(obj).forEach((k) => keys.add(k));
      }
    };

    parseObjectKeys(oldData);
    parseObjectKeys(newData);

    const sortedKeys = Array.from(keys).sort();

    sortedKeys.forEach((key) => {
      const oldVal = oldData ? oldData[key] : undefined;
      const newVal = newData ? newData[key] : undefined;

      // Only display if they actually changed
      const oldStr = isObject(oldVal) ? JSON.stringify(oldVal) : String(oldVal);
      const newStr = isObject(newVal) ? JSON.stringify(newVal) : String(newVal);

      if (oldStr !== newStr) {
        let changeType = 'modified'; // 'added', 'removed', 'modified'
        if (oldVal === undefined || oldVal === null) changeType = 'added';
        else if (newVal === undefined || newVal === null) changeType = 'removed';

        result.push({
          key,
          oldValue: oldVal,
          newValue: newVal,
          changeType,
        });
      }
    });

    return result;
  };

  const changes = getComparisonData();
  const hasChanges = changes.length > 0;

  // CSS definitions for visual highlight
  const getRowBackground = (type) => {
    if (type === 'added') return '#F0FDF4'; // light green
    if (type === 'removed') return '#FEF2F2'; // light red
    return '#FFFBEB'; // light yellow for modification
  };

  const getBadgeStyle = (type) => {
    if (type === 'added') return { bg: '#DCFCE7', color: '#15803D', label: 'Added' };
    if (type === 'removed') return { bg: '#FEE2E2', color: '#B91C1C', label: 'Removed' };
    return { bg: '#FEF3C7', color: '#B45309', label: 'Modified' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* 1. KEY VALUE COMPARISON TABLE */}
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.08)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0B2341', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={16} />
          State Change Comparison
        </h3>

        {!hasChanges ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1', fontSize: '13.5px' }}>
            No state properties or changes were recorded for this action.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', width: '25%' }}>Property / Field</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', width: '15%' }}>Change Type</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', width: '30%' }}>Old Value</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', width: '30%' }}>New Value</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((item, idx) => {
                  const badge = getBadgeStyle(item.changeType);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: getRowBackground(item.changeType) }}>
                      {/* Property */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>
                        {item.key}
                      </td>

                      {/* Change Type Badge */}
                      <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          fontSize: '10px',
                          fontWeight: 700,
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          backgroundColor: badge.bg,
                          color: badge.color,
                        }}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Old Value */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', wordBreak: 'break-all' }}>
                        {formatVal(item.oldValue)}
                      </td>

                      {/* New Value */}
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#0F172A', fontWeight: 500, wordBreak: 'break-all' }}>
                        {formatVal(item.newValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. RAW JSON COLLAPSIBLES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Old Data Raw */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.08)' }}>
          <button
            onClick={() => setShowRawOld(!showRawOld)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              padding: 0,
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0B2341' }}>Raw Old State JSON</span>
            {showRawOld ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showRawOld && (
            <pre style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              overflowX: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#334155',
              maxHeight: '300px',
            }}>
              {oldData ? JSON.stringify(oldData, null, 2) : 'null'}
            </pre>
          )}
        </div>

        {/* New Data Raw */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(11, 35, 65, 0.08)' }}>
          <button
            onClick={() => setShowRawNew(!showRawNew)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              padding: 0,
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0B2341' }}>Raw New State JSON</span>
            {showRawNew ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showRawNew && (
            <pre style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              overflowX: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#334155',
              maxHeight: '300px',
            }}>
              {newData ? JSON.stringify(newData, null, 2) : 'null'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditChangeViewer;
