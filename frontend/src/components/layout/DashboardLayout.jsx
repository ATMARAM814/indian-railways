// DashboardLayout.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../styles/dashboard.css';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="main-panel">
        <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
