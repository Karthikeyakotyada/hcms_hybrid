import React, { useEffect, useState } from 'react';
import { resultsService } from '../services/resultsService';
import ExportMenu from '../components/ExportMenu';
import confetti from 'canvas-confetti';
import { Trophy, Award, Crown, Medal, Users } from 'lucide-react';

const WinnersPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        setLoading(true);
        const res = await resultsService.getWinners();
        setData(res);

        // Fire festive celebratory confetti if winners exist!
        if (res.winners && res.winners.length > 0) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (err) {
        setError('Error fetching winners data');
      } finally {
        setLoading(false);
      }
    };
    fetchWinners();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Computing top hackathon winners...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--accent-danger)' }}>
        {error || 'Failed to load winners'}
      </div>
    );
  }

  const winners = data.winners || [];
  const top1 = winners.find((w) => w.rank === 1);
  const top2 = winners.find((w) => w.rank === 2);
  const top3 = winners.find((w) => w.rank === 3);

  const exportColumns = [
    { header: 'Rank', accessor: (w) => `Rank ${w.rank}` },
    { header: 'Team Number', accessor: (w) => w.teamNumber },
    { header: 'Team Name', accessor: (w) => w.teamName },
    { header: 'Department', accessor: (w) => w.department },
    { header: 'Round 1 Score', accessor: (w) => w.r1Score },
    { header: 'Round 2 Score', accessor: (w) => w.r2Score },
    { header: 'Final Score (R1 * R2)', accessor: (w) => w.finalScore },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Crown size={28} color="#f59e0b" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              Hackathon Winners Showcase
            </h2>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Official Top {data.topCount} Ranked Teams based on Final Score formula (`Round1 * Round2`).
          </p>
        </div>

        <ExportMenu
          filename="hems_winners_showcase"
          title="Hackathon Official Winners"
          columns={exportColumns}
          data={winners}
        />
      </div>

      {/* Visual Podium Showcase */}
      {winners.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
          {/* 2nd Place Card (Silver) */}
          {top2 && (
            <div
              className="card"
              style={{
                border: '1px solid rgba(148, 163, 184, 0.4)',
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
                textAlign: 'center',
                padding: '2rem 1.5rem',
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#94a3b8', color: '#0f172a', fontWeight: '800', fontSize: '0.85rem', padding: '0.3rem 0.8rem', borderRadius: '9999px', boxShadow: '0 4px 10px rgba(148, 163, 184, 0.4)' }}>
                🥈 2nd Place
              </div>

              <span className="team-badge" style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
                {top2.teamNumber}
              </span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0.6rem 0 0.2rem 0' }}>
                {top2.teamName}
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Dept: {top2.department}
              </div>

              <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Final Score (`R1 * R2`)</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>
                  {top2.finalScore}
                </div>
              </div>

              <div style={{ marginTop: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Roster:</strong> {top2.members ? top2.members.map((m) => m.name).join(', ') : ''}
              </div>
            </div>
          )}

          {/* 1st Place Champion Card (Gold - Center & Elevated) */}
          {top1 && (
            <div
              className="card"
              style={{
                border: '2px solid #f59e0b',
                background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, rgba(30, 41, 59, 0.95) 100%)',
                textAlign: 'center',
                padding: '2.5rem 1.5rem',
                position: 'relative',
                boxShadow: '0 10px 25px rgba(245, 158, 11, 0.2)',
                transform: 'scale(1.05)',
              }}
            >
              <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#f59e0b', color: '#0f172a', fontWeight: '800', fontSize: '0.9rem', padding: '0.4rem 1rem', borderRadius: '9999px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.5)' }}>
                🏆 1st Place Champion
              </div>

              <span className="team-badge" style={{ fontSize: '1.1rem', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', borderColor: '#f59e0b', marginTop: '0.5rem' }}>
                {top1.teamNumber}
              </span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ffffff', margin: '0.6rem 0 0.2rem 0' }}>
                {top1.teamName}
              </h3>
              <div style={{ fontSize: '0.85rem', color: '#fbbf24', marginBottom: '1rem', fontWeight: '600' }}>
                Dept: {top1.department}
              </div>

              <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Final Champion Score (`R1 * R2`)</div>
                <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fbbf24', fontFamily: 'JetBrains Mono' }}>
                  {top1.finalScore}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  (R1: {top1.r1Score} &bull; R2: {top1.r2Score})
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', textAlign: 'left', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: '#ffffff' }}>Winning Team Roster:</strong>
                <div style={{ marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {top1.members && top1.members.map((m) => (
                    <span key={m.memberId}>&bull; {m.name} ({m.registerNumber})</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place Card (Bronze) */}
          {top3 && (
            <div
              className="card"
              style={{
                border: '1px solid rgba(249, 115, 22, 0.4)',
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
                textAlign: 'center',
                padding: '2rem 1.5rem',
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#f97316', color: '#ffffff', fontWeight: '800', fontSize: '0.85rem', padding: '0.3rem 0.8rem', borderRadius: '9999px', boxShadow: '0 4px 10px rgba(249, 115, 22, 0.4)' }}>
                🥉 3rd Place
              </div>

              <span className="team-badge" style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
                {top3.teamNumber}
              </span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0.6rem 0 0.2rem 0' }}>
                {top3.teamName}
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Dept: {top3.department}
              </div>

              <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Final Score (`R1 * R2`)</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f97316', fontFamily: 'JetBrains Mono' }}>
                  {top3.finalScore}
                </div>
              </div>

              <div style={{ marginTop: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Roster:</strong> {top3.members ? top3.members.map((m) => m.name).join(', ') : ''}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No winners determined yet. Conduct Round 1 and Round 2 evaluations to generate rankings.
        </div>
      )}

      {/* Detailed Winners Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Official Winners Ranking Table
        </h3>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team #</th>
                <th>Team Name</th>
                <th>Department</th>
                <th>Round 1 Score</th>
                <th>Round 2 Score</th>
                <th>Final Score (`R1 * R2`)</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((w) => (
                <tr key={w._id}>
                  <td style={{ fontWeight: '700' }}>
                    {w.rank === 1 ? '🥇 Rank 1' : w.rank === 2 ? '🥈 Rank 2' : w.rank === 3 ? '🥉 Rank 3' : `Rank ${w.rank}`}
                  </td>
                  <td>
                    <span className="team-badge">{w.teamNumber}</span>
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{w.teamName}</td>
                  <td>{w.department}</td>
                  <td style={{ fontFamily: 'JetBrains Mono' }}>{w.r1Score} / 10</td>
                  <td style={{ fontFamily: 'JetBrains Mono' }}>{w.r2Score} / 10</td>
                  <td>
                    <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                      {w.finalScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WinnersPage;
