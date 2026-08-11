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
  QrCode,
  Percent,
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
        Loading ORVIXFLOW Dashboard statistics...
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

  const attStats = stats.attendanceStats || {
    presentCount: 0,
    absentCount: 0,
    notMarkedCount: stats.totalParticipants || 0,
    attendanceRate: 0,
    sessionName: 'Event Check-in',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
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
          icon={Users}
          color="var(--spidey-cyan)"
        />

        <StatCard
          title={`Attendance (${attStats.sessionName || 'Check-in'})`}
          value={`${attStats.presentCount} / ${stats.totalParticipants}`}
          subtitle={`${attStats.attendanceRate}% Present (${attStats.absentCount} A • ${attStats.notMarkedCount} NM)`}
          icon={UserCheck}
          color="#10b981"
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

      {/* Progress Bars Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Attendance Progress Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <QrCode size={18} color="var(--spidey-cyan)" /> Attendance Rate ({attStats.sessionName})
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {attStats.presentCount} Present &bull; {attStats.absentCount} Absent &bull; {attStats.notMarkedCount} Not Marked
              </p>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981' }}>
              {attStats.attendanceRate}%
            </span>
          </div>

          <div className="progress-container">
            <div className="progress-fill" style={{ width: `${attStats.attendanceRate}%`, background: 'linear-gradient(90deg, #10b981, var(--spidey-cyan))' }}></div>
          </div>
        </div>

        {/* Evaluation Progress Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckSquare size={18} color="var(--spidey-red)" /> Overall Evaluation Progress
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {stats.completedEvaluations} of {stats.totalTeams} teams fully evaluated across active rounds
              </p>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--spidey-cyan)' }}>
              {stats.progressPercentage}%
            </span>
          </div>

          <div className="progress-container">
            <div className="progress-fill" style={{ width: `${stats.progressPercentage}%` }}></div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <Link to="/attendance" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ transition: 'all 0.2s', cursor: 'pointer', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '10px', backgroundColor: 'rgba(0, 240, 255, 0.15)', color: 'var(--spidey-cyan)' }}>
                <QrCode size={22} />
              </div>
              <ArrowRight size={18} color="var(--spidey-cyan)" />
            </div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.2rem', fontWeight: '700' }}>Scan ID Attendance</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Continuous ID card barcode/QR scanner with duplicate validation and session logs.
            </p>
          </div>
        </Link>

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
              Evaluate teams (1-50) and members (1-100). Create, edit & manage evaluation rounds.
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
