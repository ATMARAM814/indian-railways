import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';

const WorkforceCreateModal = ({
  isOpen,
  onClose,
  onSubmit,
  stations = [],
  divisions = [],
  roleTitle,
  roleCode
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    hrmsId: '',
    phone: '',
    email: '',
    designation: '',
    stationId: '',
    divisionId: '',
    zone: '',
    categoryCode: '',
    employeeId: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Clear state on open/close
  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: '',
        hrmsId: '',
        phone: '',
        email: '',
        designation: '',
        stationId: '',
        divisionId: '',
        zone: '',
        categoryCode: '',
        employeeId: '',
        dateOfJoining: new Date().toISOString().split('T')[0],
        remarks: ''
      });
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-resolve Zone and Code if Division is selected
      if (name === 'divisionId' && value) {
        const selectedDiv = divisions.find(d => d.id === value);
        if (selectedDiv) {
          updated.zone = selectedDiv.zone || '';
        }
      }
      
      // Auto-resolve Division and Zone if Station is selected
      if (name === 'stationId' && value) {
        const selectedStation = stations.find(s => s.id === value);
        // Since stations list might not have division and zone nested, we can find a division that matches, or resolve.
        // But station doesn't contain division in getAllStations, so that's fine.
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!formData.fullName.trim()) return setError('Full Name is required');
    if (!formData.hrmsId.trim()) return setError('HRMS ID is required');
    
    // Station required for PM, SM, SS, Cabin Master, Shunting Master, Station Master Supervisor
    const needsStation = ['PM', 'SM', 'SS', 'Cabin Master', 'CABIN MASTER', 'Shunting Master', 'SHUNTING MASTER', 'SHM', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR'].includes(roleCode);
    if (needsStation && !formData.stationId) {
      return setError('Station Posting is required');
    }

    // Division required for AOM, TI
    const needsDivision = ['AOM', 'TI'].includes(roleCode);
    if (needsDivision && !formData.divisionId) {
      return setError('Division assignment is required');
    }

    setSubmitting(true);
    const result = await onSubmit(formData);
    setSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.message || 'Failed to create user');
    }
  };

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
        maxWidth: '650px',
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
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Add New {roleTitle}</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748B' }}>Add a new profile to the workforce registry</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px' }}>
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

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '20px'
          }}>
            
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Full Name *</label>
              <input
                type="text"
                name="fullName"
                placeholder="Enter full name"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', backgroundColor: '#F8FAFC', outline: 'none' }}
              />
            </div>

            {/* HRMS ID */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>HRMS ID *</label>
              <input
                type="text"
                name="hrmsId"
                placeholder="e.g. PM12345"
                value={formData.hrmsId}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', backgroundColor: '#F8FAFC', outline: 'none', textTransform: 'uppercase' }}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="Enter 10-digit number"
                value={formData.phone}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', backgroundColor: '#F8FAFC', outline: 'none' }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', backgroundColor: '#F8FAFC', outline: 'none' }}
              />
            </div>

            {/* Employee ID / Designation */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Employee ID</label>
              <input
                type="text"
                name="employeeId"
                placeholder="Enter Employee ID"
                value={formData.employeeId}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', backgroundColor: '#F8FAFC', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Designation</label>
              <input
                type="text"
                name="designation"
                placeholder="e.g. Pointsman Grade-I"
                value={formData.designation}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', backgroundColor: '#F8FAFC', outline: 'none' }}
              />
            </div>

            {/* Station dropdown for PM, SM, SS, Cabin Master, Shunting Master, Station Master Supervisor */}
            {['PM', 'SM', 'SS', 'Cabin Master', 'Shunting Master', 'Station Master Supervisor'].includes(roleCode) && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Station Posting *</label>
                <select
                  name="stationId"
                  value={formData.stationId}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', backgroundColor: '#F8FAFC', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">Select Station</option>
                  {stations.map(st => (
                    <option key={st.id} value={st.id}>{st.station_name} ({st.station_code})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Division dropdown for AOM, and TI */}
            {['AOM', 'TI', 'TM'].includes(roleCode) && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Division Assignment *</label>
                <select
                  name="divisionId"
                  value={formData.divisionId}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', backgroundColor: '#F8FAFC', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">Select Division</option>
                  {divisions.map(div => (
                    <option key={div.id} value={div.id}>{div.name} ({div.code})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Zone (Auto filled or selectable) */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Zone</label>
              <input
                type="text"
                name="zone"
                placeholder="e.g. WCR"
                value={formData.zone}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', backgroundColor: '#F8FAFC', outline: 'none' }}
              />
            </div>

            {/* Date of Joining */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Date of Joining</label>
              <input
                type="date"
                name="dateOfJoining"
                value={formData.dateOfJoining}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', backgroundColor: '#F8FAFC', outline: 'none' }}
              />
            </div>

            {/* Initial Category */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Safety Category</label>
              <select
                name="categoryCode"
                value={formData.categoryCode}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', backgroundColor: '#F8FAFC', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">No Initial Category</option>
                <option value="A">Category A</option>
                <option value="B">Category B</option>
                <option value="C">Category C</option>
                <option value="D">Category D</option>
              </select>
            </div>

          </div>

          {/* Posting Info Remarks */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Posting Information / Remarks</label>
            <textarea
              name="remarks"
              rows={3}
              placeholder="Enter details about initial posting, qualifications, or remarks..."
              value={formData.remarks}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', backgroundColor: '#F8FAFC', outline: 'none', resize: 'vertical' }}
            />
          </div>

          {/* Security Note */}
          <div style={{
            backgroundColor: '#EFF6FF',
            borderRadius: '8px',
            borderLeft: '4px solid #3B82F6',
            padding: '12px 16px',
            fontSize: '12.5px',
            color: '#1E3A8A',
            marginBottom: '24px',
            lineHeight: 1.5
          }}>
            <strong>Security Notice:</strong> The default password will automatically be set identical to the HRMS ID (e.g. <code>{formData.hrmsId || 'HRMSID'}</code>). The user will be required to change it on their first login.
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
                backgroundColor: '#1B365D',
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
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default WorkforceCreateModal;
