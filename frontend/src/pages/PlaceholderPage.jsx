// PlaceholderPage.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Construction } from 'lucide-react';
import '../styles/dashboard.css';

const PlaceholderPage = () => {
  const location = useLocation();
  
  const getPageMeta = () => {
    const path = location.pathname;
    switch (path) {
      case '/assessments':
        return { title: 'Assessments Management', desc: 'Allows creation, scheduling, and tracking of staff MCQ and performance evaluations.' };
      case '/reports':
        return { title: 'Evaluation Reports', desc: 'Generates detailed performance analytics, safety compliance metrics, and downloadable summary PDFs.' };
      case '/pointsmen':
        return { title: 'Pointsmen Directory', desc: 'View, filter, and manage profiles for all Station Pointsmen (PM).' };
      case '/station-masters':
        return { title: 'Station Masters Directory', desc: 'Manage profiles and performance history for all Station Masters (SM).' };
      case '/train-managers':
        return { title: 'Train Managers Directory', desc: 'Manage profiles and posting details for all Train Managers (TM).' };
      case '/workforce/station-masters-incharge':
        return { title: 'SM Incharges Directory', desc: 'Access station performance and profile metrics for SM Incharges.' };
      case '/traffic-inspectors':
        return { title: 'Traffic Inspectors Directory', desc: 'Manage Traffic Inspectors (TI) and their assigned stations.' };
      case '/division':
        return { title: 'Division Overview', desc: 'Access division structure, station postings, and safety inspection records.' };
      case '/approvals':
        return { title: 'Approvals Panel', desc: 'Review, approve, or reject completed pointsmen and station master assessments.' };
      case '/staff-management':
        return { title: 'Staff Accounts', desc: 'Manage HRMS credentials, activation statuses, and portal security logs.' };
      case '/audit-logs':
        return { title: 'System Audit Logs', desc: 'Detailed log records of all administrative actions and database changes.' };
      case '/question-bank':
        return { title: 'Question Bank', desc: 'Manage evaluation question categories, MCQ questions, and assessment criteria.' };
      default:
        return { title: 'Module Coming Soon', desc: 'This page is currently being integrated and will be available shortly.' };
    }
  };

  const meta = getPageMeta();

  return (
    <DashboardLayout>
      <div className="placeholder-page-container">
        <div className="placeholder-icon">
          <Construction size={40} />
        </div>
        <h2 className="placeholder-title">{meta.title}</h2>
        <p className="placeholder-desc">{meta.desc}</p>
        <p style={{ fontSize: '12px', color: '#64748B', marginTop: '16px', fontWeight: '500' }}>
          INDIAN RAILWAY EVALUATION SYSTEM • PORTAL MODULE
        </p>
      </div>
    </DashboardLayout>
  );
};

export default PlaceholderPage;
