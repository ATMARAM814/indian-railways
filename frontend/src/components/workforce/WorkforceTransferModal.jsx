import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { getWorkforceDetails } from '../../services/workforce.service';

const ROLE_HIERARCHY = {
  'PM': 1,
  'Shunting Master': 1,
  'Cabin Master': 1,
  'TM': 2,
  'SM': 3,
  'SS': 4,
  'SMS': 4,
  'TI': 5
};

const ROLE_DISPLAY_NAMES = {
  'PM': 'Pointsman',
  'Shunting Master': 'Shunting Master',
  'Cabin Master': 'Cabin Master',
  'TM': 'Train Manager',
  'SM': 'Station Master',
  'SS': 'SS (Station Master Incharge)',
  'SMS': 'SMS (Station Master Supervisor)',
  'TI': 'Traffic Inspector'
};

const WorkforceTransferModal = ({
  isOpen,
  onClose,
  onSubmit,
  user = null,
  stations = []
}) => {
  const [formData, setFormData] = useState({
    newStationId: '',
    newRole: '',
    tiAreaStationIds: [],
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fullUser, setFullUser] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        newStationId: '',
        newRole: user.role || '',
        tiAreaStationIds: [],
        reason: '',
        effectiveDate: new Date().toISOString().split('T')[0]
      });
      setError(null);
      setFullUser(null);

      const fetchDetails = async () => {
        setLoadingDetails(true);
        try {
          const res = await getWorkforceDetails(user.id);
          if (res.success && res.data) {
            setFullUser(res.data);
            setFormData(prev => ({ ...prev, newRole: res.data.role || user.role }));
          }
        } catch (err) {
          console.error("Failed to load user details for transfer", err);
        } finally {
          setLoadingDetails(false);
        }
      };

      fetchDetails();
    } else {
      setFullUser(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStationCheckboxChange = (stationId) => {
    setFormData(prev => {
      const checked = prev.tiAreaStationIds.includes(stationId);
      const newIds = checked 
        ? prev.tiAreaStationIds.filter(id => id !== stationId)
        : [...prev.tiAreaStationIds, stationId];
      return { ...prev, tiAreaStationIds: newIds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const isTi = formData.newRole === 'TI';

    if (!isTi && !formData.newStationId) {
      return setError('Please select a new station for the transfer');
    }

    if (isTi && formData.tiAreaStationIds.length === 0) {
      return setError('Please select at least one station for the TI Area');
    }

    const targetUser = fullUser || user || {};
    const currentStationId = targetUser.station_id || targetUser.stationId;
    if (!isTi && formData.newStationId === currentStationId) {
      return setError('The new station must be different from the current station');
    }

    setSubmitting(true);
    const result = await onSubmit(user.id, {
      newStationId: isTi ? null : formData.newStationId,
      newRole: formData.newRole,
      tiAreaStationIds: isTi ? formData.tiAreaStationIds : [],
      reason: formData.reason,
      effectiveDate: formData.effectiveDate
    });
    setSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.message || 'Failed to process employee transfer');
    }
  };

  const targetUser = fullUser || user || {};
  const currentStationName = targetUser.stationName || targetUser.station_name || (loadingDetails ? 'Loading...' : 'Unassigned');
  const stationCodeVal = targetUser.stationCode || targetUser.station_code;
  const currentStationCode = stationCodeVal ? `(${stationCodeVal})` : '';
  const currentTi = targetUser.hierarchy?.assignedTi?.full_name || (loadingDetails ? 'Loading...' : 'Unassigned');
  const currentAom = targetUser.hierarchy?.assignedAom?.full_name || (loadingDetails ? 'Loading...' : 'Unassigned');

  // Compute selectable roles
  const currentRole = targetUser.role || 'PM';
  const currentRank = ROLE_HIERARCHY[currentRole] || 1;
  const selectableRoles = Object.keys(ROLE_HIERARCHY).filter(r => ROLE_HIERARCHY[r] >= currentRank);

  const isNewRoleTi = formData.newRole === 'TI';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '550px',
        border: '1px solid #D7E3EF',
        boxShadow: '0 20px 25px -5px rgba(11, 35, 65, 0.1), 0 10px 10px -5px rgba(11, 35, 65, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #EEF2F6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Transfer & Promote Employee</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748B' }}>Reassign posting and set user designation role</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto' }}>
          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#B91C1C',
              fontSize: '13.5px',
              fontWeight: 500,
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          {/* Current Assignment Details */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid #E2E8F0'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Current Role</span>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{ROLE_DISPLAY_NAMES[currentRole] || currentRole}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Current Station</span>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{currentStationName} {currentStationCode}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Reporting TI</span>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{currentTi}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Reporting AOM</span>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{currentAom}</span>
              </div>
            </div>
          </div>

          {/* New Posting Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '20px' }}>
            
            {/* New Role Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>New Role / Promotion *</label>
              <select
                name="newRole"
                value={formData.newRole}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', outline: 'none', cursor: 'pointer' }}
              >
                {selectableRoles.map(role => (
                  <option key={role} value={role}>{ROLE_DISPLAY_NAMES[role] || role}</option>
                ))}
              </select>
            </div>

            {/* New Station Selection (if not TI) */}
            {!isNewRoleTi && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>New Station *</label>
                <select
                  name="newStationId"
                  value={formData.newStationId}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">Select New Station</option>
                  {stations.map(st => (
                    <option key={st.id} value={st.id}>{st.station_name} ({st.station_code})</option>
                  ))}
                </select>
              </div>
            )}

            {/* TI Area Selection (if promoted to TI) */}
            {isNewRoleTi && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  TI Area (Select Monitored Stations) *
                </label>
                <div style={{
                  border: '1px solid #D7E3EF',
                  borderRadius: '8px',
                  padding: '12px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {stations.map(st => {
                    const isChecked = formData.tiAreaStationIds.includes(st.id);
                    return (
                      <label key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleStationCheckboxChange(st.id)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{st.station_name} ({st.station_code})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reporting Hierarchy Auto Info */}
            <div style={{
              backgroundColor: '#FFFBEB',
              borderLeft: '4px solid #F59E0B',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '12px',
              color: '#78350F',
              lineHeight: '1.4'
            }}>
              <strong>Reporting Hierarchy Assignment note:</strong> 
              {isNewRoleTi 
                ? ' Promoting to Traffic Inspector will replace the previous TI at each of the selected stations.'
                : ' The new reporting Traffic Inspector (TI) and Assistant Operations Manager (AOM) will be dynamically mapped based on the assignments configured for the new station.'
              }
            </div>

            {/* Effective Date */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Effective Date</label>
              <input
                type="date"
                name="effectiveDate"
                value={formData.effectiveDate}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', outline: 'none' }}
              />
            </div>

            {/* Transfer Reason */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Reason for Reassignment *</label>
              <textarea
                name="reason"
                rows={3}
                placeholder="Enter formal reason for this reassignment / promotion..."
                value={formData.reason}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', outline: 'none', resize: 'vertical' }}
              />
            </div>

          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid #EEF2F6',
            paddingTop: '20px'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#475569',
                backgroundColor: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: '#D97706', // Gold color theme for transfers
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {submitting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Confirm Reassignment'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default WorkforceTransferModal;
