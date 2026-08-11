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
  X,
  QrCode,
} from 'lucide-react';
import { settingsService } from '../services/settingsService';
import SpiderIcon from './SpiderIcon';

const Sidebar = ({ isOpen = true, onClose }) => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getSettings();
        setSettings(data);
      } catch (err) {
        // ignore
      }
    };
    fetchSettings();
    const interval = setInterval(fetchSettings, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* Brand Header with Spider-Man Icon */}
      <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--spidey-red), #991b1b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px var(--spidey-red-glow)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <SpiderIcon size={30} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '0.04em', color: '#ffffff' }}>HEMS SPIDEY</h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--spidey-cyan)', fontWeight: '700', letterSpacing: '0.06em' }}>EVALUATION SYSTEM</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="sidebar-close-mobile-btn"
            title="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Evaluation Round Status */}
      {settings && (
        <div style={{ padding: '1rem 1.25rem' }}>
          <div style={{ background: 'rgba(13, 19, 34, 0.95)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', boxShadow: '0 0 15px rgba(0, 240, 255, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>System Status</span>
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
            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--spidey-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={16} /> Dynamic Evaluation
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

        <NavLink to="/attendance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <QrCode size={18} />
          <span>Attendance</span>
        </NavLink>

        <NavLink to="/evaluation" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <CheckSquare size={18} />
          <span>Evaluation & Rounds</span>
        </NavLink>

        <NavLink to="/results" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Trophy size={18} />
          <span>Results & Leaderboard</span>
        </NavLink>

        <NavLink to="/winners" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Award size={18} style={{ color: 'var(--spidey-gold)' }} />
          <span>Winners Display</span>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Sliders size={18} />
          <span>System Settings</span>
        </NavLink>
      </nav>

      {/* Footer Info */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <SpiderIcon size={16} color="var(--spidey-cyan)" />
        <span>HEMS v2.0 &bull; Spidey Edition</span>
      </div>
    </aside>
  );
};

export default Sidebar;
