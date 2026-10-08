import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../hooks/useReports';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ReportFilters from '../../components/reports/ReportFilters';
import ReportKpiCards from '../../components/reports/ReportKpiCards';
import PerformanceCharts from '../../components/reports/PerformanceCharts';
import HighRiskTable from '../../components/reports/HighRiskTable';
import WorkforcePerformanceTable from '../../components/reports/WorkforcePerformanceTable';
import StationPerformanceTable from '../../components/reports/StationPerformanceTable';
import AssessmentCycleTable from '../../components/reports/AssessmentCycleTable';
import { KpiCardsSkeleton, ChartsSkeleton, TableSkeleton } from '../../components/reports/ReportSkeletons';
import { Download } from 'lucide-react';
import { 
  getStaffPerformanceReport, 
  getReportsHighRisk, 
  getReportsStations, 
  getReportsCycles 
} from '../../services/reports.service';
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
    highRisk,
    stations,
    cycles,
    workforceList,
    pagination,
    fetchSummary,
    fetchPerformance,
    fetchHighRisk,
    fetchStations,
    fetchCycles,
    fetchWorkforcePerformance
  } = useReports();

  const [filters, setFilters] = useState({});
  const [activeTab, setActiveTab] = useState('workforce');
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      let dataToExport = [];
      let filename = '';
      
      if (activeTab === 'workforce') {
        filename = 'Workforce_Performance_Report.xlsx';
        const res = await getStaffPerformanceReport({ ...filters, limit: 10000, page: 1 });
        const records = res?.data?.records || [];
        dataToExport = records.map(emp => ({
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
      } else if (activeTab === 'high-risk') {
        filename = 'High_Risk_Staff_Report.xlsx';
        const res = await getReportsHighRisk(filters);
        const records = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : highRisk);
        dataToExport = records.map(staff => ({
          'Employee Name': staff.fullName || 'N/A',
          'HRMS ID': staff.hrmsId || 'N/A',
          'Role': staff.role || 'N/A',
          'Station': staff.stationCode || staff.stationName || 'N/A',
          'Latest Score': staff.latestScore != null ? `${Number(staff.latestScore).toFixed(1)}%` : '0.0%',
          'Category': staff.category || 'D',
          'Assessor': staff.assessorName || 'System',
          'Reporting Authority': staff.reportingAuthority || 'N/A',
          'Last Assessed': staff.lastAssessmentDate ? new Date(staff.lastAssessmentDate).toLocaleDateString('en-GB') : 'N/A'
        }));
      } else if (activeTab === 'stations') {
        filename = 'Station_Performance_Report.xlsx';
        const res = await getReportsStations(filters);
        const records = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : stations);
        dataToExport = records.map(st => ({
          'Station Code': st.stationCode || 'N/A',
          'Station Name': st.stationName || 'N/A',
          'Total Employees': st.totalEmployees || 0,
          'Average Score': st.averageScore != null ? `${Number(st.averageScore).toFixed(1)}%` : '0.0%',
          'Category A Count': st.categoryA || 0,
          'Category B Count': st.categoryB || 0,
          'Category C Count': st.categoryC || 0,
          'Category D Count': st.categoryD || 0,
          'High Risk Count': st.highRiskCount || 0,
          'Pending Approvals': st.pendingApprovals || 0
        }));
      } else if (activeTab === 'cycles') {
        filename = 'Assessment_Cycle_Report.xlsx';
        const res = await getReportsCycles(filters);
        const records = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : cycles);
        dataToExport = records.map(cy => ({
          'Cycle Name': cy.cycleName || 'Annual Assessment',
          'Assessment Type': cy.assessmentType || 'Periodic Assessment',
          'Total Assessments': cy.totalAssessments || 0,
          'Completed Assessments': cy.completedCount || 0,
          'Pending Assessments': cy.pendingCount || 0,
          'Approved Assessments': cy.approvedCount || 0,
          'Rejected Assessments': cy.rejectedCount || 0,
          'Average Score': cy.averageScore != null ? `${Number(cy.averageScore).toFixed(1)}%` : '0.0%'
        }));
      }

      if (dataToExport.length === 0) {
        alert("No data available to export.");
        setExporting(false);
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");
      
      const maxLens = {};
      dataToExport.forEach(row => {
        Object.keys(row).forEach(key => {
          const valStr = String(row[key] || '');
          maxLens[key] = Math.max(maxLens[key] || key.length, valStr.length);
        });
      });
      worksheet['!cols'] = Object.keys(maxLens).map(key => ({ wch: maxLens[key] + 3 }));

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error("Export Excel error:", err);
      alert("Error exporting Excel: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      let headers = [];
      let rows = [];
      let title = '';
      let filename = '';

      if (activeTab === 'workforce') {
        title = 'Workforce Performance Report';
        filename = 'Workforce_Performance_Report.pdf';
        const res = await getStaffPerformanceReport({ ...filters, limit: 10000, page: 1 });
        const records = res?.data?.records || [];
        headers = ['Employee Name', 'HRMS ID', 'Role', 'Station', 'Category', 'Latest Score', 'Average Score', 'Last Assessed', 'Approval Status'];
        rows = records.map(emp => [
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
      } else if (activeTab === 'high-risk') {
        title = 'High Risk Staff Monitoring Report';
        filename = 'High_Risk_Staff_Report.pdf';
        const res = await getReportsHighRisk(filters);
        const records = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : highRisk);
        headers = ['Employee Name', 'HRMS ID', 'Role', 'Station', 'Latest Score', 'Category', 'Assessor', 'Reporting Authority', 'Last Assessed'];
        rows = records.map(staff => [
          staff.fullName || 'N/A',
          staff.hrmsId || 'N/A',
          staff.role || 'N/A',
          staff.stationCode || staff.stationName || 'N/A',
          staff.latestScore != null ? `${Number(staff.latestScore).toFixed(1)}%` : '0.0%',
          staff.category || 'D',
          staff.assessorName || 'System',
          staff.reportingAuthority || 'N/A',
          staff.lastAssessmentDate ? new Date(staff.lastAssessmentDate).toLocaleDateString('en-GB') : 'N/A'
        ]);
      } else if (activeTab === 'stations') {
        title = 'Station Performance Analytics';
        filename = 'Station_Performance_Report.pdf';
        const res = await getReportsStations(filters);
        const records = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : stations);
        headers = ['Station Code', 'Station Name', 'Total Employees', 'Average Score', 'Cat A', 'Cat B', 'Cat C', 'Cat D', 'High Risk', 'Pending Appr.'];
        rows = records.map(st => [
          st.stationCode || 'N/A',
          st.stationName || 'N/A',
          st.totalEmployees || 0,
          st.averageScore != null ? `${Number(st.averageScore).toFixed(1)}%` : '0.0%',
          st.categoryA || 0,
          st.categoryB || 0,
          st.categoryC || 0,
          st.categoryD || 0,
          st.highRiskCount || 0,
          st.pendingApprovals || 0
        ]);
      } else if (activeTab === 'cycles') {
        title = 'Assessment Cycle Analytics';
        filename = 'Assessment_Cycle_Report.pdf';
        const res = await getReportsCycles(filters);
        const records = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : cycles);
        headers = ['Cycle Name', 'Assessment Type', 'Total Assessments', 'Completed', 'Pending', 'Approved', 'Rejected', 'Average Score'];
        rows = records.map(cy => [
          cy.cycleName || 'Annual Assessment',
          cy.assessmentType || 'Periodic Assessment',
          cy.totalAssessments || 0,
          cy.completedCount || 0,
          cy.pendingCount || 0,
          cy.approvedCount || 0,
          cy.rejectedCount || 0,
          cy.averageScore != null ? `${Number(cy.averageScore).toFixed(1)}%` : '0.0%'
        ]);
      }

      if (rows.length === 0) {
        alert("No data available to export.");
        setExporting(false);
        return;
      }

      const doc = new jsPDF('landscape');
      
      doc.setFontSize(16);
      doc.setTextColor(11, 35, 65);
      doc.text(title, 14, 15);
      
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

      doc.save(filename);
    } catch (err) {
      console.error("Export PDF error:", err);
      alert("Error exporting PDF: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  // 1. Fetch global KPI summary and performance trends (only on filter change)
  useEffect(() => {
    if (user) {
      fetchSummary(filters);
      fetchPerformance(filters);
    }
  }, [user, filters, fetchSummary, fetchPerformance]);

  // 2. Fetch active tab data (on filter or activeTab change)
  useEffect(() => {
    if (user) {
      if (activeTab === 'workforce') {
        fetchWorkforcePerformance(filters, 1);
      } else if (activeTab === 'high-risk') {
        fetchHighRisk(filters);
      } else if (activeTab === 'stations') {
        fetchStations(filters);
      } else if (activeTab === 'cycles') {
        fetchCycles(filters);
      }
    }
  }, [user, filters, activeTab, fetchWorkforcePerformance, fetchHighRisk, fetchStations, fetchCycles]);

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

  const tabs = [
    { id: 'workforce', name: 'Workforce Performance' },
    { id: 'high-risk', name: 'High-Risk Monitoring' },
    { id: 'stations', name: 'Station Analytics' },
    { id: 'cycles', name: 'Assessment Cycles' }
  ];

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
          
          {/* Export Buttons */}
          <div className="reports-actions-row">
            <button 
              onClick={handleExportPDF}
              disabled={exporting}
              className="reports-export-btn"
              style={{ cursor: exporting ? 'not-allowed' : 'pointer' }}
            >
              <Download size={14} />
              {exporting ? 'Exporting PDF...' : 'Export PDF'}
            </button>
            <button 
              onClick={handleExportExcel}
              disabled={exporting}
              className="reports-export-btn"
              style={{ cursor: exporting ? 'not-allowed' : 'pointer' }}
            >
              <Download size={14} />
              {exporting ? 'Exporting Excel...' : 'Export Excel'}
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
              let targetTab = '';
              let targetFilters = {};

              if (kpiTitle === 'Completed Assessments') {
                targetFilters = { assessmentStatus: 'completed' };
                targetTab = 'workforce';
              } else if (kpiTitle === 'Total Assessments') {
                targetFilters = {};
                targetTab = 'workforce';
              } else if (kpiTitle === 'Category A Staff') {
                targetFilters = { category: 'A' };
                targetTab = 'workforce';
              } else if (kpiTitle === 'Category D (High Risk) Staff') {
                targetFilters = { category: 'D' };
                targetTab = 'high-risk';
              } else if (kpiTitle === 'Completed Cycles') {
                targetFilters = {};
                targetTab = 'cycles';
              }

              if (targetTab) {
                setFilters(targetFilters);
                setActiveTab(targetTab);
                // Smooth scroll to table section for mobile responsiveness
                setTimeout(() => {
                  const element = document.getElementById('reports-table-section');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }
            }}
          />
        )}

        {/* Performance Trends Charts */}
        {performanceLoading && !performance ? (
          <ChartsSkeleton />
        ) : (
          <PerformanceCharts performance={performance} />
        )}

        {/* Reports Directory Tabs */}
        <div id="reports-table-section" className="reports-tabs-bar">
          <div className="reports-tabs-list">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`reports-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.name}
              </button>
            ))}
          </div>
          
          {activeTab === 'stations' && (
            <Link to="/reports/stations" className="reports-tab-link">
              Open Standalone Station Analytics &rarr;
            </Link>
          )}
          {activeTab === 'cycles' && (
            <Link to="/reports/cycles" className="reports-tab-link">
              Open Standalone Cycle Analytics &rarr;
            </Link>
          )}
        </div>

        {/* Report Filters Card */}
        <ReportFilters 
          filters={filters}
          onApplyFilters={handleApplyFilters} 
          onResetFilters={handleResetFilters} 
          userRole={user?.role} 
        />

        {/* Detailed Datatables depending on active tab */}
        <div style={{ minHeight: '300px' }}>
          {tableLoading ? (
            <TableSkeleton />
          ) : (
            <>
              {activeTab === 'workforce' && (
                <WorkforcePerformanceTable 
                  workforceList={workforceList} 
                  pagination={pagination} 
                  onPageChange={handlePageChange} 
                />
              )}
              {activeTab === 'high-risk' && (
                <HighRiskTable highRiskStaff={highRisk} />
              )}
              {activeTab === 'stations' && (
                <StationPerformanceTable stationsData={stations} />
              )}
              {activeTab === 'cycles' && (
                <AssessmentCycleTable cyclesData={cycles} />
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsDashboardPage;
