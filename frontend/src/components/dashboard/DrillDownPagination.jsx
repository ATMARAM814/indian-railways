// DrillDownPagination.jsx
import React from 'react';

const DrillDownPagination = ({ pagination, onPageChange }) => {
  const { total = 0, page = 1, limit = 10, totalPages = 1 } = pagination || {};

  const startIdx = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);

  const handlePrev = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  // Generate page numbers to render
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          style={{
            minWidth: '36px',
            height: '36px',
            borderRadius: '6px',
            border: '1px solid',
            borderColor: i === page ? '#0B1F3A' : '#CBD5E1',
            backgroundColor: i === page ? '#0B1F3A' : '#FFFFFF',
            color: i === page ? '#FFFFFF' : '#475569',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  if (total === 0) return null;

  return (
    <div className="drilldown-pagination-container" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(11, 35, 65, 0.05)',
      marginTop: '8px'
    }}>
      <div style={{ fontSize: '13px', color: '#64748B' }}>
        Show <strong>{startIdx}</strong>-<strong>{endIdx}</strong> / <strong>{total}</strong>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={handlePrev}
          disabled={page === 1}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            backgroundColor: page === 1 ? '#F8FAFC' : '#FFFFFF',
            color: page === 1 ? '#94A3B8' : '#475569',
            fontSize: '13px',
            fontWeight: 600,
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Prev
        </button>
        {renderPageNumbers()}
        <button
          onClick={handleNext}
          disabled={page === totalPages}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            backgroundColor: page === totalPages ? '#F8FAFC' : '#FFFFFF',
            color: page === totalPages ? '#94A3B8' : '#475569',
            fontSize: '13px',
            fontWeight: 600,
            cursor: page === totalPages ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DrillDownPagination;
