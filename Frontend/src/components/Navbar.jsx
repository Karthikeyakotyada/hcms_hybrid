import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu } from 'lucide-react';
import SpiderIcon from './SpiderIcon';

const Navbar = ({ title, sidebarOpen, onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Three Lines Toolbar / Menu Toggle Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="sidebar-toggle-btn"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <SpiderIcon size={22} color="var(--spidey-red)" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {title || 'Dashboard'}
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.9rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <SpiderIcon size={16} color="var(--spidey-cyan)" />
          <div style={{ fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Organizer: </span>
            <strong style={{ color: 'var(--spidey-cyan)' }}>{user ? user.username : 'Organizer'}</strong>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          title="Sign out of system"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
