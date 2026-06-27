// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Lazy-loaded pages
const PMDashboard = React.lazy(() => import('./pages/dashboard/PMDashboard'));
const TMDashboard = React.lazy(() => import('./pages/dashboard/TMDashboard'));
const ShuntingMasterDashboard = React.lazy(() => import('./pages/dashboard/ShuntingMasterDashboard'));
const SMDashboard = React.lazy(() => import('./pages/dashboard/SMDashboard'));
const SMSupervisorDashboard = React.lazy(() => import('./pages/dashboard/SMSupervisorDashboard'));
const TIDashboard = React.lazy(() => import('./pages/dashboard/TIDashboard'));
const AOMDashboard = React.lazy(() => import('./pages/dashboard/AOMDashboard'));
const SuperAdminDashboard = React.lazy(() => import('./pages/dashboard/SuperAdminDashboard'));

const Unauthorized = React.lazy(() => import('./pages/Unauthorized'));
const PlaceholderPage = React.lazy(() => import('./pages/PlaceholderPage'));
const ApprovalsPage = React.lazy(() => import('./pages/approvals/ApprovalsPage'));

// Workforce Pages
const PointsmenPage = React.lazy(() => import('./pages/workforce/PointsmenPage'));
const StationMastersPage = React.lazy(() => import('./pages/workforce/StationMastersPage'));
const TrainManagersPage = React.lazy(() => import('./pages/workforce/TrainManagersPage'));
const StationMasterSupervisorsPage = React.lazy(() => import('./pages/workforce/StationMasterSupervisorsPage'));
const CabinMastersPage = React.lazy(() => import('./pages/workforce/CabinMastersPage'));
const ShuntingMastersPage = React.lazy(() => import('./pages/workforce/ShuntingMastersPage'));
const StationMastersInchargePage = React.lazy(() => import('./pages/workforce/StationMastersInchargePage'));
const TrafficInspectorsPage = React.lazy(() => import('./pages/workforce/TrafficInspectorsPage'));
const AOMUsersPage = React.lazy(() => import('./pages/workforce/AOMUsersPage'));
const WorkforceProfilePage = React.lazy(() => import('./pages/workforce/WorkforceProfilePage'));
const MyProfilePage = React.lazy(() => import('./pages/profile/MyProfilePage'));
const PmeRefStatusPage = React.lazy(() => import('./pages/pme-ref/PmeRefStatusPage'));

// Audit Log Pages
const AuditLogsPage = React.lazy(() => import('./pages/audit/AuditLogsPage'));
const AuditLogDetailPage = React.lazy(() => import('./pages/audit/AuditLogDetailPage'));

// Admin Question Bank Pages
const UploadQuestionsPage = React.lazy(() => import('./pages/admin/question-bank/UploadQuestionsPage'));
const UploadHistoryPage = React.lazy(() => import('./pages/admin/question-bank/UploadHistoryPage'));
const QuestionsListPage = React.lazy(() => import('./pages/admin/question-bank/QuestionsListPage'));

// Assessment Pages
const AssessmentsLandingPage = React.lazy(() => import('./pages/assessments/AssessmentsLandingPage'));
const AssessmentRoleListPage = React.lazy(() => import('./pages/assessments/AssessmentRoleListPage'));
const AssessmentFormPage = React.lazy(() => import('./pages/assessments/AssessmentFormPage'));
const AssessmentHistoryPage = React.lazy(() => import('./pages/assessments/AssessmentHistoryPage').then(module => ({ default: module.AssessmentHistoryPage })));

const MyAssessmentPage = React.lazy(() => import('./pages/my-assessment/MyAssessmentPage'));
const ExamConfirmPage = React.lazy(() => import('./pages/my-assessment/ExamConfirmPage'));
const McqExamPage = React.lazy(() => import('./pages/my-assessment/McqExamPage'));
const ExamSuccessPage = React.lazy(() => import('./pages/my-assessment/ExamSuccessPage'));
const AssessmentScorecardPage = React.lazy(() => import('./pages/my-assessment/AssessmentScorecardPage'));

// Reports Pages
const ReportsDashboardPage = React.lazy(() => import('./pages/reports/ReportsDashboardPage'));
const EmployeeReportPage = React.lazy(() => import('./pages/reports/EmployeeReportPage'));
const StationReportPage = React.lazy(() => import('./pages/reports/StationReportPage'));
const AssessmentCycleReportPage = React.lazy(() => import('./pages/reports/AssessmentCycleReportPage'));

