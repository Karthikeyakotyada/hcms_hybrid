import React, { useEffect, useState, useRef, useMemo } from 'react';
import { teamService } from '../services/teamService';
import { roundService } from '../services/roundService';
import { evalService } from '../services/evalService';
import { settingsService } from '../services/settingsService';
import SearchBar from '../components/SearchBar';
import {
  Save,
  Lock,
  Unlock,
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
  UserX,
  Calculator,
  PanelLeftClose,
  PanelLeftOpen,
  List,
  Clock,
} from 'lucide-react';
import { formatIST, formatISTWithSuffix } from '../utils/dateUtils';

const EvaluationPage = () => {
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [settings, setSettings] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // In-memory global score cache: key = `${roundId}_${teamId}` -> scoreDoc
  const [allScores, setAllScores] = useState({});

  // Active form states for the currently selected round & team
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

  const [isTeamDrawerOpen, setIsTeamDrawerOpen] = useState(true);
  const isInitialMount = useRef(true);

  // Synchronize form fields whenever selectedTeam, selectedRound, or allScores changes
  useEffect(() => {
    if (!selectedTeam || !selectedRound) {
      setCompetitionScore('');
      setComments('');
      setIndividualScores({});
      return;
    }

    const key = `${selectedRound._id}_${selectedTeam._id}`;
    const scoreDoc = allScores[key];

    if (scoreDoc) {
      setCompetitionScore(
        scoreDoc.teamScore !== undefined && scoreDoc.teamScore !== null
          ? String(scoreDoc.teamScore)
          : ''
      );
      setComments(scoreDoc.comments || '');
      const indMap = {};
      if (scoreDoc.individualScores && Array.isArray(scoreDoc.individualScores)) {
        scoreDoc.individualScores.forEach((item) => {
          if (item.memberId) {
            indMap[item.memberId] =
              item.score !== undefined && item.score !== null ? item.score : '';
          }
        });
      }
      setIndividualScores(indMap);
    } else {
      setCompetitionScore('');
      setComments('');
      setIndividualScores({});
    }
  }, [selectedTeam?._id, selectedRound?._id, allScores]);

  // Full Atomic Initial Load (Fetches rounds, settings, teams, and ALL scores at once)
  const loadFullData = async (targetRoundId = null, targetTeamId = null) => {
    try {
      setLoading(true);
      const [roundsRes, settingsRes, teamsRes, allScoresRes] = await Promise.all([
        roundService.getRounds(),
        settingsService.getSettings().catch(() => null),
        teamService.getTeams(1, 100, search),
        evalService.getAllScores().catch(() => []),
      ]);

      const activeRounds = roundsRes || [];
      setRounds(activeRounds);
      if (settingsRes) setSettings(settingsRes);

      const fetchedTeams = teamsRes?.teams || [];
      setTeams(fetchedTeams);

      // Build comprehensive in-memory scores dictionary: `${roundId}_${teamId}` -> scoreDoc
      const scoresDict = {};
      if (Array.isArray(allScoresRes)) {
        allScoresRes.forEach((s) => {
          if (s.roundId && s.teamId) {
            scoresDict[`${s.roundId.toString()}_${s.teamId.toString()}`] = s;
          }
        });
      }
      setAllScores(scoresDict);

      if (activeRounds.length > 0) {
        const activeRound = targetRoundId
          ? activeRounds.find((r) => r._id === targetRoundId) || activeRounds[0]
          : selectedRound
          ? activeRounds.find((r) => r._id === selectedRound._id) || activeRounds[0]
          : activeRounds[0];

        setSelectedRound(activeRound);

        let activeTeam = null;
        if (targetTeamId) {
          activeTeam = fetchedTeams.find((t) => t._id === targetTeamId);
        } else if (selectedTeam) {
          activeTeam = fetchedTeams.find((t) => t._id === selectedTeam._id);
        }
        if (!activeTeam && fetchedTeams.length > 0) {
          activeTeam = fetchedTeams[0];
        }

        if (activeTeam) {
          setSelectedTeam(activeTeam);
        }
      } else {
        setSelectedRound(null);
      }
    } catch (err) {
      console.error('Error loading evaluation data:', err);
      setError('Error loading evaluation data and rounds');
    } finally {
      setLoading(false);
    }
  };

  // Mount effect
  useEffect(() => {
    loadFullData();
  }, []);

  // Debounced search for teams list (skipped on first render)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const teamsRes = await teamService.getTeams(1, 100, search);
        const fetchedTeams = teamsRes?.teams || [];
        setTeams(fetchedTeams);
        if (fetchedTeams.length > 0) {
          const stillSelected = fetchedTeams.find((t) => t._id === selectedTeam?._id);
          if (!stillSelected) {
            setSelectedTeam(fetchedTeams[0]);
          }
        }
      } catch (err) {
        setError('Error searching teams');
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [search]);

  // Instant 0ms team switching
  const handleSelectTeam = (team) => {
    setSelectedTeam(team);
    setMessage('');
    setError('');
  };

  // Instant 0ms round switching
  const handleRoundChange = (round) => {
    setSelectedRound(round);
    setMessage('');
    setError('');
  };

  const handleIndividualScoreChange = (memberId, value) => {
    const num = value === '' ? '' : Number(value);
    setIndividualScores((prev) => ({ ...prev, [memberId]: num }));
  };

  // Check if active round is locked or system is locked
  const isRoundLocked = Boolean(selectedRound?.isLocked) || Boolean(settings?.isLocked);
  const isIndividualScoringEnabled = settings ? settings.enableIndividualScoring !== false : true;

  // Real-time calculation of entered individual member scores & live average for current round
  const enteredMemberScores = useMemo(() => {
    return Object.values(individualScores)
      .map((v) => (v !== '' && !isNaN(Number(v)) ? Number(v) : null))
      .filter((v) => v !== null);
  }, [individualScores]);

  const liveMemberAvg = useMemo(() => {
    return enteredMemberScores.length > 0
      ? (enteredMemberScores.reduce((acc, curr) => acc + curr, 0) / enteredMemberScores.length).toFixed(1)
      : null;
  }, [enteredMemberScores]);

  // Compute all-rounds statistics and scores for the currently selected team
  // Compute all-rounds statistics and scores for the currently selected team
  const selectedTeamRoundStats = useMemo(() => {
    if (!selectedTeam || !rounds.length) {
      return {
        roundDetails: [],
        sumScores: 0,
        maxPossibleScore: 0,
        avgOutOf100: null,
        avgRounds50: null,
        scoredCount: 0,
        totalRounds: rounds.length,
      };
    }

    const roundDetails = rounds.map((r) => {
      const isCurrentEditing = selectedRound && selectedRound._id === r._id;
      let scoreVal = null;

      if (isCurrentEditing && competitionScore !== '') {
        const num = Number(competitionScore);
        if (!isNaN(num) && num >= 1 && num <= 50) {
          scoreVal = num;
        }
      } else {
        const doc = allScores[`${r._id}_${selectedTeam._id}`];
        if (doc && doc.teamScore !== undefined && doc.teamScore !== null) {
          scoreVal = Number(doc.teamScore);
        }
      }

      return {
        roundId: r._id,
        name: r.name,
        weight: r.weight || 1,
        score: scoreVal,
        isCurrent: isCurrentEditing,
      };
    });

    const scoredRounds = roundDetails.filter((r) => r.score !== null);
    const sumScores = scoredRounds.reduce((acc, r) => acc + r.score, 0);
    const maxPossibleScore = scoredRounds.length * 50; // Each round is out of 50

    // Average normalized out of 100 (e.g. 45/50 + 45/50 = 90 / 100)
    const avgOutOf100 =
      maxPossibleScore > 0 ? ((sumScores / maxPossibleScore) * 100).toFixed(1) : null;
    const avgRounds50 =
      scoredRounds.length > 0 ? (sumScores / scoredRounds.length).toFixed(1) : null;

    return {
      roundDetails,
      sumScores,
      maxPossibleScore,
      avgOutOf100,
      avgRounds50,
      scoredCount: scoredRounds.length,
      totalRounds: rounds.length,
    };
  }, [selectedTeam, selectedRound, rounds, allScores, competitionScore]);

  // Helper to compute all-round average for any team in the list
  const getTeamRoundsSummary = (teamId) => {
    if (!rounds.length) return { avg100: null, totalScore: 0, maxScore: 0, currentScore: null };

    let total = 0;
    let count = 0;
    let currentScore = null;

    rounds.forEach((r) => {
      const isCurrent =
        selectedRound && selectedRound._id === r._id && selectedTeam && selectedTeam._id === teamId;
      let s = null;

      if (isCurrent && competitionScore !== '') {
        const num = Number(competitionScore);
        if (!isNaN(num) && num >= 1 && num <= 50) s = num;
      } else {
        const doc = allScores[`${r._id}_${teamId}`];
        if (doc && doc.teamScore !== undefined && doc.teamScore !== null) {
          s = Number(doc.teamScore);
        }
      }

      if (selectedRound && selectedRound._id === r._id) {
        currentScore = s;
      }

      if (s !== null) {
        total += s;
        count++;
      }
    });

    const maxScore = count * 50;
    const avg100 = maxScore > 0 ? ((total / maxScore) * 100).toFixed(1) : null;

    return {
      totalScore: total,
      maxScore,
      avg100,
      currentScore,
      scoredRoundsCount: count,
    };
  };

  // Save evaluation scores
  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedRound || !selectedTeam) return;

    if (isRoundLocked) {
      setError(`Round '${selectedRound.name}' is currently locked. Score submission is disabled.`);
      return;
    }

    setMessage('');
    setError('');

    // Team Score Validation: 1 - 50
    const compScoreNum = Number(competitionScore);
    if (isNaN(compScoreNum) || compScoreNum < 1 || compScoreNum > 50) {
      setError('Team Competition Score is required and must be a number between 1 and 50');
      return;
    }

    // Individual Score Validation (1 - 100) only if enabled
    let payloadIndScores = [];
    if (isIndividualScoringEnabled) {
      let hasIndError = false;
      payloadIndScores = Object.entries(individualScores).map(([memberId, score]) => {
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
    }

    setSaving(true);
    try {
      const res = await evalService.saveRoundScores(selectedRound._id, selectedTeam._id, {
        competitionScore: compScoreNum,
        comments,
        individualScores: payloadIndScores,
      });

      // Update in-memory allScores dictionary immediately
      const nowISO = new Date().toISOString();
      const updatedScoreDoc = res.scoreDoc || {
        roundId: selectedRound._id,
        teamId: selectedTeam._id,
        teamScore: compScoreNum,
        comments,
        individualScores: payloadIndScores,
        updatedAt: nowISO,
      };
      if (!updatedScoreDoc.updatedAt) updatedScoreDoc.updatedAt = nowISO;

      setAllScores((prev) => ({
        ...prev,
        [`${selectedRound._id}_${selectedTeam._id}`]: updatedScoreDoc,
      }));

      setMessage(`Evaluation saved successfully for Team ${selectedTeam.teamNumber} in ${selectedRound.name} at ${formatISTWithSuffix(nowISO)}!`);
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
        await loadFullData(editingRound._id);
      } else {
        const newRound = await roundService.createRound(roundFormData);
        await loadFullData(newRound._id);
      }
      setShowRoundModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving evaluation round');
    }
  };

  const handleDeleteRound = async (r, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete '${r.name}' and all associated scores?`)) {
      try {
        await roundService.deleteRound(r._id);
        const remainingRounds = rounds.filter((x) => x._id !== r._id);
        if (selectedRound && selectedRound._id === r._id) {
          setSelectedRound(remainingRounds[0] || null);
        }
        await loadFullData();
      } catch (err) {
        setError('Error deleting evaluation round');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner with Add Round Button */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckSquare size={24} color="var(--spidey-red)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Dynamic Round Evaluation Module</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Select an evaluation round or create/edit custom rounds. Team scores are strictly 1-50; Individual scores are 1-100.
          </p>
        </div>

        <button
          onClick={handleOpenAddRound}
          className="btn btn-cyan btn-sm"
          style={{ padding: '0.5rem 1.25rem' }}
        >
          <Plus size={16} /> Create Custom Round
        </button>
      </div>

      {/* If No Rounds Exist Yet: Show Empty State */}
      {rounds.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              backgroundColor: 'rgba(0, 240, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--spidey-cyan)',
              border: '1px solid rgba(0, 240, 255, 0.25)',
            }}
          >
            <Layers size={30} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            No Evaluation Rounds Yet
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: '1.5' }}>
            You haven't created any evaluation rounds for this workspace yet. Create your first round (e.g. Round 1 - Pitch, Round 2 - Prototype) to start scoring teams!
          </p>
          <button
            onClick={handleOpenAddRound}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.75rem', marginTop: '0.5rem' }}
          >
            <Plus size={18} /> Create Your First Round
          </button>
        </div>
      ) : (
        <>
          {/* Rounds Horizontal Switcher Tabs & Team Panel Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', flex: 1 }}>
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
                      padding: '0.65rem 1.15rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'rgba(229, 9, 20, 0.2)' : 'var(--bg-card)',
                      border: isSelected ? '2px solid var(--spidey-red)' : '1px solid var(--border-color)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: isSelected ? '700' : '500',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 15px rgba(229, 9, 20, 0.3)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Layers size={17} color={isSelected ? 'var(--spidey-cyan)' : 'var(--text-muted)'} />
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

            {/* Toggle Slide Bar Button */}
            <button
              type="button"
              onClick={() => setIsTeamDrawerOpen(!isTeamDrawerOpen)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', marginBottom: '0.5rem' }}
              title={isTeamDrawerOpen ? 'Collapse Teams Panel' : 'Expand Teams Panel'}
            >
              {isTeamDrawerOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
              <span>{isTeamDrawerOpen ? 'Hide Teams' : `Show Teams (${teams.length})`}</span>
            </button>
          </div>

      {/* Main Grid: Direct Team Search/Selector + Score Form */}
      <div style={{ display: 'grid', gridTemplateColumns: isTeamDrawerOpen ? '260px 1fr' : '1fr', gap: '1.25rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        {/* Left Column: Direct Team Selector (Collapsible) */}
        {isTeamDrawerOpen && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'fit-content', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--spidey-cyan)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <List size={15} /> Teams ({teams.length})
              </h4>
              <button
                onClick={() => setIsTeamDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                title="Collapse Teams Panel"
              >
                <PanelLeftClose size={15} />
              </button>
            </div>

            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search Team # or Name..."
            />

            <div
              className="custom-scrollbar"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                maxHeight: '480px',
                overflowY: 'auto',
                paddingRight: '0.3rem',
              }}
            >
              {teams.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem' }}>
                  No teams found.
                </p>
              ) : (
                teams.map((t) => {
                  const isSelected = selectedTeam && selectedTeam._id === t._id;
                  const summary = getTeamRoundsSummary(t._id);

                  return (
                    <button
                      key={t._id}
                      onClick={() => handleSelectTeam(t)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="team-badge" style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}>
                            {t.teamNumber}
                          </span>
                          {summary.scoredRoundsCount > 0 ? (
                            <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '0.12rem 0.4rem' }}>
                              Avg: {summary.avg100}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              Pending
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', marginTop: '0.2rem' }}>
                          {t.teamName}
                        </div>
                      </div>
                      <ChevronRight size={14} color={isSelected ? 'var(--spidey-cyan)' : 'var(--text-muted)'} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right Column: Dynamic Score Form */}
        <div>
          {!selectedTeam || !selectedRound ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Select a round and team from the list to conduct evaluation.
            </div>
          ) : (
            <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Selected Team & Active Round Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="team-badge" style={{ fontSize: '1.1rem', padding: '0.4rem 0.9rem' }}>
                    {selectedTeam.teamNumber}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>{selectedTeam.teamName}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Dept: {selectedTeam.department}
                      </span>
                      {allScores[`${selectedRound._id}_${selectedTeam._id}`]?.updatedAt ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--spidey-cyan)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={13} /> Last Evaluated: <strong>{formatISTWithSuffix(allScores[`${selectedRound._id}_${selectedTeam._id}`].updatedAt)}</strong>
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={13} /> Pending Evaluation for {selectedRound.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {!isTeamDrawerOpen && (
                    <button
                      type="button"
                      onClick={() => setIsTeamDrawerOpen(true)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: '0.35rem' }}
                      title="Open Teams Panel"
                    >
                      <PanelLeftOpen size={14} /> Teams ({teams.length})
                    </button>
                  )}
                  <div className="badge badge-info" style={{ fontSize: '0.88rem', padding: '0.35rem 0.8rem' }}>
                    Evaluating: {selectedRound.name}
                  </div>
                  {isRoundLocked ? (
                    <span className="badge badge-danger" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem' }}>
                      <Lock size={14} /> Round Locked
                    </span>
                  ) : (
                    <span className="badge badge-success" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem' }}>
                      <Unlock size={14} /> Round Active
                    </span>
                  )}
                </div>
              </div>

              {/* Status Notifications */}
              {isRoundLocked && (
                <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Lock size={18} />
                  <span>
                    <strong>Round Locked:</strong> Score evaluations for '{selectedRound.name}' are locked. You can unlock this round in <strong>System Settings</strong>.
                  </span>
                </div>
              )}

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

              {/* Section 1: Team Competition Score (1 - 50) */}
              <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      Team Competition Score *
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Overall team score for {selectedRound.name} (Strict range: 1 to 50).
                    </p>
                  </div>
                  <span className="badge badge-danger">Strict Range: 1 - 50</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '1rem', alignItems: 'start' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Team Score (1 - 50) *</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      step="0.5"
                      disabled={isRoundLocked}
                      className="form-input font-mono"
                      style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--spidey-cyan)', textAlign: 'center' }}
                      value={competitionScore}
                      onChange={(e) => setCompetitionScore(e.target.value)}
                      placeholder="Score (1-50)"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Evaluator Comments</label>
                    <input
                      type="text"
                      disabled={isRoundLocked}
                      className="form-input"
                      placeholder={`Optional feedback for ${selectedRound.name}...`}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Individual Member Scores (1 - 100) */}
              {!isIndividualScoringEnabled ? (
                <div style={{ backgroundColor: 'var(--bg-input)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                  <UserX size={20} color="var(--spidey-gold)" />
                  <div>
                    <h5 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '700' }}>
                      Individual Member Scoring is Disabled
                    </h5>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      Only overall Team Competition Score (1–50) is being recorded. You can enable individual member scoring from System Settings anytime.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--spidey-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={18} /> Member Individual Evaluation (1 - 100)
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="badge badge-info">Range: 1 - 100</span>
                      {liveMemberAvg && (
                        <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calculator size={13} /> Live Member Avg: <strong>{liveMemberAvg} / 100</strong>
                        </span>
                      )}
                    </div>
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
                            disabled={isRoundLocked}
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
              )}

              {/* Save Action Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Info size={14} /> Manual Save required.
                </span>

                <button
                  type="submit"
                  className={`btn ${isRoundLocked ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ padding: '0.75rem 2.5rem' }}
                  disabled={saving || isRoundLocked}
                >
                  {isRoundLocked ? <Lock size={18} /> : <Save size={18} />}
                  <span>
                    {isRoundLocked
                      ? 'Round is Locked'
                      : saving
                      ? 'Saving Scores...'
                      : `Save ${selectedRound.name} Scores`}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )}

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
