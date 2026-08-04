import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, UserCheck, Shield } from 'lucide-react';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="top-navbar">
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          {title || 'Dashboard'}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.8rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <Shield size={16} color="var(--accent-primary)" />
          <div style={{ fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Logged as: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{user ? user.username : 'Organizer'}</strong>
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