// Stations (Station Intelligence) Pages
const StationListPage = React.lazy(() => import('./pages/stations/StationListPage'));
const StationIntelligencePage = React.lazy(() => import('./pages/stations/StationIntelligencePage'));

import './styles/theme.css';
import './styles/auth.css';
import './styles/dashboard.css';
import './styles/charts.css';
import './styles/assessments.css';
import './styles/reports.css';

// A landing component to route logged-in users to their correct dashboards
const DashboardRoot = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'PM':
      return <Navigate to="/dashboard/pm" replace />;
    case 'TM':
      return <Navigate to="/dashboard/tm" replace />;
    case 'SHM':
    case 'SHUNTING MASTER':
    case 'Shunting Master':
      return <Navigate to="/dashboard/shunting-master" replace />;
    case 'SS':
    case 'SM':
    case 'Cabin Master':
    case 'CABIN MASTER':
      return <Navigate to="/dashboard/sm" replace />;
    case 'SMS':
    case 'STATION MASTER SUPERVISOR':
    case 'Station Master Supervisor':
    case 'Station Master Supervisior':
    case 'Station Master Supervisio':
      return <Navigate to="/dashboard/station-master-supervisor" replace />;
    case 'TI': return <Navigate to="/dashboard/ti" replace />;
    case 'AOM': return <Navigate to="/dashboard/aom" replace />;
    case 'SUPER_ADMIN': return <Navigate to="/dashboard/super-admin" replace />;
    default: return <Navigate to="/unauthorized" replace />;
  }
};

