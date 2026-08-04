import React, { useEffect, useState } from 'react';
import { settingsService } from '../services/settingsService';
import Pagination from '../components/Pagination';
import {
  Sliders,
  Lock,
  Unlock,
  Layers,
  AlertTriangle,
  Activity,
  CheckCircle,
  AlertCircle,
  Save,
} from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [currentRound, setCurrentRound] = useState('Round 1');
  const [isLocked, setIsLocked] = useState(false);
  const [topTeamsCount, setTopTeamsCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Reset Modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  // Activity Logs state
  const [logs, setLogs] = useState([]);
  const [logPagination, setLogPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
      setCurrentRound(data.currentRound);
      setIsLocked(data.isLocked);
      setTopTeamsCount(data.topTeamsCount || 3);
    } catch (err) {
      setError('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (page = 1) => {
    try {
      const data = await settingsService.getActivityLogs(page, 10);
      setLogs(data.logs);
      setLogPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  useEffect(() => {
    fetchSettingsData();
    fetchLogs(1);
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setSaving(true);
    try {
      const updated = await settingsService.updateSettings({
        currentRound,
        isLocked,
        topTeamsCount: Number(topTeamsCount),
      });
      setSettings(updated);
      setMsg('System settings updated successfully!');
      fetchLogs(1);
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (confirmText.trim() !== 'RESET EVALUATION') {
      alert("Please type 'RESET EVALUATION' exactly to confirm reset.");
      return;
    }
    setResetting(true);
    try {
      await settingsService.resetEvaluation();
      setShowResetModal(false);
      setConfirmText('');
      setMsg('All evaluation data has been reset to zero.');
      fetchSettingsData();
      fetchLogs(1);
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset evaluation');
    } finally {
      setResetting(false);
    }
  };

  if (loading && !settings) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading settings...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sliders size={24} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>System Settings & Controls</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Manage evaluation round progression, system locking, winner count, and safety controls.
        </p>
      </div>

      {msg && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', color: '#34d399', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} /> {msg}
        </div>
      )}

      {error && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          Evaluation Workflow Configuration
        </h3>

        {/* Setting 1: Current Round */}
        <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Layers size={18} color="var(--accent-primary)" /> Current Evaluation Round
          </label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            When Round 2 starts, Round 1 becomes read-only. When set to Completed, both rounds become read-only.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {['Round 1', 'Round 2', 'Completed'].map((rnd) => (
              <label
                key={rnd}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: currentRound === rnd ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  backgroundColor: currentRound === rnd ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                }}
              >
                <input
                  type="radio"
                  name="currentRound"
                  value={rnd}
                  checked={currentRound === rnd}
                  onChange={(e) => setCurrentRound(e.target.value)}
                />
                <span>{rnd}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Setting 2: Lock Evaluation */}
        <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isLocked ? <Lock size={18} color="#ef4444" /> : <Unlock size={18} color="#10b981" />} Lock Evaluation System
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                When evaluation is locked, no team creation, editing, or score entries can occur anywhere in the app.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              className={`btn ${isLocked ? 'btn-danger' : 'btn-success'}`}
            >
              {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
              <span>{isLocked ? 'System is LOCKED (Click to Unlock)' : 'System is OPEN (Click to Lock)'}</span>
            </button>
          </div>
        </div>

        {/* Setting 3: Top Teams Count */}
        <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1rem', alignItems: 'center' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                Top Teams Display Count (Winners Showcase)
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Number of top ranked teams displayed on the Winners Showcase page (Default: 3).
              </p>
            </div>

            <select
              className="form-select font-mono"
              value={topTeamsCount}
              onChange={(e) => setTopTeamsCount(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  Top {num} Teams
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }} disabled={saving}>
            <Save size={18} />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="card" style={{ border: '1px solid rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} /> Danger Zone: Reset Evaluation Data
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Completely wipes all stored Round 1 and Round 2 competition & individual scores. Team roster stays intact.
            </p>
          </div>

          <button onClick={() => setShowResetModal(true)} className="btn btn-danger">
            Reset Evaluation Scores
          </button>
        </div>
      </div>

      {/* Audit Activity Logs */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Activity size={20} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            System Audit & Activity Logs
          </h3>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Details</th>
                <th>User</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <span className="badge badge-info">{log.action}</span>
                    </td>
                    <td style={{ color: 'var(--text-primary)' }}>{log.details}</td>
                    <td>{log.user || 'Organizer'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={logPagination.page}
          totalPages={logPagination.totalPages}
          onPageChange={fetchLogs}
          totalItems={logPagination.total}
          itemLabel="log entries"
        />
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} /> Reset Evaluation Confirmation
              </h3>
            </div>

            <form onSubmit={handleResetSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  This action is <strong>IRREVERSIBLE</strong>. It will clear all Round 1 & Round 2 evaluation scores, comments, and member individual marks.
                </p>

                <p style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: '600' }}>
                  To confirm, type <strong>RESET EVALUATION</strong> below:
                </p>

                <input
                  type="text"
                  className="form-input font-mono"
                  placeholder="Type RESET EVALUATION"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowResetModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={resetting}>
                  {resetting ? 'Resetting...' : 'Confirm Reset All Scores'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
