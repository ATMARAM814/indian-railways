import React from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import UploadForm from '../../../components/question-bank/UploadForm';
import { useQuestionBank } from '../../../hooks/useQuestionBank';
import { Download, FileText, Settings, Database, Info } from 'lucide-react';

const UploadQuestionsPage = () => {
  const { uploadSet, uploading, error, validationErrors, downloadTemplate } = useQuestionBank();

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0B2341', marginBottom: '4px' }}>
            Question Bank Upload
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B' }}>
            Upload and replace role-based question banks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Left Column: Upload Form */}
          <div style={{ flex: '1 1 500px', minWidth: '320px' }}>
            <UploadForm
              onUpload={uploadSet}
              uploading={uploading}
              error={error}
              validationErrors={validationErrors}
            />
          </div>

          {/* Right Column: Instructions & Downloadable Templates */}
          <div style={{ flex: '1 1 400px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Guide Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                <Info size={18} style={{ color: '#2563EB' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Upload & Mapping Guidelines
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Settings size={14} style={{ color: '#64748B' }} />
                    Replacement Behavior
                  </h4>
                  <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                    Uploading a new question set completely <strong>replaces</strong> the existing question bank for the selected role. There are no partial inserts. If validation fails, the entire action is rolled back.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Database size={14} style={{ color: '#64748B' }} />
                    Excel Sheet Columns
                  </h4>
                  <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                    The uploaded sheet must contain columns in the exact order: <strong>Question Text</strong>, <strong>Option A</strong>, <strong>Option B</strong>, <strong>Option C</strong>, <strong>Option D</strong>, <strong>Correct Answer (A/B/C/D)</strong>, and an optional <strong>Explanation</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Template Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                <FileText size={18} style={{ color: '#059669' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Excel Template File
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>Consolidated Excel Sheet</span>
                    <button
                      onClick={() => downloadTemplate()}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                    >
                      <Download size={14} />
                      Download Excel Template
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#475569',
                      lineHeight: 1.6,
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '12px',
                    }}
                  >
                    <strong style={{ color: '#1E293B' }}>Expected Columns:</strong>
                    <ol style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
                      <li>Question Text (Supports bilingual English/Hindi)</li>
                      <li>Option A</li>
                      <li>Option B</li>
                      <li>Option C</li>
                      <li>Option D</li>
                      <li>Correct Answer (Must be: A, B, C, or D)</li>
                      <li>Explanation (Optional context for candidates)</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UploadQuestionsPage;