const PageLoader = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '80vh',
    width: '100%',
    color: '#0B2341',
    gap: '16px'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #F1F5F9',
      borderTop: '4px solid #0B2341',
      borderRadius: '50%',
      animation: 'spin-loader 1s linear infinite'
    }}></div>
    <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#64748B' }}>
      Loading Safety Console...
    </span>
    <style>{`
      @keyframes spin-loader {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  React.useEffect(() => {
    // Inject Google Translate target element
    const divId = 'google_translate_element';
    if (!document.getElementById(divId)) {
      const googleDiv = document.createElement('div');
      googleDiv.id = divId;
      googleDiv.style.display = 'none';
      document.body.appendChild(googleDiv);
    }

    // Inject Google Translate translation script
    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const addScript = document.createElement('script');
      addScript.setAttribute('src', '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit');
      addScript.setAttribute('id', scriptId);
      document.body.appendChild(addScript);

      window.googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            { pageLanguage: 'en', includedLanguages: 'en,hi' },
            'google_translate_element'
          );
        }
      };
    }
  }, []);

  React.useEffect(() => {
    // Only run version check in production environments
    if (import.meta.env.DEV) return;

    const checkVersion = async () => {
      try {
        const response = await fetch('/index.html?t=' + Date.now(), { cache: 'no-store' });
        if (!response.ok) return;
        const htmlText = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const scriptTags = Array.from(doc.querySelectorAll('script'));
        const newScript = scriptTags.find(s => s.getAttribute('src')?.includes('/assets/index-'));
        const newScriptSrc = newScript ? newScript.getAttribute('src') : null;
        
        const currentScripts = Array.from(document.querySelectorAll('script'));
        const currentScript = currentScripts.find(s => s.getAttribute('src')?.includes('/assets/index-'));
        const currentScriptSrc = currentScript ? currentScript.getAttribute('src') : null;
        
        if (newScriptSrc && currentScriptSrc && newScriptSrc !== currentScriptSrc) {
          console.log('New deployment version detected. Auto-reloading the page...');
          window.location.reload();
        }
      } catch (err) {
        console.warn('Error checking deployment version:', err);
      }
    };

    // Check for a new deployment every 30 seconds
    const interval = setInterval(checkVersion, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <React.Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MyProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pme-ref-status"
            element={
              <ProtectedRoute>
                <PmeRefStatusPage />
              </ProtectedRoute>
            }
          />

          {/* Root/Dashboard Redirect Router */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRoot />
              </ProtectedRoute>
            }
          />

          {/* Scoped Dashboard Sub-routes */}
          <Route
            path="/dashboard/pm"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PM', 'SS', 'SMS', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER']}>
                  <PMDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tm"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['TM']}>
                  <TMDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/shunting-master"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['Shunting Master', 'SHUNTING MASTER', 'SHM']}>
                  <ShuntingMasterDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/sm"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SM', 'SS', 'Cabin Master', 'CABIN MASTER']}>
                  <SMDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/station-master-supervisor"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SMS', 'STATION MASTER SUPERVISOR', 'Station Master Supervisor', 'Station Master Supervisior', 'Station Master Supervisio']}>
                  <SMSupervisorDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/ti"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['TI']}>
                  <TIDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/aom"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['AOM']}>
                  <AOMDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/super-admin"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                  <SuperAdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Assessment Module Routes */}
          <Route
            path="/assessments"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PM', 'SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER']}>
                  <AssessmentsLandingPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:roleCode"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER']}>
                  <AssessmentRoleListPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:roleCode/:employeeId/history"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER']}>
                  <AssessmentHistoryPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:roleCode/:assessmentId/form"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SM', 'TI', 'AOM', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER']}>
                  <AssessmentFormPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:roleCode/:assessmentId/view"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PM', 'SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER']}>
                  <AssessmentFormPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:roleCode/:assessmentId/edit"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SM', 'TI', 'AOM', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER']}>
                  <AssessmentFormPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Candidate Assessment Module Routes */}
          <Route
            path="/my-assessment"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PM', 'SM', 'TM', 'SS', 'SMS', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER', 'SHM', 'SHUNTING MASTER', 'Shunting Master', 'TI', 'AOM']}>
                  <MyAssessmentPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-assessment/:assessmentId/confirm"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PM', 'SM', 'TM', 'SS', 'SMS', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER', 'SHM', 'SHUNTING MASTER', 'Shunting Master', 'TI', 'AOM']}>
                  <ExamConfirmPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-assessment/:assessmentId/exam"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PM', 'SM', 'TM', 'SS', 'SMS', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER', 'SHM', 'SHUNTING MASTER', 'Shunting Master', 'TI', 'AOM']}>
                  <McqExamPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-assessment/:assessmentId/success"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PM', 'SM', 'TM', 'SS', 'SMS', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER', 'SHM', 'SHUNTING MASTER', 'Shunting Master', 'TI', 'AOM']}>
                  <ExamSuccessPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-assessment/:assessmentId/scorecard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PM', 'SM', 'TM', 'SS', 'SMS', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER', 'SHM', 'SHUNTING MASTER', 'Shunting Master', 'TI', 'AOM']}>
                  <AssessmentScorecardPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER']}>
                  <ReportsDashboardPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/employee/:employeeId"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER']}>
                  <EmployeeReportPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/stations"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER']}>
                  <StationReportPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/cycles"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER']}>
                  <AssessmentCycleReportPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/division"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['AOM', 'SUPER_ADMIN']}>
                  <StationListPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stations"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['TI']}>
                  <StationListPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stations/:stationId"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['TI', 'AOM', 'SUPER_ADMIN', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR']}>
                  <StationIntelligencePage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SM', 'SS', 'TI', 'AOM', 'SUPER_ADMIN', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Station Master Supervisior', 'Station Master Supervisio', 'Cabin Master', 'CABIN MASTER']}>
                  <ApprovalsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/staff-management" element={<ProtectedRoute><PlaceholderPage /></ProtectedRoute>} />
          
          {/* Secure Audit Logs module */}
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                  <AuditLogsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs/:id"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                  <AuditLogDetailPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/question-bank/upload"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                  <UploadQuestionsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/question-bank/history"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                  <UploadHistoryPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/question-bank/questions"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                  <QuestionsListPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/question-bank"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                  <Navigate to="/admin/question-bank/upload" replace />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/question-bank"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                  <Navigate to="/admin/question-bank/upload" replace />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Workforce Management Routes */}
          <Route
            path="/workforce/pointsmen"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER']}>
                  <PointsmenPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workforce/station-masters"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['TI', 'AOM', 'SUPER_ADMIN', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR']}>
                  <StationMastersPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workforce/train-managers"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SM', 'SS', 'TI', 'AOM', 'SUPER_ADMIN', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER']}>
                  <TrainManagersPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workforce/station-master-supervisors"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['TI', 'AOM', 'SUPER_ADMIN', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR']}>
                  <StationMasterSupervisorsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workforce/cabin-master"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['TI', 'AOM', 'SUPER_ADMIN', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR']}>
                  <CabinMastersPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workforce/shunting-masters"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER']}>
                  <ShuntingMastersPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workforce/station-masters-incharge"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['AOM', 'SUPER_ADMIN']}>
                  <StationMastersInchargePage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workforce/traffic-inspectors"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['AOM', 'SUPER_ADMIN']}>
                  <TrafficInspectorsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workforce/aom-users"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                  <AOMUsersPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workforce/profile/:id"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SM', 'TI', 'AOM', 'SUPER_ADMIN', 'SS', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'Cabin Master', 'CABIN MASTER']}>
                  <WorkforceProfilePage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Catch-all Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </React.Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
