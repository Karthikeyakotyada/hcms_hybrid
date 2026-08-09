import React, { useEffect, useState } from 'react';
import { teamService } from '../services/teamService';
import { evalService } from '../services/evalService';
import { settingsService } from '../services/settingsService';
import SearchBar from '../components/SearchBar';
import {
  Save,
  Lock,
  AlertCircle,
  CheckCircle,
  Award,
  Users,
  ChevronRight,
  Info,
} from 'lucide-react';

const Round2Page = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);

  // Score states
  const [competitionScore, setCompetitionScore] = useState('');
  const [comments, setComments] = useState('');
  const [individualScores, setIndividualScores] = useState({});

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const setRes = await settingsService.getSettings();
        setSettings(setRes);
        const teamsRes = await teamService.getTeams(1, 50, search);
        setTeams(teamsRes.teams);
        if (teamsRes.teams.length > 0 && !selectedTeam) {
          loadTeamScores(teamsRes.teams[0]);
        }
      } catch (err) {
        setError('Error initializing Round 2 evaluation');
      }
    };
    init();
  }, [search]);

  const loadTeamScores = async (team) => {
    try {
      setLoading(true);
      setSelectedTeam(team);
      setMessage('');
      setError('');

      const evalData = await evalService.getRound2Scores(team._id);

      setCompetitionScore(evalData.competitionScore !== null ? String(evalData.competitionScore) : '');
      setComments(evalData.comments || '');

      const indMap = {};
      if (evalData.individualScores) {
        evalData.individualScores.forEach((item) => {
          indMap[item.memberId] = item.score;
        });
      }
      setIndividualScores(indMap);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading team scores');
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualScoreChange = (memberId, value) => {
    const num = value === '' ? '' : Math.max(0, Number(value));
    setIndividualScores((prev) => ({ ...prev, [memberId]: num }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Validation
    const compScoreNum = Number(competitionScore);
    if (isNaN(compScoreNum) || compScoreNum < 1 || compScoreNum > 50) {
      setError('Competition Score is required and must be a number between 1 and 50');
      return;
    }

    let hasIndError = false;
    const payloadIndScores = Object.entries(individualScores).map(([memberId, score]) => {
      const numScore = Number(score);
      if (score !== '' && (isNaN(numScore) || numScore < 1 || numScore > 100)) {
        hasIndError = true;
      }
      return {
        memberId,
        score: score === '' ? 0 : numScore,
      };
    });

    if (hasIndError) {
      setError('Individual Scores must be between 1 and 100');
      setSaving(false);
      return;
    }

    setSaving(true);
    try {
      await evalService.saveRound2Scores(selectedTeam._id, {
        competitionScore: compScoreNum,
        comments,
        individualScores: payloadIndScores,
      });

      setMessage(`Round 2 evaluation successfully saved for Team ${selectedTeam.teamNumber}!`);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save Round 2 score');
    } finally {
      setSaving(false);
    }
  };

  // Determine read-only / locked state
  const isLockedOrInactive =
    !settings ||
    settings.isLocked ||
    settings.currentRound !== 'Round 2';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Award size={24} color="#f59e0b" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Round 2 Evaluation Module</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Final evaluation round. Scores are multiplied with Round 1 scores (`Round 1 * Round 2`) for final rankings.
          </p>
        </div>

        {isLockedOrInactive && (
          <div className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
            <Lock size={16} /> ROUND 2 LOCKED (
            {settings?.isLocked
              ? 'Evaluation System Locked'
              : settings?.currentRound === 'Round 1'
              ? 'Active Phase is Round 1'
              : 'Evaluation Completed'}
            )
          </div>
        )}
      </div>

      {/* Main Grid: Direct Team Search/Selector + Score Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
        {/* Left Column: Direct Search & Select List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
            Direct Team Selector
          </h4>

          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search Team # or Name..."
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '500px', overflowY: 'auto' }}>
            {teams.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem' }}>
                No teams found.
              </p>
            ) : (
              teams.map((t) => {
                const isSelected = selectedTeam && selectedTeam._id === t._id;
                return (
                  <button
                    key={t._id}
                    onClick={() => loadTeamScores(t)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div>
                      <span className="team-badge" style={{ fontSize: '0.78rem' }}>
                        {t.teamNumber}
                      </span>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '0.2rem' }}>
                        {t.teamName}
                      </div>
                    </div>
                    <ChevronRight size={16} color={isSelected ? '#f59e0b' : 'var(--text-muted)'} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Score Form */}
        <div>
          {!selectedTeam ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Select a team from the left list to conduct Round 2 evaluation.
            </div>
          ) : (
            <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Selected Team Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="team-badge" style={{ fontSize: '1.1rem', padding: '0.4rem 0.9rem' }}>
                    {selectedTeam.teamNumber}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>{selectedTeam.teamName}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Department: {selectedTeam.department}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Notifications */}
              {message && (
                <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', color: '#34d399', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} /> {message}
                </div>
              )}

              {error && (
                <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              {/* Section 1: Competition Score (Mandatory 1-50) */}
              <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Round 2 Competition Score *
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Final pitch & prototype competition score (Strict range: 1 to 50).
                    </p>
                  </div>
                  <span className="badge badge-info">Range: 1 - 50</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '1rem', alignItems: 'start' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Score (1 - 50) *</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      step="0.5"
                      className="form-input font-mono"
                      style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f59e0b', textAlign: 'center' }}
                      value={competitionScore}
                      onChange={(e) => setCompetitionScore(e.target.value)}
                      disabled={isLockedOrInactive}
                      placeholder="Score (1-50)"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Judge / Evaluator Comments</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Optional Round 2 feedback notes..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      disabled={isLockedOrInactive}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Individual Member Scores */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#f59e0b', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} /> Member Individual Evaluation (Records Only)
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Individual participant score inputs stored for record purposes.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {selectedTeam.members && selectedTeam.members.map((m, idx) => (
                    <div key={m._id} style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Member #{idx + 1}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{m.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono', marginBottom: '0.8rem' }}>
                        Reg #: {m.registerNumber}
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Individual Score</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="form-input font-mono"
                          value={individualScores[m._id] ?? ''}
                          onChange={(e) => handleIndividualScoreChange(m._id, e.target.value)}
                          disabled={isLockedOrInactive}
                          placeholder="e.g. 90"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Save Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Info size={14} /> Manual Save required. Scores will not autosave.
                </span>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 2rem', backgroundColor: '#f59e0b', borderColor: '#d97706' }}
                  disabled={isLockedOrInactive || saving}
                >
                  <Save size={18} />
                  <span>{saving ? 'Saving...' : 'Save Round 2 Scores'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Round2Page;
