import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { resultsService } from '../services/resultsService';
import {
  Users,
  UserCheck,
  Layers,
  CheckCircle,
  Clock,
  ArrowRight,
  CheckSquare,
  Trophy,
} from 'lucide-react';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await resultsService.getDashboardStats();
      setStats(data);
      setError('');
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('Could not connect to backend server. Make sure server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--spidey-cyan)', fontWeight: '700' }}>
        Loading Spidey Dashboard statistics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderLeft: '4px solid var(--accent-danger)' }}>
        <h3 style={{ color: 'var(--accent-danger)' }}>Error Loading Dashboard</h3>
        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{error}</p>
        <button onClick={fetchStats} className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          title="Total Teams"
          value={stats.totalTeams}
          subtitle="Registered hackathon teams"
          icon={Users}
          color="var(--spidey-red)"
        />

        <StatCard
          title="Total Participants"
          value={stats.totalParticipants}
          subtitle="Across all registered teams"
          icon={UserCheck}
          color="var(--spidey-cyan)"
        />

        <StatCard
          title="Active Rounds"
          value={stats.activeRoundsCount}
          subtitle={stats.isLocked ? 'System is LOCKED' : 'Evaluation is ACTIVE'}
          icon={Layers}
          color={stats.isLocked ? '#ef4444' : '#10b981'}
        />

        <StatCard
          title="Fully Evaluated Teams"
          value={stats.completedEvaluations}
          subtitle={`Out of ${stats.totalTeams} teams`}
          icon={CheckCircle}
          color="#10b981"
        />

        <StatCard
          title="Pending Teams"
          value={stats.pendingEvaluations}
          subtitle="Teams awaiting complete evaluation"
          icon={Clock}
          color="var(--spidey-gold)"
        />
      </div>

      {/* Progress Bar Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              Overall Evaluation Progress
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {stats.completedEvaluations} of {stats.totalTeams} teams fully evaluated across active rounds
            </p>
          </div>
          <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--spidey-cyan)' }}>
            {stats.progressPercentage}%
          </span>
        </div>

        <div className="progress-container">
          <div className="progress-fill" style={{ width: `${stats.progressPercentage}%` }}></div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <Link to="/teams" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ transition: 'all 0.2s', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '10px', backgroundColor: 'rgba(229, 9, 20, 0.15)', color: 'var(--spidey-red)' }}>
                <Users size={22} />
              </div>
              <ArrowRight size={18} color="var(--spidey-cyan)" />
            </div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.2rem', fontWeight: '700' }}>Manage Teams & Rosters</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Add, search, edit, or import hackathon teams and member details.
            </p>
          </div>
        </Link>

        <Link to="/evaluation" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ transition: 'all 0.2s', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '10px', backgroundColor: 'rgba(0, 240, 255, 0.15)', color: 'var(--spidey-cyan)' }}>
                <CheckSquare size={22} />
              </div>
              <ArrowRight size={18} color="var(--spidey-cyan)" />
            </div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.2rem', fontWeight: '700' }}>
              Evaluation & Rounds Module
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Evaluate teams (1-10) and members (1-100). Create, edit & manage evaluation rounds.
            </p>
          </div>
        </Link>

        <Link to="/results" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ transition: 'all 0.2s', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--spidey-gold)' }}>
                <Trophy size={22} />
              </div>
              <ArrowRight size={18} color="var(--spidey-cyan)" />
            </div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.2rem', fontWeight: '700' }}>Leaderboard & Exports</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              View overall team rankings computed across all active rounds & export reports.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
