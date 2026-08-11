import React, { useState } from 'react';
import { attendanceService } from '../services/attendanceService';
import {
  Layers,
  Plus,
  CheckCircle,
  Trash2,
  X,
  Radio,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const AttendanceSessionsModal = ({ isOpen, onClose, sessions, onSessionUpdated }) => {
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionDesc, setNewSessionDesc] = useState('');
  const [makeActive, setMakeActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    try {
      setLoading(true);
      setError('');
      await attendanceService.createSession({
        name: newSessionName.trim(),
        description: newSessionDesc.trim(),
        makeActive,
      });

      setNewSessionName('');
      setNewSessionDesc('');
      setMakeActive(false);
      setShowAddForm(false);
      if (onSessionUpdated) onSessionUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (session) => {
    if (session.isActive) return;
    try {
      setLoading(true);
      setError('');
      await attendanceService.updateSession(session._id, { isActive: true });
      if (onSessionUpdated) onSessionUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to activate session');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (session) => {
    if (!window.confirm(`Are you sure you want to delete session "${session.name}"? All attendance records logged for this session will be permanently deleted.`)) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      await attendanceService.deleteSession(session._id);
      if (onSessionUpdated) onSessionUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 240, 255, 0.15)',
                color: 'var(--spidey-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Manage Attendance Sessions</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Track attendance across Event Check-in, Rounds, or custom sessions
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Sessions List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                Configured Sessions ({sessions.length})
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn btn-cyan btn-sm"
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
              >
                <Plus size={14} /> {showAddForm ? 'Cancel' : 'Add New Session'}
              </button>
            </div>

            {sessions.map((s) => (
              <div
                key={s._id}
                style={{
                  backgroundColor: s.isActive ? 'rgba(0, 240, 255, 0.08)' : 'var(--bg-input)',
                  border: s.isActive ? '1px solid var(--spidey-cyan)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => handleSetActive(s)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: s.isActive ? 'default' : 'pointer',
                      color: s.isActive ? 'var(--spidey-cyan)' : 'var(--text-muted)',
                      padding: 0,
                    }}
                    title={s.isActive ? 'Active Session' : 'Click to make active'}
                  >
                    <Radio size={20} />
                  </button>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '700', color: s.isActive ? '#fff' : 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {s.name}
                      </span>
                      {s.isActive && (
                        <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                          Active Target
                        </span>
                      )}
                    </div>
                    {s.description && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {s.description}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {!s.isActive && (
                    <button
                      type="button"
                      onClick={() => handleSetActive(s)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      disabled={loading}
                    >
                      Set Active
                    </button>
                  )}
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSession(s)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.3rem', borderRadius: '6px' }}
                      title="Delete session"
                      disabled={loading}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Session Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreateSession}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--spidey-cyan)' }}>
                Create New Attendance Session
              </h4>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Session Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Round 1 Check-in, Day 2 Morning, Workshop..."
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Description (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Attendance before Round 1 starts"
                  value={newSessionDesc}
                  onChange={(e) => setNewSessionDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="makeActiveCheck"
                  checked={makeActive}
                  onChange={(e) => setMakeActive(e.target.checked)}
                />
                <label htmlFor="makeActiveCheck" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Make this the active scanning session immediately
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.3rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!newSessionName.trim() || loading}
                >
                  Save Session
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSessionsModal;
