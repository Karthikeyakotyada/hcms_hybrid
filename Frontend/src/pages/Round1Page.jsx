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
  CheckSquare,
  Users,
  Search,
  ChevronRight,
  Info,
} from 'lucide-react';

const Round1Page = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);

  // Score states
  const [competitionScore, setCompetitionScore] = useState('');
  const [comments, setComments] = useState('');
  const [individualScores, setIndividualScores] = useState({}); // { memberId: score }

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch settings & initial teams
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
        setError('Error initializing Round 1 evaluation');
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

      const evalData = await evalService.getRound1Scores(team._id);

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
    if (isNaN(compScoreNum) || compScoreNum < 1 || compScoreNum > 10) {
      setError('Competition Score is required and must be a number between 1 and 10');
      return;
    }

    const payloadIndScores = Object.entries(individualScores).map(([memberId, score]) => ({
      memberId,
      score: Number(score) || 0,
    }));

    setSaving(true);
    try {
      await evalService.saveRound1Scores(selectedTeam._id, {
        competitionScore: compScoreNum,
        comments,
        individualScores: payloadIndScores,
      });

      setMessage(`Round 1 evaluation successfully saved for Team ${selectedTeam.teamNumber}!`);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save Round 1 score');
    } finally {
      setSaving(false);
    }
  };

  // Determine read-only state
  const isReadOnly =
    !settings ||
    settings.isLocked ||
    settings.currentRound === 'Round 2' ||
    settings.currentRound === 'Completed';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckSquare size={24} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Round 1 Evaluation Module</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Evaluate overall competition performance (Score 1-10) and individual participant scores.
          </p>
        </div>

        {isReadOnly && (
          <div className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
            <Lock size={16} /> READ-ONLY MODE (
            {settings?.isLocked
              ? 'Evaluation Locked'
              : `Current Phase: ${settings?.currentRound}`}
            )
          </div>
        )}
      </div>

      {/* Main Grid: Direct Team Search/Selector + Score Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
        {/* Left Column: Direct Search & Select List (NO mandatory next/prev sequence) */}
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
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-input)',
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
                    <ChevronRight size={16} color={isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'} />
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
              Select a team from the left list to conduct Round 1 evaluation.
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
                      Department: {selectedTeam.department} {selectedTeam.guideName ? `| Guide: ${selectedTeam.guideName}` : ''}
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

              {/* Section 1: Competition Score (Mandatory 1-10) */}
              <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Round 1 Competition Score *
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Overall team presentation & project score (Strict range: 1 to 10). Used for team rankings.
                    </p>
                  </div>
                  <span className="badge badge-info">Range: 1 - 10</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '1rem', alignItems: 'start' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Score (1 - 10) *</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      className="form-input font-mono"
                      style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent-primary)', textAlign: 'center' }}
                      value={competitionScore}
                      onChange={(e) => setCompetitionScore(e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Score (1-10)"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Judge / Evaluator Comments</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Optional evaluator feedback notes..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Individual Member Scores */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--accent-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} /> Member Individual Evaluation (Records Only)
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Individual participant score inputs stored for record purposes (does not affect team ranking).
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
                          disabled={isReadOnly}
                          placeholder="e.g. 85"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Save Button (Autosave is NOT allowed!) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Info size={14} /> Manual Save required. Scores will not autosave.
                </span>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 2rem' }}
                  disabled={isReadOnly || saving}
                >
                  <Save size={18} />
                  <span>{saving ? 'Saving...' : 'Save Round 1 Scores'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Round1Page;
