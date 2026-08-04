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
  Activity,
  CheckSquare,
  Award,
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
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading dashboard statistics...
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
          color="#6366f1"
        />

        <StatCard
          title="Total Participants"
          value={stats.totalParticipants}
          subtitle="Across all registered teams"
          icon={UserCheck}
          color="#06b6d4"
        />

        <StatCard
          title="Current Phase"
          value={stats.currentRound}
          subtitle={stats.isLocked ? 'Evaluation is LOCKED' : 'Evaluation is OPEN'}
          icon={Layers}
          color={stats.isLocked ? '#ef4444' : '#10b981'}
        />

        <StatCard
          title="Completed Evaluations"
          value={stats.completedEvaluations}
          subtitle={`Out of ${stats.totalTeams} teams`}
          icon={CheckCircle}
          color="#10b981"
        />

        <StatCard
          title="Pending Evaluations"
          value={stats.pendingEvaluations}
          subtitle="Teams awaiting score"
          icon={Clock}
          color="#f59e0b"
        />
      </div>

      {/* Progress Bar Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Evaluation Completion Progress ({stats.currentRound})
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {stats.completedEvaluations} of {stats.totalTeams} teams evaluated
            </p>
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
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
          <div className="card" style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                <Users size={22} />
              </div>
              <ArrowRight size={18} color="var(--text-muted)" />
            </div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Manage Teams</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Add, search, edit, or import hackathon teams and 4-member rosters.
            </p>
          </div>
        </Link>

        <Link to={stats.currentRound === 'Round 2' ? '/round2' : '/round1'} style={{ textDecoration: 'none' }}>
          <div className="card" style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                {stats.currentRound === 'Round 2' ? <Award size={22} /> : <CheckSquare size={22} />}
              </div>
              <ArrowRight size={18} color="var(--text-muted)" />
            </div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              Enter {stats.currentRound} Scores
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Directly evaluate competition scores (1-10) and individual member scores.
            </p>
          </div>
        </Link>

        <Link to="/results" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                <Trophy size={22} />
              </div>
              <ArrowRight size={18} color="var(--text-muted)" />
            </div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Leaderboard & Exports</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              View live calculated rankings (`R1 * R2`) and export CSV/Excel/PDF reports.
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Activity Log Section */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Activity size={20} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            Recent Activity Log
          </h3>
        </div>

        {stats.recentActivities && stats.recentActivities.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.recentActivities.map((act) => (
              <div
                key={act._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="badge badge-info">{act.action}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{act.details}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                  <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No recent activity recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
