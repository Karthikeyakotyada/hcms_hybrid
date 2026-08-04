import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const getTitleFromPath = (pathname) => {
  if (pathname.includes('/dashboard')) return 'Dashboard Overview';
  if (pathname.includes('/teams')) return 'Team & Participant Management';
  if (pathname.includes('/round1')) return 'Round 1 Evaluation';
  if (pathname.includes('/round2')) return 'Round 2 Evaluation';
  if (pathname.includes('/results')) return 'Evaluation Results & Leaderboard';
  if (pathname.includes('/winners')) return 'Hackathon Winners Showcase';
  if (pathname.includes('/settings')) return 'System Settings & Audit Logs';
  return 'Hackathon Evaluation Management System';
};

const MainLayout = () => {
  const location = useLocation();
  const pageTitle = getTitleFromPath(location.pathname);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title={pageTitle} />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
