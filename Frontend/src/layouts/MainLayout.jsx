import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const getTitleFromPath = (pathname) => {
  if (pathname.includes('/dashboard')) return 'Dashboard Overview';
  if (pathname.includes('/teams')) return 'Team & Participant Management';
  if (pathname.includes('/attendance')) return 'Attendance Management (QR)';
  if (pathname.includes('/evaluation')) return 'Marks Evaluation';
  if (pathname.includes('/results')) return 'Evaluation Results & Leaderboard';
  if (pathname.includes('/winners')) return 'Hackathon Winners Showcase';
  if (pathname.includes('/settings')) return 'System Settings & Controls';
  return 'Hackathon Evaluation Management System';
};

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 900);
  const location = useLocation();
  const pageTitle = getTitleFromPath(location.pathname);

  // Auto-close sidebar on route navigation on mobile/tablet screens
  React.useEffect(() => {
    if (window.innerWidth <= 900) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="app-layout">
      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`main-content ${sidebarOpen ? '' : 'expanded'}`}>
        <Navbar
          title={pageTitle}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
