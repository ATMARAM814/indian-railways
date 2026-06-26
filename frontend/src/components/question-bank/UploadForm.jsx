import React, { useState } from 'react';
import FileUploadSection from './FileUploadSection';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const ROLES = [
  { code: 'PM', name: 'Pointsman (PM)' },
  { code: 'SM', name: 'Station Master (SM)' },
  { code: 'TI', name: 'Traffic Inspector (TI)' },
  { code: 'TM', name: 'Train Manager (TM)' },
  { code: 'SS', name: 'SM Incharge' },
  { code: 'SMS', name: 'Station Master Supervisor (SMS)' },
  { code: 'Cabin Master', name: 'Cabin Master' },
  { code: 'SHM', name: 'Shunting Master (SHM)' }
];

const UploadForm = ({ onUpload, uploading, error, validationErrors }) => {
  const [roleCode, setRoleCode] = useState('');
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleCode || !file) return;

    setUploadResult(null);
    try {
      const result = await onUpload(roleCode, file);
      if (result && result.success) {
        setUploadResult({
          roleCode: result.role_code,
          count: result.question_count,
          timestamp: result.uploaded_at
        });
        setFile(null);
        setRoleCode('');
      }
    } catch (err) {
      // errors handled by hook states
    }
  };

  const isFormValid = roleCode && file && !uploading;

  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    const date = new Date(dateVal);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div style={{ maxWidth: '650px', width: '100%' }}>
      {uploadResult && (
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            color: '#166534',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <CheckCircle2 size={20} style={{ color: '#16A34A', marginTop: '2px', flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: '#14532D' }}>
              Question set uploaded successfully.
            </h3>
            <p style={{ fontSize: '13px', margin: '0', color: '#15803D' }}>
              <strong>Role:</strong> {uploadResult.roleCode} <br />
              <strong>Questions inserted:</strong> {uploadResult.count} <br />
              <strong>Upload timestamp:</strong> {formatDate(uploadResult.timestamp)}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FEE2E2',
            borderRadius: '10px',
            color: '#991B1B',
            fontSize: '13.5px',
            fontWeight: 500,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AlertCircle size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {validationErrors && validationErrors.length > 0 && (
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#FFF5F5',
            border: '1px solid #FED7D7',
            borderRadius: '12px',
            color: '#C53030',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <AlertCircle size={20} style={{ color: '#E53E3E', flexShrink: 0 }} />
            <h3 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0, color: '#9B2C2C' }}>
              File Validation Failed ({validationErrors.length} errors)
            </h3>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {validationErrors.map((err, idx) => (
              <li key={idx}><strong>{err}</strong></li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}>
            Select Staff Role <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <select
            value={roleCode}
            onChange={(e) => setRoleCode(e.target.value)}
            disabled={uploading}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#334155',
              backgroundColor: '#FFFFFF',
              outline: 'none',
              cursor: uploading ? 'not-allowed' : 'default',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
            onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
          >
            <option value="">-- Choose Role --</option>
            {ROLES.map(r => (
              <option key={r.code} value={r.code}>{r.name}</option>
            ))}
          </select>
        </div>

        <FileUploadSection
          label="Excel Questions & Answers File (.xlsx)"
          selectedFile={file}
          onFileSelect={setFile}
          onFileClear={() => setFile(null)}
          accept=".xlsx"
        />

        <div style={{ marginTop: '28px' }}>
          <button
            type="submit"
            disabled={!isFormValid}
            style={{
              width: '100%',
              padding: '12px 20px',
              backgroundColor: isFormValid ? '#1B365D' : '#94A3B8',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14.5px',
              fontWeight: 600,
              cursor: isFormValid ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Uploading and validating questions...</span>
              </>
            ) : (
              <span>Upload Question Set</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadForm;
