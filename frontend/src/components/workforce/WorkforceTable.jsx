import React from 'react';
import { Eye, Edit2, ArrowLeftRight, ToggleLeft, ToggleRight, Key } from 'lucide-react';
import { cleanDesignationText } from '../../utils/dashboardMappers';

const WorkforceTable = ({
  users = [],
  onView,
  onEdit,
  onTransfer,
  onStatusToggle,
  onResetPassword,
  currentUserRole
}) => {
  
  // Render badge helper for Category
  const renderCategoryBadge = (cat) => {
    if (!cat || cat === '—' || cat === 'N/A') return <span style={{ color: '#94A3B8' }}>—</span>;
    
    let styles = {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 600
    };

    switch (cat.toUpperCase()) {
      case 'A':
        styles = { ...styles, backgroundColor: '#E0F2FE', color: '#0369A1' }; // Light blue
        break;
      case 'B':
        styles = { ...styles, backgroundColor: '#F3E8FF', color: '#6B21A8' }; // Light purple
        break;
      case 'C':
        styles = { ...styles, backgroundColor: '#FEF3C7', color: '#B45309' }; // Light amber
        break;
      case 'D':
        styles = { ...styles, backgroundColor: '#FEE2E2', color: '#B91C1C' }; // Light red
        break;
      default:
        styles = { ...styles, backgroundColor: '#F1F5F9', color: '#475569' };
    }

    return <span style={styles}>Cat {cat}</span>;
  };

  // Render badge helper for Risk Level
  const renderRiskBadge = (risk) => {
    if (!risk || risk === 'NOT_CATEGORIZED') return <span style={{ color: '#94A3B8' }}>—</span>;
    
    let styles = {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    };

    switch (risk.toUpperCase()) {
      case 'LOW':
        styles = { ...styles, backgroundColor: '#DCFCE7', color: '#15803D' };
        break;
      case 'MEDIUM':
        styles = { ...styles, backgroundColor: '#FEF3C7', color: '#D97706' };
        break;
      case 'HIGH':
        styles = { ...styles, backgroundColor: '#FEE2E2', color: '#B91C1C' };
        break;
      default:
        styles = { ...styles, backgroundColor: '#F1F5F9', color: '#475569' };
    }

    return <span style={styles}>{risk}</span>;
  };

  return (
    <div className="staff-table-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '12px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)', overflow: 'hidden' }}>
      <div className="staff-table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
        <table className="staff-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #D7E3EF', backgroundColor: '#F8FAFC' }}>
              <th style={{ padding: '16px 24px', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
              <th style={{ padding: '16px 24px', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HRMS ID</th>
              <th style={{ padding: '16px 24px', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Station</th>
              <th style={{ padding: '16px 24px', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>
              <th style={{ padding: '16px 24px', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risk</th>
              <th style={{ padding: '16px 24px', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Latest Score</th>
              <th style={{ padding: '16px 24px', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
              <th style={{ padding: '16px 24px', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #EEF2F6', transition: 'background-color 0.2s' }} className="table-row-hover">
                
                {/* Name & Designation */}
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ color: '#0F172A', fontSize: '14px' }}>{item.full_name}</strong>
                    <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{cleanDesignationText(item.designation || item.role)}</span>
                  </div>
                </td>

                {/* HRMS ID */}
                <td style={{ padding: '16px 24px', fontSize: '13.5px', color: '#475569', fontFamily: 'monospace', fontWeight: 500 }}>
                  {item.hrms_id}
                </td>

                {/* Station */}
                <td style={{ padding: '16px 24px', fontSize: '13.5px', color: '#334155' }}>
                  {item.station_name ? (
                    <div>
                      <span style={{ fontWeight: 600 }}>{item.station_code}</span>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '1px' }}>{item.station_name}</span>
                    </div>
                  ) : (
                    <span style={{ color: '#94A3B8' }}>—</span>
                  )}
                </td>

                {/* Category Badge */}
                <td style={{ padding: '16px 24px' }}>
                  {renderCategoryBadge(item.category_code)}
                </td>

                {/* Risk Badge */}
                <td style={{ padding: '16px 24px' }}>
                  {renderRiskBadge(item.risk_level)}
                </td>

                {/* Latest Score */}
                <td style={{ padding: '16px 24px', fontSize: '13.5px', fontWeight: 600 }}>
                  {item.percentage !== null && item.percentage !== undefined ? (
                    <span style={{ color: Number(item.percentage) >= 80 ? '#16A34A' : Number(item.percentage) >= 50 ? '#D97706' : '#DC2626' }}>
                      {parseFloat(item.percentage).toFixed(1)}%
                    </span>
                  ) : (
                    <span style={{ color: '#94A3B8' }}>—</span>
                  )}
                </td>

                {/* Status */}
                <td style={{ padding: '16px 24px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: item.status === 'active' ? '#16A34A' : '#64748B'
                  }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: item.status === 'active' ? '#16A34A' : '#64748B'
                    }} />
                    {item.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>

                {/* Action Buttons */}
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                    
                    {/* View - Neutral */}
                    <button
                      title="View Profile"
                      onClick={() => onView(item)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                    >
                      <Eye size={14} />
                    </button>

                    {/* Edit - Blue */}
                    <button
                      title="Edit User"
                      onClick={() => onEdit(item)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#2563EB',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#DBEAFE'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; }}
                    >
                      <Edit2 size={14} />
                    </button>

                    {/* Transfer - Gold */}
                    <button
                      title="Transfer User"
                      onClick={() => onTransfer(item)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#FEF3C7',
                        border: '1px solid #FDE68A',
                        color: '#D97706',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#FDE68A'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FEF3C7'; }}
                    >
                      <ArrowLeftRight size={14} />
                    </button>

                    {/* Reset Password - Purple */}
                    {['SUPER_ADMIN', 'AOM'].includes(currentUserRole) && (
                      <button
                        title="Reset Password"
                        onClick={() => onResetPassword(item)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#F3E8FF',
                          border: '1px solid #E9D5FF',
                          color: '#7E22CE',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#E9D5FF'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#F3E8FF'; }}
                      >
                        <Key size={14} />
                      </button>
                    )}

                    {/* Activate/Deactivate Status Toggle */}
                    {item.status === 'active' ? (
                      <button
                        title="Deactivate Account"
                        onClick={() => onStatusToggle(item)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#FEE2E2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#FECACA'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FEE2E2'; }}
                      >
                        <ToggleRight size={14} />
                      </button>
                    ) : (
                      <button
                        title="Activate Account"
                        onClick={() => onStatusToggle(item)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#DCFCE7',
                          border: '1px solid #BBF7D0',
                          color: '#16A34A',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#BBF7D0'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#DCFCE7'; }}
                      >
                        <ToggleLeft size={14} />
                      </button>
                    )}

                  </div>
                </td>

              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#64748B', padding: '48px', fontSize: '14px' }}>
                  No workforce records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkforceTable;
