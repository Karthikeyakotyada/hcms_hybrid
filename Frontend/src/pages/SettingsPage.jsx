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
    </div>
  );
};

export default SettingsPage;
