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
import { FileSpreadsheet, Download } from 'lucide-react';
import { getStaffPerformanceReport } from '../../services/reports.service';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const ReportsDashboardPage = () => {
  const { user } = useAuth();
  const {
    loading,
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
        const res = await getStaffPerformanceReport({ ...filters, limit: 10000 });
        const records = res?.data?.records || [];
        dataToExport = records.map(emp => ({
          'Employee Name': emp.fullName,
          'HRMS ID': emp.hrmsId,
          'Role': emp.role,
          'Station': emp.stationName || 'N/A',
          'Category': emp.category ? `Category ${emp.category}` : 'N/A',
          'Latest Score': emp.latestScore ? `${Number(emp.latestScore).toFixed(1)}%` : '-',
          'Average Score': emp.averageScore ? `${Number(emp.averageScore).toFixed(1)}%` : '-',
          'Last Assessed': emp.lastAssessmentDate ? new Date(emp.lastAssessmentDate).toLocaleDateString('en-GB') : '-',
          'Approval Status': emp.approvalStatus || '-'
        }));
      } else if (activeTab === 'high-risk') {
        filename = 'High_Risk_Staff_Report.xlsx';
        dataToExport = highRisk.map(staff => ({
          'Employee Name': staff.fullName,
          'HRMS ID': staff.hrmsId,
          'Role': staff.role,
          'Station': staff.stationCode || 'N/A',
          'Latest Score': staff.latestScore ? `${Number(staff.latestScore).toFixed(1)}%` : '0.0%',
          'Category': staff.category || 'D',
          'Assessor': staff.assessorName || 'System',
          'Reporting Authority': staff.reportingAuthority || 'N/A',
          'Last Assessed': staff.lastAssessmentDate ? new Date(staff.lastAssessmentDate).toLocaleDateString('en-GB') : 'N/A'
        }));
      } else if (activeTab === 'stations') {
        filename = 'Station_Performance_Report.xlsx';
        dataToExport = stations.map(st => ({
          'Station Code': st.stationCode,
          'Station Name': st.stationName,
          'Total Employees': st.totalEmployees || 0,
          'Average Score': st.averageScore ? `${Number(st.averageScore).toFixed(1)}%` : '0.0%',
          'Category A Count': st.categoryA || 0,
          'Category B Count': st.categoryB || 0,
          'Category C Count': st.categoryC || 0,
          'Category D Count': st.categoryD || 0,
          'High Risk Count': st.highRiskCount || 0,
          'Pending Approvals': st.pendingApprovals || 0
        }));
      } else if (activeTab === 'cycles') {
        filename = 'Assessment_Cycle_Report.xlsx';
        dataToExport = cycles.map(cy => ({
          'Cycle Name': cy.cycleName,
          'Total Assessments': cy.totalAssessments || 0,
          'Completed Assessments': cy.completedCount || 0,
          'Pending Assessments': cy.pendingCount || 0,
          'Approved Assessments': cy.approvedCount || 0,
          'Rejected Assessments': cy.rejectedCount || 0,
          'Average Score': cy.averageScore ? `${Number(cy.averageScore).toFixed(1)}%` : '0.0%'
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
        const res = await getStaffPerformanceReport({ ...filters, limit: 10000 });
        const records = res?.data?.records || [];
        headers = ['Employee Name', 'HRMS ID', 'Role', 'Station', 'Category', 'Latest Score', 'Average Score', 'Last Assessed', 'Approval Status'];
        rows = records.map(emp => [
          emp.fullName,
          emp.hrmsId,
          emp.role,
          emp.stationName || 'N/A',
          emp.category ? `Category ${emp.category}` : 'N/A',
          emp.latestScore ? `${Number(emp.latestScore).toFixed(1)}%` : '-',
          emp.averageScore ? `${Number(emp.averageScore).toFixed(1)}%` : '-',
          emp.lastAssessmentDate ? new Date(emp.lastAssessmentDate).toLocaleDateString('en-GB') : '-',
          emp.approvalStatus || '-'
        ]);
      } else if (activeTab === 'high-risk') {
        title = 'High Risk Staff Monitoring Report';
        filename = 'High_Risk_Staff_Report.pdf';
        headers = ['Employee Name', 'HRMS ID', 'Role', 'Station', 'Latest Score', 'Category', 'Assessor', 'Reporting Authority', 'Last Assessed'];
        rows = highRisk.map(staff => [
          staff.fullName,
          staff.hrmsId,
          staff.role,
          staff.stationCode || 'N/A',
          staff.latestScore ? `${Number(staff.latestScore).toFixed(1)}%` : '0.0%',
          staff.category || 'D',
          staff.assessorName || 'System',
          staff.reportingAuthority || 'N/A',
          staff.lastAssessmentDate ? new Date(staff.lastAssessmentDate).toLocaleDateString('en-GB') : 'N/A'
        ]);
      } else if (activeTab === 'stations') {
        title = 'Station Performance Analytics';
        filename = 'Station_Performance_Report.pdf';
        headers = ['Station Code', 'Station Name', 'Total Employees', 'Average Score', 'Cat A', 'Cat B', 'Cat C', 'Cat D', 'High Risk', 'Pending Appr.'];
        rows = stations.map(st => [
          st.stationCode,
          st.stationName,
          st.totalEmployees || 0,
          st.averageScore ? `${Number(st.averageScore).toFixed(1)}%` : '0.0%',
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
        headers = ['Cycle Name', 'Total Assessments', 'Completed', 'Pending', 'Approved', 'Rejected', 'Average Score'];
        rows = cycles.map(cy => [
          cy.cycleName,
          cy.totalAssessments || 0,
          cy.completedCount || 0,
          cy.pendingCount || 0,
          cy.approvedCount || 0,
          cy.rejectedCount || 0,
          cy.averageScore ? `${Number(cy.averageScore).toFixed(1)}%` : '0.0%'
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

      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 28,
        theme: 'grid',
        headStyles: { fillColor: [11, 35, 65], textColor: [255, 255, 255], fontSize: 9 },
        bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 30 }
      });

      doc.save(filename);
    } catch (err) {
      console.error("Export PDF error:", err);
      alert("Error exporting PDF: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Trigger loads on mount & filter change
  useEffect(() => {
    if (user) {
      fetchSummary(filters);
      fetchPerformance(filters);
      
      // Load active tab's specific data
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
  }, [user, filters, activeTab, fetchSummary, fetchPerformance, fetchWorkforcePerformance, fetchHighRisk, fetchStations, fetchCycles]);

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
        {loading && !summary ? (
          <KpiCardsSkeleton />
        ) : (
          <ReportKpiCards 
            summary={summary} 
            userRole={user?.role} 
            onKpiClick={(kpiTitle) => {
              if (kpiTitle === 'Completed Assessments') {
                setFilters({ assessmentStatus: 'completed' });
                setActiveTab('workforce');
              } else if (kpiTitle === 'Total Assessments') {
                setFilters({});
                setActiveTab('workforce');
              } else if (kpiTitle === 'Pending Approvals') {
                setFilters({ assessmentStatus: 'pending_approval' });
                setActiveTab('workforce');
              } else if (kpiTitle === 'Category A Staff') {
                setFilters({ category: 'A' });
                setActiveTab('workforce');
              } else if (kpiTitle === 'Category D (High Risk) Staff' || kpiTitle === 'High Risk Staff') {
                setFilters({ category: 'D' });
                setActiveTab('high-risk');
              } else if (kpiTitle === 'Active Stations') {
                setFilters({});
                setActiveTab('stations');
              } else if (kpiTitle === 'Completed Cycles') {
                setFilters({});
                setActiveTab('cycles');
              }
            }}
          />
        )}

        {/* Performance Trends Charts */}
        {loading && !performance ? (
          <ChartsSkeleton />
        ) : (
          <PerformanceCharts performance={performance} />
        )}

        {/* Reports Directory Tabs */}
        <div className="reports-tabs-bar">
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
          {loading ? (
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
