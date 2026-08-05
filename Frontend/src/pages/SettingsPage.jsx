import React, { useEffect, useState } from 'react';
import { settingsService } from '../services/settingsService';
import {
  Sliders,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Save,
  Trophy,
} from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
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

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
      setIsLocked(data.isLocked);
      setTopTeamsCount(data.topTeamsCount || 3);
    } catch (err) {
      setError('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setSaving(true);
    try {
      const updated = await settingsService.updateSettings({
        isLocked,
        topTeamsCount: Number(topTeamsCount),
      });
      setSettings(updated);
      setMsg('System settings updated successfully!');
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
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset evaluation');
    } finally {
      setResetting(false);
    }
  };

  if (loading && !settings) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--spidey-cyan)', fontWeight: '700' }}>Loading system settings...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sliders size={24} color="var(--spidey-red)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>System Settings & Controls</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Manage evaluation locking, leaderboard configuration, and data resets.
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
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          Portal Configuration
        </h3>

        {/* Setting 1: Lock Evaluation */}
        <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isLocked ? <Lock size={18} color="#ef4444" /> : <Unlock size={18} color="#10b981" />} Lock System Evaluation
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                When evaluation is locked, no score submissions or team changes can occur anywhere in the portal.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              className={`btn ${isLocked ? 'btn-danger' : 'btn-cyan'}`}
            >
              {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
              <span>{isLocked ? 'System is LOCKED (Click to Unlock)' : 'System is ACTIVE (Click to Lock)'}</span>
            </button>
          </div>
        </div>

        {/* Setting 2: Top Teams Count */}
        <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1rem', alignItems: 'center' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={18} color="var(--spidey-gold)" /> Top Teams Showcase Count
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Number of top ranked teams highlighted on the Winners Showcase page (Default: 3).
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
            <span>{saving ? 'Saving...' : 'Save System Settings'}</span>
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
              Wipes all evaluation scores and member marks across all rounds. Team registration roster stays intact.
            </p>
          </div>

          <button onClick={() => setShowResetModal(true)} className="btn btn-danger">
            Reset Evaluation Scores
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} /> Reset Evaluation Confirmation
              </h3>
            </div>

            <form onSubmit={handleResetSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  This action is <strong>IRREVERSIBLE</strong>. It will clear all evaluation scores, comments, and member individual marks across all rounds.
                </p>

                <p style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: '700' }}>
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
