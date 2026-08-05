import React, { useEffect, useState } from 'react';
import { teamService } from '../services/teamService';
import { roundService } from '../services/roundService';
import { evalService } from '../services/evalService';
import SearchBar from '../components/SearchBar';
import {
  Save,
  Lock,
  AlertCircle,
  CheckCircle,
  CheckSquare,
  Users,
  ChevronRight,
  Info,
  Plus,
  Edit2,
  Trash2,
  Layers,
  X,
} from 'lucide-react';

const EvaluationPage = () => {
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Score states
  const [competitionScore, setCompetitionScore] = useState('');
  const [comments, setComments] = useState('');
  const [individualScores, setIndividualScores] = useState({}); // { memberId: score }

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Round Management Modal State
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [editingRound, setEditingRound] = useState(null);
  const [roundFormData, setRoundFormData] = useState({
    name: '',
    description: '',
    weight: '1',
    order: '1',
  });

  // Fetch all rounds on load
  const fetchRounds = async (selectRoundId = null) => {
    try {
      const data = await roundService.getRounds();
      setRounds(data);
      if (data.length > 0) {
        let current = data.find((r) => r._id === selectRoundId) || data[0];
        setSelectedRound(current);
      }
    } catch (err) {
      setError('Error fetching evaluation rounds');
    }
  };

  useEffect(() => {
    fetchRounds();
  }, []);

  // Fetch teams whenever search changes
  useEffect(() => {
    const fetchTeamsList = async () => {
      try {
        const teamsRes = await teamService.getTeams(1, 50, search);
        setTeams(teamsRes.teams);
        if (teamsRes.teams.length > 0 && !selectedTeam) {
          if (selectedRound) {
            loadTeamScores(selectedRound._id, teamsRes.teams[0]);
          }
        }
      } catch (err) {
        setError('Error fetching teams');
      }
    };
    fetchTeamsList();
  }, [search]);

  // Load team scores when selected round or team changes
  const loadTeamScores = async (roundId, team) => {
    if (!roundId || !team) return;
    try {
      setLoading(true);
      setSelectedTeam(team);
      setMessage('');
      setError('');

      const evalData = await evalService.getRoundScores(roundId, team._id);

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
      setError(err.response?.data?.message || 'Error loading team evaluation scores');
    } finally {
      setLoading(false);
    }
  };

  const handleRoundChange = (round) => {
    setSelectedRound(round);
    if (selectedTeam) {
      loadTeamScores(round._id, selectedTeam);
    }
  };

  const handleIndividualScoreChange = (memberId, value) => {
    const num = value === '' ? '' : Math.max(0, Number(value));
    setIndividualScores((prev) => ({ ...prev, [memberId]: num }));
  };

  // Save evaluation scores
  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedRound || !selectedTeam) return;

    setMessage('');
    setError('');

    // Team Score Validation: 1 - 10
    const compScoreNum = Number(competitionScore);
    if (isNaN(compScoreNum) || compScoreNum < 1 || compScoreNum > 10) {
      setError('Team Competition Score is required and must be a number between 1 and 10');
      return;
    }

    // Individual Score Validation: 1 - 100
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
      setError('Individual Scores must be numbers between 1 and 100');
      return;
    }

    setSaving(true);
    try {
      await evalService.saveRoundScores(selectedRound._id, selectedTeam._id, {
        competitionScore: compScoreNum,
        comments,
        individualScores: payloadIndScores,
      });

      setMessage(`Evaluation saved successfully for Team ${selectedTeam.teamNumber} in ${selectedRound.name}!`);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save evaluation score');
    } finally {
      setSaving(false);
    }
  };

  // Round Modal Handlers
  const handleOpenAddRound = () => {
    setEditingRound(null);
    setRoundFormData({
      name: '',
      description: '',
      weight: '1',
      order: String(rounds.length + 1),
    });
    setShowRoundModal(true);
  };

  const handleOpenEditRound = (r, e) => {
    e.stopPropagation();
    setEditingRound(r);
    setRoundFormData({
      name: r.name,
      description: r.description || '',
      weight: String(r.weight || 1),
      order: String(r.order || 1),
    });
    setShowRoundModal(true);
  };

  const handleSaveRound = async (e) => {
    e.preventDefault();
    try {
      if (editingRound) {
        await roundService.updateRound(editingRound._id, roundFormData);
        await fetchRounds(editingRound._id);
      } else {
        const newRound = await roundService.createRound(roundFormData);
        await fetchRounds(newRound._id);
      }
      setShowRoundModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving evaluation round');
    }
  };

  const handleDeleteRound = async (r, e) => {
    e.stopPropagation();
    if (rounds.length <= 1) {
      alert('You must have at least one evaluation round.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete '${r.name}' and all associated scores?`)) {
      try {
        await roundService.deleteRound(r._id);
        await fetchRounds();
      } catch (err) {
        setError('Error deleting evaluation round');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckSquare size={24} color="var(--spidey-red)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.01em' }}>Dynamic Round Evaluation Module</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Select an evaluation round or create/edit custom rounds. Team scores are strictly 1-10; Individual scores are 1-100.
          </p>
        </div>

        <button className="btn btn-cyan btn-sm" onClick={handleOpenAddRound}>
          <Plus size={16} /> Create / Add New Round
        </button>
      </div>

      {/* Rounds Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {rounds.map((r) => {
          const isSelected = selectedRound && selectedRound._id === r._id;
          return (
            <div
              key={r._id}
              onClick={() => handleRoundChange(r)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isSelected ? 'rgba(229, 9, 20, 0.2)' : 'var(--bg-card)',
                border: isSelected ? '2px solid var(--spidey-red)' : '1px solid var(--border-color)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: isSelected ? '700' : '500',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 15px rgba(229, 9, 20, 0.3)' : 'none',
              }}
            >
              <Layers size={18} color={isSelected ? 'var(--spidey-cyan)' : 'var(--text-muted)'} />
              <span>{r.name}</span>
              <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                W: {r.weight || 1}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.5rem' }}>
                <button
                  onClick={(e) => handleOpenEditRound(r, e)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                  title="Edit Round"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => handleDeleteRound(r, e)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                  title="Delete Round"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Direct Team Search/Selector + Score Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
        {/* Left Column: Direct Team Selector */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--spidey-cyan)' }}>
            Select Team for Evaluation
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
                    onClick={() => selectedRound && loadTeamScores(selectedRound._id, t)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '1px solid var(--spidey-red)' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(229, 9, 20, 0.15)' : 'var(--bg-input)',
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
                    <ChevronRight size={16} color={isSelected ? 'var(--spidey-cyan)' : 'var(--text-muted)'} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Score Form */}
        <div>
          {!selectedTeam || !selectedRound ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Select a round and team from the list to conduct evaluation.
            </div>
          ) : (
            <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Selected Team & Active Round Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="team-badge" style={{ fontSize: '1.1rem', padding: '0.4rem 0.9rem' }}>
                    {selectedTeam.teamNumber}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>{selectedTeam.teamName}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Dept: {selectedTeam.department} {selectedTeam.guideName ? `| Guide: ${selectedTeam.guideName}` : ''}
                    </span>
                  </div>
                </div>

                <div className="badge badge-info" style={{ fontSize: '0.9rem', padding: '0.4rem 0.9rem' }}>
                  Evaluating: {selectedRound.name}
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

              {/* Section 1: Team Competition Score (1 - 10) */}
              <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      Team Competition Score *
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Overall team score for {selectedRound.name} (Strict range: 1 to 10).
                    </p>
                  </div>
                  <span className="badge badge-danger">Strict Range: 1 - 10</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '1rem', alignItems: 'start' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Team Score (1 - 10) *</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      className="form-input font-mono"
                      style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--spidey-cyan)', textAlign: 'center' }}
                      value={competitionScore}
                      onChange={(e) => setCompetitionScore(e.target.value)}
                      placeholder="Score (1-10)"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Evaluator Comments</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Optional feedback for ${selectedRound.name}...`}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Individual Member Scores (1 - 100) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--spidey-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} /> Member Individual Evaluation (1 - 100)
                  </h4>
                  <span className="badge badge-info">Range: 1 - 100</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Individual participant performance scores recorded for team members.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {selectedTeam.members && selectedTeam.members.map((m, idx) => (
                    <div key={m._id} style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Member #{idx + 1}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>{m.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono', marginBottom: '0.8rem' }}>
                        Reg #: {m.registerNumber}
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Individual Score (1 - 100)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className="form-input font-mono"
                          value={individualScores[m._id] ?? ''}
                          onChange={(e) => handleIndividualScoreChange(m._id, e.target.value)}
                          placeholder="Score (1-100)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Action Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Info size={14} /> Manual Save required.
                </span>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 2.5rem' }}
                  disabled={saving}
                >
                  <Save size={18} />
                  <span>{saving ? 'Saving Scores...' : `Save ${selectedRound.name} Scores`}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Round Create/Edit Modal */}
      {showRoundModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>
                {editingRound ? 'Edit Evaluation Round' : 'Create New Evaluation Round'}
              </h3>
              <button
                onClick={() => setShowRoundModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRound}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Round Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={roundFormData.name}
                    onChange={(e) => setRoundFormData({ ...roundFormData, name: e.target.value })}
                    placeholder="e.g. Round 3 - Grand Finale"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={roundFormData.description}
                    onChange={(e) => setRoundFormData({ ...roundFormData, description: e.target.value })}
                    placeholder="Short summary of this evaluation phase..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Weight Multiplier (default 1)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="form-input"
                      value={roundFormData.weight}
                      onChange={(e) => setRoundFormData({ ...roundFormData, weight: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Display Order</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={roundFormData.order}
                      onChange={(e) => setRoundFormData({ ...roundFormData, order: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRoundModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-cyan">
                  {editingRound ? 'Update Round' : 'Create Round'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationPage;
