import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';

const WorkforceEditModal = ({
  isOpen,
  onClose,
  onSubmit,
  user = null,
  stations = [],
  roleCode
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    hrmsId: '',
    phone: '',
    email: '',
    designation: '',
    stationId: '',
    categoryCode: '',
    pmeDue: '',
    pmeDone: '',
    refDue: '',
    refDone: ''
  });

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        fullName: user.full_name || '',
        hrmsId: user.hrms_id || '',
        phone: user.phone || '',
        email: user.email || '',
        designation: user.designation || '',
        stationId: user.station_id || user.stationId || '',
        categoryCode: user.category_code || user.categoryCode || '',
        pmeDue: user.pme_due ? user.pme_due.substring(0, 10) : '',
        pmeDone: user.pme_done ? user.pme_done.substring(0, 10) : '',
        refDue: user.ref_due ? user.ref_due.substring(0, 10) : '',
        refDone: user.ref_done ? user.ref_done.substring(0, 10) : ''
      });
      setError(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    
    const result = await onSubmit(user.id, formData);
    setSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.message || 'Failed to update user details');
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
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>Edit Workforce User</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748B' }}>Modify contact, category, or designation details</p>
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

          {/* Readonly Identifiers Section */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Designated Role</span>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1B365D', backgroundColor: '#E2E8F0', padding: '4px 8px', borderRadius: '6px' }}>{user.role}</span>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', outline: 'none' }}
              />
            </div>

            {/* HRMS ID */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>HRMS ID</label>
              <input
                type="text"
                name="hrmsId"
                value={formData.hrmsId}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', outline: 'none', fontFamily: 'monospace' }}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', outline: 'none' }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', outline: 'none' }}
              />
            </div>

            {/* Designation */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', outline: 'none' }}
              />
            </div>

            {/* Safety Category */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Safety Category</label>
              <select
                name="categoryCode"
                value={formData.categoryCode}
                onChange={handleInputChange}
                disabled
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', cursor: 'not-allowed', backgroundColor: '#F8FAFC', color: '#64748B' }}
              >
                <option value="">No Category</option>
                <option value="A">Category A</option>
                <option value="B">Category B</option>
                <option value="C">Category C</option>
                <option value="D">Category D</option>
              </select>
            </div>

            {/* PME Due Date */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>PME Due Date</label>
              <input
                type="date"
                name="pmeDue"
                value={formData.pmeDue}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', outline: 'none' }}
              />
            </div>

            {/* PME Done Date */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>PME Done Date</label>
              <input
                type="date"
                name="pmeDone"
                value={formData.pmeDone}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', outline: 'none' }}
              />
            </div>

            {/* REF Due Date */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>REF Due Date</label>
              <input
                type="date"
                name="refDue"
                value={formData.refDue}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', outline: 'none' }}
              />
            </div>

            {/* REF Done Date */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>REF Done Date</label>
              <input
                type="date"
                name="refDone"
                value={formData.refDone}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', outline: 'none' }}
              />
            </div>

          </div>

          {/* Station selection if station-based */}
          {['PM', 'TM', 'SM', 'SS', 'TNC', 'Cabin Master', 'CABIN MASTER', 'Shunting Master', 'SHUNTING MASTER', 'SHM', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR'].includes(roleCode) && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Station Posting</label>
              <select
                name="stationId"
                value={formData.stationId}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #D7E3EF', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">Select Station</option>
                {stations.map(st => (
                  <option key={st.id} value={st.id}>{st.station_name} ({st.station_code})</option>
                ))}
              </select>
            </div>
          )}

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
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default WorkforceEditModal;
