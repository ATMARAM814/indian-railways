import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../hooks/useReports';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ReportFilters from '../../components/reports/ReportFilters';
import ReportKpiCards from '../../components/reports/ReportKpiCards';
import PerformanceCharts from '../../components/reports/PerformanceCharts';
import WorkforcePerformanceTable from '../../components/reports/WorkforcePerformanceTable';
import AssessmentCycleTable from '../../components/reports/AssessmentCycleTable';
import { KpiCardsSkeleton, ChartsSkeleton, TableSkeleton } from '../../components/reports/ReportSkeletons';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { getStaffPerformanceReport } from '../../services/reports.service';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportsDashboardPage = () => {
  const { user } = useAuth();
  const {
    summaryLoading,
    performanceLoading,
    tableLoading,
    error,
    summary,
    performance,
    cycles,
    workforceList,
    pagination,
    fetchSummary,
    fetchPerformance,
    fetchCycles,
    fetchWorkforcePerformance
  } = useReports();

  const [filters, setFilters] = useState({});
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const res = await getStaffPerformanceReport({ ...filters, limit: 10000, page: 1 });
      const records = res?.data?.records || [];

      if (records.length === 0) {
        alert("No workforce records available to export.");
        return;
      }

      const dataToExport = records.map(emp => ({
        'Employee Name': emp.fullName || 'N/A',
        'HRMS ID': emp.hrmsId || 'N/A',
        'Role': emp.role || 'N/A',
        'Station': emp.stationName || 'N/A',
        'Category': emp.category ? `Category ${emp.category}` : 'N/A',
        'Latest Score': emp.latestScore != null ? `${Number(emp.latestScore).toFixed(1)}%` : '-',
        'Average Score': emp.averageScore != null ? `${Number(emp.averageScore).toFixed(1)}%` : '-',
        'Last Assessed': emp.lastAssessmentDate ? new Date(emp.lastAssessmentDate).toLocaleDateString('en-GB') : '-',
        'Approval Status': emp.approvalStatus || '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Workforce Report");
      
      const maxLens = {};
      dataToExport.forEach(row => {
        Object.keys(row).forEach(key => {
          const valStr = String(row[key] || '');
          maxLens[key] = Math.max(maxLens[key] || key.length, valStr.length);
        });
      });
      worksheet['!cols'] = Object.keys(maxLens).map(key => ({ wch: maxLens[key] + 3 }));

      XLSX.writeFile(workbook, "Workforce_Performance_Report.xlsx");
    } catch (err) {
      console.error("Export Excel error:", err);
      alert("Error exporting Excel: " + err.message);
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportingPdf(true);
      const res = await getStaffPerformanceReport({ ...filters, limit: 10000, page: 1 });
      const records = res?.data?.records || [];

      if (records.length === 0) {
        alert("No workforce records available to export.");
        return;
      }

      const headers = ['Employee Name', 'HRMS ID', 'Role', 'Station', 'Category', 'Latest Score', 'Average Score', 'Last Assessed', 'Approval Status'];
      const rows = records.map(emp => [
        emp.fullName || 'N/A',
        emp.hrmsId || 'N/A',
        emp.role || 'N/A',
        emp.stationName || 'N/A',
        emp.category ? `Category ${emp.category}` : 'N/A',
        emp.latestScore != null ? `${Number(emp.latestScore).toFixed(1)}%` : '-',
        emp.averageScore != null ? `${Number(emp.averageScore).toFixed(1)}%` : '-',
        emp.lastAssessmentDate ? new Date(emp.lastAssessmentDate).toLocaleDateString('en-GB') : '-',
        emp.approvalStatus || '-'
      ]);

      const doc = new jsPDF('landscape');
      
      doc.setFontSize(16);
      doc.setTextColor(11, 35, 65);
      doc.text("Workforce Performance & Safety Evaluation Report", 14, 15);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} | Total Records: ${rows.length}`, 14, 22);

      const tableOptions = {
        head: [headers],
        body: rows,
        startY: 28,
        theme: 'grid',
        headStyles: { fillColor: [11, 35, 65], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 30 }
      };

      if (typeof doc.autoTable === 'function') {
        doc.autoTable(tableOptions);
      } else {
        autoTable(doc, tableOptions);
      }

      doc.save("Workforce_Performance_Report.pdf");
    } catch (err) {
      console.error("Export PDF error:", err);
      alert("Error exporting PDF: " + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  // 1. Fetch KPI summary, performance charts, cycles, and workforce data on filter change
  useEffect(() => {
    if (user) {
      fetchSummary(filters);
      fetchPerformance(filters);
      fetchCycles(filters);
      fetchWorkforcePerformance(filters, 1);
    }
  }, [user, filters, fetchSummary, fetchPerformance, fetchCycles, fetchWorkforcePerformance]);

  const handleApplyFilters = useCallback((newFilters) => {
    setFilters((prevFilters) => {
      const keys1 = Object.keys(prevFilters);
      const keys2 = Object.keys(newFilters);
      if (keys1.length !== keys2.length) {
        return newFilters;
      }
      for (const key of keys1) {
        if (prevFilters[key] !== newFilters[key]) {
          return newFilters;
        }
      }
      return prevFilters;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handlePageChange = (page) => {
    fetchWorkforcePerformance(filters, page);
  };

  return (
    <DashboardLayout>
      <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Page Header */}
        <div className="reports-header-container">
          <div className="reports-header-info">
            <h1 className="reports-title">
              Performance & Assessment Reports
            </h1>
            <p className="reports-subtitle">
              Analyze workforce performance, safety compliance, assessment outcomes, and operational trends.
            </p>
          </div>
          
          {/* Highlighted Export Buttons */}
          <div className="reports-actions-row">
            <button 
              onClick={handleExportPDF}
              disabled={exportingPdf}
              className="reports-export-btn reports-export-btn-pdf"
              title="Export complete workforce performance report to PDF"
            >
              {exportingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              <span>{exportingPdf ? 'Exporting PDF...' : 'Export PDF'}</span>
            </button>
            <button 
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="reports-export-btn reports-export-btn-excel"
              title="Export complete workforce performance report to Excel (.xlsx)"
            >
              {exportingExcel ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
              <span>{exportingExcel ? 'Exporting Excel...' : 'Export Excel'}</span>
            </button>
          </div>
        </div>

        {/* Error alerts */}
        {error && (
          <div style={{ padding: '16px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* KPI Stats Cards */}
        {summaryLoading && !summary ? (
          <KpiCardsSkeleton />
        ) : (
          <ReportKpiCards 
            summary={summary} 
            userRole={user?.role} 
            onKpiClick={(kpiTitle) => {
              let targetFilters = {};

              if (kpiTitle === 'Completed Assessments') {
                targetFilters = { assessmentStatus: 'completed' };
              } else if (kpiTitle === 'Total Assessments') {
                targetFilters = {};
              } else if (kpiTitle === 'Category A Staff') {
                targetFilters = { category: 'A' };
              } else if (kpiTitle === 'Category D (High Risk) Staff') {
                targetFilters = { category: 'D' };
              } else if (kpiTitle === 'Completed Cycles') {
                targetFilters = {};
                const cycleElement = document.getElementById('assessment-cycles-section');
                if (cycleElement) {
                  cycleElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  return;
                }
              }

              setFilters(targetFilters);
              setTimeout(() => {
                const element = document.getElementById('workforce-table-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}
          />
        )}

        {/* Performance Trends Charts */}
        {performanceLoading && !performance ? (
          <ChartsSkeleton />
        ) : (
          <PerformanceCharts performance={performance} />
        )}

        {/* Assessment Cycle Analytics Section (with Eye/View action) */}
        <div id="assessment-cycles-section">
          <AssessmentCycleTable cyclesData={cycles} />
        </div>

        {/* Workforce Performance Section */}
        <div id="workforce-table-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Report Filters */}
          <ReportFilters 
            filters={filters}
            onApplyFilters={handleApplyFilters} 
            onResetFilters={handleResetFilters} 
            userRole={user?.role} 
          />

          {/* Workforce Datatable */}
          <div style={{ minHeight: '300px' }}>
            {tableLoading ? (
              <TableSkeleton />
            ) : (
              <WorkforcePerformanceTable 
                workforceList={workforceList} 
                pagination={pagination} 
                onPageChange={handlePageChange} 
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsDashboardPage;
