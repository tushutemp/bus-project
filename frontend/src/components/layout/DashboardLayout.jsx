import React, { useState } from 'react';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import './DashboardLayout.css';

const DashboardLayout = ({ children, userRole = 'passenger' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        userRole={userRole}
      />
      
      <div className="main-content">
        <Header 
          userRole={userRole}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;