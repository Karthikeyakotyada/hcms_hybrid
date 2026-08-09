import React, { useEffect, useState } from 'react';
import { settingsService } from '../services/settingsService';
import { roundService } from '../services/roundService';
import {
  Sliders,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  Save,
  Trophy,
  Layers,
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  Trash2,
  KeyRound,
  AlertTriangle,
  X,
} from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [enableIndividualScoring, setEnableIndividualScoring] = useState(true);
  const [topTeamsCount, setTopTeamsCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roundLockingId, setRoundLockingId] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Double-Authentication Modal States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPhrase, setResetPhrase] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const [data, roundsData] = await Promise.all([
        settingsService.getSettings(),
        roundService.getRounds(),
      ]);
      setSettings(data);
      setIsLocked(data.isLocked);
      setEnableIndividualScoring(
        data.enableIndividualScoring !== undefined ? data.enableIndividualScoring : true
      );
      setTopTeamsCount(data.topTeamsCount || 3);
      setRounds(roundsData || []);
    } catch (err) {
      setError('Error loading settings and evaluation rounds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleToggleRoundLock = async (round) => {
    setMsg('');
    setError('');
    setRoundLockingId(round._id);
    const newLockState = !round.isLocked;

    try {
      await roundService.updateRound(round._id, { isLocked: newLockState });
      setRounds((prev) =>
        prev.map((r) => (r._id === round._id ? { ...r, isLocked: newLockState } : r))
      );
      setMsg(
        `Round '${round.name}' is now ${newLockState ? 'LOCKED (Evaluations restricted)' : 'UNLOCKED (Evaluations active)'}`
      );
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating round lock state');
    } finally {
      setRoundLockingId(null);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setSaving(true);
    try {
      const updated = await settingsService.updateSettings({
        isLocked,
        enableIndividualScoring,
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

  // Open Double-Auth Modal
  const handleOpenResetModal = () => {
    setResetPhrase('');
    setResetPassword('');
    setResetError('');
    setShowResetModal(true);
  };

  // Execute Double-Authenticated Reset
  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setResetError('');

    if (resetPhrase.trim().toUpperCase() !== 'RESET') {
      setResetError("Security phrase mismatch. You must type 'RESET' exactly.");
      return;
    }

    if (!resetPassword) {
      setResetError('Please enter your account password to verify authentication.');
      return;
    }

    setResetting(true);
    try {
      const result = await settingsService.resetEvaluation(resetPassword, resetPhrase.trim().toUpperCase());
      setShowResetModal(false);
      setMsg(result.message || 'All evaluation scores in your workspace have been successfully reset!');
      setTimeout(() => setMsg(''), 5000);
      await fetchSettingsData();
    } catch (err) {
      setResetError(
        err.response?.data?.message || 'Security verification failed. Please check your password and try again.'
      );
    } finally {
      setResetting(false);
    }
  };

  if (loading && !settings) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--spidey-cyan)', fontWeight: '700' }}>
        Loading system settings & controls...
      </div>
    );
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
          Manage round-by-round evaluation locking, individual member scoring controls, and leaderboard preferences.
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

      {/* Section 1: Individual Round-Wise Evaluation Locking */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--spidey-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={20} /> Round-by-Round Evaluation Locking
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Lock or unlock evaluation for each round individually. When you create new rounds (e.g. Round 3, Round 4), they will automatically appear here for independent lock control.
            </p>
          </div>
          <span className="badge badge-info">{rounds.length} Active Rounds Configured</span>
        </div>

        {rounds.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
            No evaluation rounds found. Create rounds from the Evaluation page.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {rounds.map((r) => {
              const isRoundLocked = Boolean(r.isLocked);
              const isUpdating = roundLockingId === r._id;

              return (
                <div
                  key={r._id}
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: isRoundLocked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    boxShadow: isRoundLocked ? '0 0 15px rgba(239, 68, 68, 0.1)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="team-badge" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                        Order #{r.order || 1}
                      </span>

                      {isRoundLocked ? (
                        <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Lock size={12} /> Locked
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Unlock size={12} /> Active / Open
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {r.name}
                    </h4>
                    {r.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {r.description}
                      </p>
                    )}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Weight Multiplier: <strong style={{ color: 'var(--spidey-cyan)' }}>{r.weight || 1}x</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.78rem', color: isRoundLocked ? '#f87171' : 'var(--text-muted)' }}>
                      {isRoundLocked ? 'Evaluations are disabled' : 'Evaluations accepting scores'}
                    </span>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleToggleRoundLock(r)}
                      className={`btn btn-sm ${isRoundLocked ? 'btn-cyan' : 'btn-danger'}`}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                    >
                      {isRoundLocked ? <Unlock size={14} /> : <Lock size={14} />}
                      <span>
                        {isUpdating ? 'Updating...' : isRoundLocked ? 'Unlock Round' : 'Lock Round'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Settings Form: Individual Scoring Toggle + Master Settings */}
      <form onSubmit={handleSaveSettings} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          Evaluation Mode & Portal Configuration
        </h3>

        {/* Setting 1: Individual Participant Scoring Toggle */}
        <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ maxWidth: '650px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <Users size={18} color="var(--spidey-cyan)" />
                <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 0 }}>
                  Individual Participant Scoring System
                </label>
                {enableIndividualScoring ? (
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Enabled</span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Disabled (Team Only)</span>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Enable or disable individual score inputs (1–100) for each team member. When disabled, evaluators will only grade overall Team Competition Scores (1–50) and individual grading is bypassed.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEnableIndividualScoring(!enableIndividualScoring)}
              className={`btn ${enableIndividualScoring ? 'btn-cyan' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1.25rem' }}
            >
              {enableIndividualScoring ? (
                <>
                  <UserCheck size={16} />
                  <span>Individual Scoring is ON</span>
                </>
              ) : (
                <>
                  <UserX size={16} />
                  <span>Individual Scoring is OFF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Setting 2: Top Teams Showcase Count */}
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

        {/* Setting 3: Emergency Global System Master Lock */}
        <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} color={isLocked ? '#ef4444' : 'var(--text-muted)'} /> Emergency Master System Lock
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Globally freezes the entire portal. Blocks all score changes, roster edits, and round modifications at once.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              className={`btn ${isLocked ? 'btn-danger' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1.25rem' }}
            >
              {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
              <span>{isLocked ? 'Portal is LOCKED' : 'Portal is ACTIVE'}</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }} disabled={saving}>
            <Save size={18} />
            <span>{saving ? 'Saving Settings...' : 'Save System Settings'}</span>
          </button>
        </div>
      </form>

      {/* Danger Zone: Double-Authenticated Evaluation Scores Reset */}
      <div
        className="card"
        style={{
          border: '1px solid rgba(239, 68, 68, 0.4)',
          backgroundColor: 'rgba(239, 68, 68, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RotateCcw size={20} /> Reset Workspace Evaluation Scores
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.3rem', maxWidth: '650px' }}>
              Clear and erase all competition scores and individual member scores across all evaluation rounds in your account. Requires double authentication (phrase confirmation + password verification). Team rosters and members will remain untouched.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenResetModal}
            className="btn btn-danger"
            style={{ padding: '0.65rem 1.5rem', fontSize: '0.88rem' }}
            disabled={saving}
          >
            <Trash2 size={16} />
            <span>Reset All Scores</span>
          </button>
        </div>
      </div>

      {/* High-Security Double-Authentication Modal */}
      {showResetModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: '480px',
              border: '2px solid var(--spidey-red)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 35px rgba(229, 9, 20, 0.35)',
            }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldAlert size={22} color="#ef4444" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#ffffff' }}>
                  Double Security Authentication
                </h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                disabled={resetting}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmReset}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Warning Banner */}
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    fontSize: '0.82rem',
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    lineHeight: '1.45',
                  }}
                >
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
                  <div>
                    <strong style={{ color: '#ef4444' }}>CRITICAL DESTRUCTIVE ACTION:</strong>
                    <br />
                    This will permanently erase all team competition marks and individual scores in your workspace. Team profiles will NOT be deleted.
                  </div>
                </div>

                {resetError && (
                  <div
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem',
                      color: '#f87171',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{resetError}</span>
                  </div>
                )}

                {/* Step 1: Confirmation Phrase */}
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                    1. Type <code style={{ color: 'var(--spidey-cyan)', backgroundColor: 'rgba(0, 240, 255, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>RESET</code> below to confirm:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type RESET in uppercase"
                    value={resetPhrase}
                    onChange={(e) => setResetPhrase(e.target.value)}
                    required
                    disabled={resetting}
                    autoFocus
                  />
                </div>

                {/* Step 2: Account Password Re-Authentication */}
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <KeyRound size={15} color="var(--spidey-cyan)" />
                    2. Enter your account password to authorize:
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Account password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    required
                    disabled={resetting}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="btn btn-secondary btn-sm"
                  disabled={resetting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger btn-sm"
                  style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  disabled={resetting || resetPhrase.trim().toUpperCase() !== 'RESET' || !resetPassword}
                >
                  <Trash2 size={15} />
                  <span>{resetting ? 'Verifying Security...' : 'Authenticate & Reset Scores'}</span>
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
