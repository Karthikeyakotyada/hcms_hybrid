import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Award,
  Trophy,
  Sliders,
  CheckSquare,
  Lock,
  Unlock,
  Layers,
} from 'lucide-react';
import { settingsService } from '../services/settingsService';

const Sidebar = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getSettings();
        setSettings(data);
      } catch (err) {
        // ignore error
      }
    };
    fetchSettings();
    const interval = setInterval(fetchSettings, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}>
          <Trophy size={22} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: '700', letterSpacing: '-0.02em', color: '#ffffff' }}>HEMS</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hackathon Evaluation</p>
        </div>
      </div>

      {/* Evaluation Round Banner */}
      {settings && (
        <div style={{ padding: '1rem 1.25rem' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Active Round</span>
              {settings.isLocked ? (
                <span className="badge badge-danger" title="System Locked">
                  <Lock size={12} /> Locked
                </span>
              ) : (
                <span className="badge badge-success" title="System Unlocked">
                  <Unlock size={12} /> Active
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={16} /> {settings.currentRound}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav style={{ flex: 1, paddingTop: '0.5rem' }}>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/teams" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={18} />
          <span>Team Management</span>
        </NavLink>

        <NavLink to="/round1" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <CheckSquare size={18} />
          <span>Round 1 Evaluation</span>
        </NavLink>

        <NavLink to="/round2" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Award size={18} />
          <span>Round 2 Evaluation</span>
        </NavLink>

        <NavLink to="/results" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Trophy size={18} />
          <span>Results & Leaderboard</span>
        </NavLink>

        <NavLink to="/winners" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Trophy size={18} style={{ color: '#f59e0b' }} />
          <span>Winners Display</span>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Sliders size={18} />
          <span>Settings & Audit</span>
        </NavLink>
      </nav>

      {/* Footer Info */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        HEMS v1.0.0 &bull; Internal Organizer Portal
      </div>
    </aside>
  );
};

export default Sidebar;
