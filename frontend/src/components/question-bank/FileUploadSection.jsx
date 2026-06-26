import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

const FileUploadSection = ({ label, selectedFile, onFileSelect, onFileClear, accept = ".xlsx" }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(accept.toLowerCase())) {
        onFileSelect(file);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="file-upload-section" style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}>
        {label} <span style={{ color: '#EF4444' }}>*</span>
      </label>
      
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          style={{
            border: `2px dashed ${isDragOver ? '#3B82F6' : '#CBD5E1'}`,
            borderRadius: '12px',
            padding: '30px 20px',
            textAlign: 'center',
            backgroundColor: isDragOver ? '#F0F9FF' : '#F8FAFC',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          className="upload-dropzone"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={accept}
            style={{ display: 'none' }}
          />
          <UploadCloud size={36} style={{ color: isDragOver ? '#3B82F6' : '#64748B', marginBottom: '10px' }} />
          <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
            Drag and drop your file here, or <span style={{ color: '#2563EB' }}>browse</span>
          </p>
          <p style={{ fontSize: '11px', color: '#64748B' }}>Supports only Excel ({accept}) files up to 10MB</p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: '#F1F5F9',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={18} style={{ color: '#2563EB' }} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedFile.name}
              </p>
              <p style={{ fontSize: '11px', color: '#64748B' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFileClear}
            style={{
              padding: '6px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E2E8F0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploadSection;
