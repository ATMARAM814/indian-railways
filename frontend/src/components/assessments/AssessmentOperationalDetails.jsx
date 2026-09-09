import React from 'react';
import { Activity, AlertCircle } from 'lucide-react';

export const AssessmentOperationalDetails = ({
  details = {},
  onChange,
  readOnly = false,
  assessorRole = '',
  mcqScore = 0,
  onMcqScoreChange,
  errors = {}
}) => {
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    onChange(name, type === 'checkbox' ? checked : value);
  };

  const normalizedRole = (assessorRole || '').toUpperCase();
  const isMcqReadOnly = readOnly || ['SM', 'SS', 'CABIN MASTER'].includes(normalizedRole);

  const getRemarksLabel = () => {
    if (['SM', 'SS', 'Cabin Master', 'CABIN MASTER'].includes(assessorRole)) return 'Remarks for SMS/TI';
    if (assessorRole === 'TI') return 'Remarks for AOM';
    if (assessorRole === 'AOM') return 'Remarks for SUPER_ADMIN';
    return 'Remarks for Approver';
  };

  return (
    <div className="operational-details-section">
      <div className="section-header mb-6">
        <Activity size={18} className="text-slate-500" />
        <h3 className="section-title">Phase 3: Additional Operational & Safety Details</h3>
      </div>

      <div className="operational-grid">
        {/* Knowledge Marks (MCQ Test) */}
        <div className="op-item">
          <label className="op-label">Knowledge Marks (MCQ Test) *</label>
          {isMcqReadOnly ? (
            <div className="op-value-readonly">
              {mcqScore !== null && mcqScore !== undefined ? `${mcqScore} / 25 Marks` : 'N/A'}
            </div>
          ) : (
            <>
              <input
                id="mcq-score-input"
                type="number"
                name="mcqScore"
                value={mcqScore !== null && mcqScore !== undefined ? mcqScore : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    onMcqScoreChange('');
                  } else {
                    const num = Math.min(25, Math.max(0, Number(val)));
                    onMcqScoreChange(num);
                  }
                }}
                placeholder="Enter Marks (0 - 25)"
                className={`op-input ${errors.mcqScore ? 'op-input-error' : ''}`}
                min={0}
                max={25}
                required
              />
              {errors.mcqScore && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontSize: '11.5px', fontWeight: 700, marginTop: '4px' }}>
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  Knowledge Marks (0 - 25) are mandatory.
                </span>
              )}
            </>
          )}
        </div>

        {/* Alcoholic Status */}
        <div className="op-item">
          <label className="op-label">Alcoholic Status *</label>
          {readOnly ? (
            <div className="op-value-readonly">
              {details.alcoholicStatus === 'Sober' ? 'Non-Alcoholic' : (details.alcoholicStatus || 'Not Specified')}
            </div>
          ) : (
            <>
              <select
                id="alcoholic-status-select"
                name="alcoholicStatus"
                value={details.alcoholicStatus || ''}
                onChange={handleInputChange}
                className={`op-input ${errors.alcoholicStatus ? 'op-input-error' : ''}`}
                required
              >
                <option value="">Select Status</option>
                <option value="Alcoholic">Alcoholic</option>
                <option value="Non-Alcoholic">Non-Alcoholic</option>
              </select>
              {errors.alcoholicStatus && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontSize: '11.5px', fontWeight: 700, marginTop: '4px' }}>
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  Alcoholic status selection is mandatory.
                </span>
              )}
            </>
          )}
        </div>

        {/* PME Status */}
        <div className="op-item">
          <label className="op-label">PME Status</label>
          {readOnly ? (
            <div className="op-value-readonly">{details.pmeStatus || 'Not Specified'}</div>
          ) : (
            <select
              name="pmeStatus"
              value={details.pmeStatus || ''}
              onChange={handleInputChange}
              className="op-input"
            >
              <option value="">Select Status</option>
              <option value="Fit">Fit</option>
              <option value="Unfit">Unfit</option>
              <option value="Pending">Pending</option>
            </select>
          )}
        </div>

        {/* REF Status */}
        <div className="op-item">
          <label className="op-label">REF Status</label>
          {readOnly ? (
            <div className="op-value-readonly">
              {details.refStatus === 'Fit' ? 'Cleared' : (details.refStatus || 'Not Specified')}
            </div>
          ) : (
            <select
              name="refStatus"
              value={details.refStatus || ''}
              onChange={handleInputChange}
              className="op-input"
            >
              <option value="">Select Status</option>
              <option value="Cleared">Cleared</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          )}
        </div>

        {/* Remarks */}
        <div className="op-item col-span-full">
          <label className="op-label">{getRemarksLabel()}</label>
          {readOnly ? (
            <div className="op-value-readonly op-remarks-readonly">
              {details.remarksForApprover || 'No remarks provided.'}
            </div>
          ) : (
            <textarea
              name="remarksForApprover"
              value={details.remarksForApprover || ''}
              onChange={handleInputChange}
              placeholder={`Enter evaluation observations or comments for the higher authority...`}
              rows={4}
              className="op-input op-textarea"
            />
          )}
        </div>
      </div>
    </div>
  );
};
