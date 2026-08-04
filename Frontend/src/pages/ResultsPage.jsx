import React, { useEffect, useState } from 'react';
import { resultsService } from '../services/resultsService';
import SearchBar from '../components/SearchBar';
import ExportMenu from '../components/ExportMenu';
import { Trophy, Award, Users, ArrowUpDown } from 'lucide-react';

const ResultsPage = () => {
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState('competition'); // 'competition' | 'individual'
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);

  // Sorting state
  const [sortField, setSortField] = useState('rank'); // 'rank' | 'teamNumber' | 'finalScore' | 'r1Score' | 'r2Score'
  const [sortAsc, setSortAsc] = useState(true);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const data = await resultsService.getResults(search, department);
      setResults(data);
    } catch (err) {
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [search, department]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'teamNumber' || field === 'rank');
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA === null || valA === '-') valA = -999;
    if (valB === null || valB === '-') valB = -999;

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Flattened member rows for Individual Results view
  const individualMemberRows = [];
  results.forEach((team) => {
    if (team.members) {
      team.members.forEach((m) => {
        individualMemberRows.push({
          teamNumber: team.teamNumber,
          teamName: team.teamName,
          memberName: m.name,
          registerNumber: m.registerNumber,
          department: m.department,
          r1Score: m.r1Score !== null ? m.r1Score : '-',
          r2Score: m.r2Score !== null ? m.r2Score : '-',
        });
      });
    }
  });

  // Export Columns for Competition Results
  const compExportColumns = [
    { header: 'Rank', accessor: (r) => r.rank },
    { header: 'Team Number', accessor: (r) => r.teamNumber },
    { header: 'Team Name', accessor: (r) => r.teamName },
    { header: 'Department', accessor: (r) => r.department },
    { header: 'Round 1 Score (1-10)', accessor: (r) => r.r1Score ?? '-' },
    { header: 'Round 2 Score (1-10)', accessor: (r) => r.r2Score ?? '-' },
    { header: 'Final Score (R1 * R2)', accessor: (r) => r.finalScore ?? '-' },
  ];

  // Export Columns for Individual Results
  const indExportColumns = [
    { header: 'Team Number', accessor: (r) => r.teamNumber },
    { header: 'Team Name', accessor: (r) => r.teamName },
    { header: 'Member Name', accessor: (r) => r.memberName },
    { header: 'Register Number', accessor: (r) => r.registerNumber },
    { header: 'Department', accessor: (r) => r.department },
    { header: 'Round 1 Score', accessor: (r) => r.r1Score },
    { header: 'Round 2 Score', accessor: (r) => r.r2Score },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Tabs Switcher */}
        <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('competition')}
            className="btn"
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.9rem',
              backgroundColor: activeTab === 'competition' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'competition' ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            <Trophy size={16} /> Competition Results & Formula (`R1 * R2`)
          </button>

          <button
            onClick={() => setActiveTab('individual')}
            className="btn"
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.9rem',
              backgroundColor: activeTab === 'individual' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'individual' ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            <Users size={16} /> Individual Member Scores
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by Team #, Name, Member..."
          />

          <ExportMenu
            filename={activeTab === 'competition' ? 'hems_competition_results' : 'hems_individual_scores'}
            title={activeTab === 'competition' ? 'HEMS Competition Results Leaderboard' : 'HEMS Individual Member Scores'}
            columns={activeTab === 'competition' ? compExportColumns : indExportColumns}
            data={activeTab === 'competition' ? sortedResults : individualMemberRows}
          />
        </div>
      </div>

      {/* Main Content View */}
      {activeTab === 'competition' ? (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('rank')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Rank <ArrowUpDown size={14} />
                  </div>
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('teamNumber')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Team # <ArrowUpDown size={14} />
                  </div>
                </th>
                <th>Team Name</th>
                <th>Department</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('r1Score')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Round 1 (1-10) <ArrowUpDown size={14} />
                  </div>
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('r2Score')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Round 2 (1-10) <ArrowUpDown size={14} />
                  </div>
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('finalScore')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Final Score (`R1 * R2`) <ArrowUpDown size={14} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Calculating competition rankings...
                  </td>
                </tr>
              ) : sortedResults.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No evaluated teams found.
                  </td>
                </tr>
              ) : (
                sortedResults.map((row) => (
                  <tr key={row._id} style={{ backgroundColor: row.rank === 1 ? 'rgba(245, 158, 11, 0.05)' : 'transparent' }}>
                    <td>
                      {row.rank === 1 ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                          🥇 1st Rank
                        </span>
                      ) : row.rank === 2 ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.4)' }}>
                          🥈 2nd Rank
                        </span>
                      ) : row.rank === 3 ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(180, 83, 9, 0.2)', color: '#f97316', border: '1px solid rgba(180, 83, 9, 0.4)' }}>
                          🥉 3rd Rank
                        </span>
                      ) : (
                        <span style={{ fontWeight: '600', color: 'var(--text-muted)', paddingLeft: '0.5rem' }}>
                          #{row.rank}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="team-badge">{row.teamNumber}</span>
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{row.teamName}</td>
                    <td>{row.department}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontWeight: '600', color: row.r1Score ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {row.r1Score !== null ? `${row.r1Score} / 10` : '-'}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontWeight: '600', color: row.r2Score ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {row.r2Score !== null ? `${row.r2Score} / 10` : '-'}
                    </td>
                    <td>
                      {row.finalScore !== null ? (
                        <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                          {row.finalScore}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pending R2</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Team #</th>
                <th>Team Name</th>
                <th>Member Name</th>
                <th>Register #</th>
                <th>Department</th>
                <th>Round 1 Ind. Score</th>
                <th>Round 2 Ind. Score</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Loading member individual records...
                  </td>
                </tr>
              ) : individualMemberRows.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No member records found.
                  </td>
                </tr>
              ) : (
                individualMemberRows.map((r, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="team-badge">{r.teamNumber}</span>
                    </td>
                    <td style={{ fontWeight: '500' }}>{r.teamName}</td>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{r.memberName}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)' }}>{r.registerNumber}</td>
                    <td>{r.department}</td>
                    <td style={{ fontFamily: 'JetBrains Mono' }}>{r.r1Score}</td>
                    <td style={{ fontFamily: 'JetBrains Mono' }}>{r.r2Score}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
