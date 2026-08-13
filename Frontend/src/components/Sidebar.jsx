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
      {/* Brand Header with App Logo */}
      <div className="sidebar-brand-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#e6e6e6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)' }}>
            <img src="/logo.png" alt="App Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '0.04em', color: '#ffffff' }}>ORVIXFLOW</h1>
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
        <div className="sidebar-status-container">
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
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" onClick={() => onClose && onClose()} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/teams" onClick={() => onClose && onClose()} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={18} />
          <span>Team Management</span>
        </NavLink>

        <NavLink to="/attendance" onClick={() => onClose && onClose()} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <QrCode size={18} style={{ color: 'var(--spidey-cyan)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span>Attendance (QR)</span>
            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(0, 240, 255, 0.15)', color: 'var(--spidey-cyan)', fontWeight: 700 }}>NEW</span>
          </div>
        </NavLink>

        <NavLink to="/evaluation" onClick={() => onClose && onClose()} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <CheckSquare size={18} />
          <span>Marks Evaluation</span>
        </NavLink>

        <NavLink to="/results" onClick={() => onClose && onClose()} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Trophy size={18} />
          <span>Leaderboard</span>
        </NavLink>

        <NavLink to="/winners" onClick={() => onClose && onClose()} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Award size={18} style={{ color: 'var(--spidey-gold)' }} />
          <span>Winners Display</span>
        </NavLink>

        <NavLink to="/settings" onClick={() => onClose && onClose()} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Sliders size={18} />
          <span>System Settings</span>
        </NavLink>
      </nav>

      {/* Footer Info */}
      <div className="sidebar-footer">
        <SpiderIcon size={16} color="var(--spidey-cyan)" />
        <span>ORVIXFLOW v2.0 &bull; Evaluation System</span>
      </div>
    </aside>
  );
};

export default Sidebar;
