import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingState from '../../../components/dashboard/LoadingState';
import ErrorState from '../../../components/dashboard/ErrorState';
import DrillDownPagination from '../../../components/dashboard/DrillDownPagination';
import EditQuestionModal from '../../../components/question-bank/EditQuestionModal';
import DeleteQuestionModal from '../../../components/question-bank/DeleteQuestionModal';
import { getQuestionsList, updateQuestion, deleteQuestion, exportQuestionsExcel } from '../../../services/questionBank.service';
import { Search, Edit2, Trash2, Download } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'PM', label: 'Pointsman (PM)' },
  { value: 'SM', label: 'Station Master (SM)' },
  { value: 'TM', label: 'Train Manager (TM)' },
  { value: 'SS', label: 'SM Supervisor (SS)' },
  { value: 'SMS', label: 'Station Master Supervisor (SMS)' },
  { value: 'CABIN MASTER', label: 'Cabin Master' },
  { value: 'SHM', label: 'Shunting Master (SHM)' },
  { value: 'TI', label: 'Traffic Inspector (TI)' },
  { value: 'AOM', label: 'AOM' },
  { value: 'COMMON', label: 'Common (COMMON)' }
];

const QuestionsListPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [downloading, setDownloading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDownloadQuestions = async () => {
    if (!roleCode) return;
    try {
      setDownloading(true);
      const data = await exportQuestionsExcel(roleCode);
      
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `questions_${roleCode.toUpperCase()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to download question set');
    } finally {
      setDownloading(false);
    }
  };

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        page,
        limit: 10
      };
      if (search.trim()) filters.search = search.trim();
      if (roleCode) filters.roleCode = roleCode;

      const res = await getQuestionsList(filters);
      if (res.success) {
        const records = res.data.records || [];
        setQuestions(records);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        } else {
          // Fallback if pagination object not returned
          setPagination({
            total: records.length,
            page: 1,
            limit: 10,
            totalPages: 1
          });
        }
      } else {
        setError(res.message || 'Failed to fetch questions');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred while fetching questions');
    } finally {
      setLoading(false);
    }
  }, [search, roleCode, page]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleRoleChange = (e) => {
    setRoleCode(e.target.value);
    setPage(1);
  };

  // Actions
  const handleEditClick = (question) => {
    setSelectedQuestion(question);
    setEditOpen(true);
  };

  const handleDeleteClick = (question) => {
    setSelectedQuestion(question);
    setDeleteOpen(true);
  };

  const handleEditSubmit = async (id, data) => {
    try {
      const res = await updateQuestion(id, data);
      if (res.success) {
        fetchQuestions();
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to update question' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Update failed' };
    }
  };

  const handleDeleteSubmit = async (id) => {
    try {
      const res = await deleteQuestion(id);
      if (res.success) {
        fetchQuestions();
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to delete question' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message || 'Delete failed' };
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: '32px', minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Manage Questions</h1>
            <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0 0' }}>
              View, search, edit, or delete evaluation pool questions.
            </p>
          </div>
        </div>

        {/* Filters Panel */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D7E3EF',
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Search bar */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search question text..."
              value={search}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
                fontSize: '14px',
                color: '#1E293B',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D7E3EF',
                borderRadius: '8px',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#1B365D'; e.target.style.boxShadow = '0 0 0 3px rgba(27, 54, 93, 0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#D7E3EF'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Category Dropdown */}
          <div style={{ minWidth: '200px' }}>
            <select
              value={roleCode}
              onChange={handleRoleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                color: '#1E293B',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D7E3EF',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Download Questions Button */}
          <button
            onClick={handleDownloadQuestions}
            disabled={!roleCode || downloading}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              color: roleCode ? '#FFFFFF' : '#94A3B8',
              backgroundColor: roleCode ? '#0F172A' : '#F1F5F9',
              border: roleCode ? '1px solid #0F172A' : '1px solid #E2E8F0',
              borderRadius: '8px',
              cursor: (roleCode && !downloading) ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: roleCode ? '0 1px 2px rgba(15, 23, 42, 0.05)' : 'none'
            }}
            title={roleCode ? `Download active question bank for ${ROLE_OPTIONS.find(r => r.value === roleCode)?.label}` : "Select a category first to download questions"}
          >
            <Download size={16} />
            <span>{downloading ? 'Downloading...' : 'Download Questions'}</span>
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '12px', padding: '64px', display: 'flex', justifyContent: 'center' }}>
            <LoadingState message="Loading question pool data..." />
          </div>
        ) : error ? (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '12px', padding: '64px' }}>
            <ErrorState title="Failed to Load Data" message={error} />
          </div>
        ) : (
          <>
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D7E3EF', borderRadius: '12px', boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #D7E3EF', backgroundColor: '#F8FAFC' }}>
                      <th style={{ padding: '16px 24px', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', width: '120px' }}>Category</th>
                      <th style={{ padding: '16px 24px', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Question details & options</th>
                      <th style={{ padding: '16px 24px', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right', width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #EEF2F6', transition: 'background-color 0.2s' }} className="table-row-hover">
                        {/* Category badge */}
                        <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                          <span style={{
                            display: 'inline-block',
                            backgroundColor: '#E0F2FE',
                            color: '#0369A1',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700
                          }}>
                            {item.roleCode}
                          </span>
                        </td>

                        {/* Question & Options block */}
                        <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '14.5px', marginBottom: '12px', lineHeight: 1.5 }}>
                            {item.questionText}
                          </div>

                           {/* Options list (stacked vertically to prevent layout clipping and text truncation) */}
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                            <div style={{
                              color: item.correctAnswer === 'A' ? '#16A34A' : '#475569',
                              fontWeight: item.correctAnswer === 'A' ? 600 : 400,
                              display: 'flex',
                              gap: '6px'
                            }}>
                              <span style={{ color: '#94A3B8' }}>A.</span>
                              <span>{item.optionA}</span>
                              {item.correctAnswer === 'A' && <span style={{ marginLeft: '4px' }}>✓</span>}
                            </div>
                            <div style={{
                              color: item.correctAnswer === 'B' ? '#16A34A' : '#475569',
                              fontWeight: item.correctAnswer === 'B' ? 600 : 400,
                              display: 'flex',
                              gap: '6px'
                            }}>
                              <span style={{ color: '#94A3B8' }}>B.</span>
                              <span>{item.optionB}</span>
                              {item.correctAnswer === 'B' && <span style={{ marginLeft: '4px' }}>✓</span>}
                            </div>
                            <div style={{
                              color: item.correctAnswer === 'C' ? '#16A34A' : '#475569',
                              fontWeight: item.correctAnswer === 'C' ? 600 : 400,
                              display: 'flex',
                              gap: '6px'
                            }}>
                              <span style={{ color: '#94A3B8' }}>C.</span>
                              <span>{item.optionC}</span>
                              {item.correctAnswer === 'C' && <span style={{ marginLeft: '4px' }}>✓</span>}
                            </div>
                            <div style={{
                              color: item.correctAnswer === 'D' ? '#16A34A' : '#475569',
                              fontWeight: item.correctAnswer === 'D' ? 600 : 400,
                              display: 'flex',
                              gap: '6px'
                            }}>
                              <span style={{ color: '#94A3B8' }}>D.</span>
                              <span>{item.optionD}</span>
                              {item.correctAnswer === 'D' && <span style={{ marginLeft: '4px' }}>✓</span>}
                            </div>
                          </div>

                          {/* Explanation */}
                          {item.explanation && (
                            <div style={{
                              marginTop: '12px',
                              fontSize: '12.5px',
                              color: '#64748B',
                              backgroundColor: '#F8FAFC',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              borderLeft: '3px solid #CBD5E1',
                              lineHeight: 1.4
                            }}>
                              <strong>Explanation:</strong> {item.explanation}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '20px 24px', verticalAlign: 'top', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {/* Edit */}
                            <button
                              title="Edit Question"
                              onClick={() => handleEditClick(item)}
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

                            {/* Delete */}
                            <button
                              title="Delete Question"
                              onClick={() => handleDeleteClick(item)}
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
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {questions.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: '#64748B', padding: '48px', fontSize: '14px' }}>
                          No questions found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <DrillDownPagination
                pagination={pagination}
                onPageChange={(p) => setPage(p)}
              />
            )}
          </>
        )}

        {/* Modals */}
        <EditQuestionModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSubmit={handleEditSubmit}
          question={selectedQuestion}
        />

        <DeleteQuestionModal
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onSubmit={handleDeleteSubmit}
          question={selectedQuestion}
        />

      </div>
    </DashboardLayout>
  );
};

export default QuestionsListPage;
