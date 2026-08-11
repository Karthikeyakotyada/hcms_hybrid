import React, { useEffect, useState } from 'react';
import { resultsService } from '../services/resultsService';
import { settingsService } from '../services/settingsService';
import SearchBar from '../components/SearchBar';
import ExportMenu from '../components/ExportMenu';
import { Trophy, Users, ArrowUpDown, UserX, Clock } from 'lucide-react';
import { formatIST, formatISTWithSuffix } from '../utils/dateUtils';

const ResultsPage = () => {
  const [results, setResults] = useState([]);
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('competition'); // 'competition' | 'individual'
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);

  // Sorting state
  const [sortField, setSortField] = useState('rank');
  const [sortAsc, setSortAsc] = useState(true);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const [data, setRes] = await Promise.all([
        resultsService.getResults(search, department),
        settingsService.getSettings().catch(() => null),
      ]);
      setResults(data);
      if (setRes) setSettings(setRes);
    } catch (err) {
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchResults();
    }, 200);

    return () => clearTimeout(handler);
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

  // Extract unique active round names from results for table columns
  const roundColumns = [];
  if (results.length > 0 && results[0].roundScores) {
    results[0].roundScores.forEach((r) => roundColumns.push(r.roundName));
  }

  // Flattened member rows for Individual Results view
  const individualMemberRows = [];
  results.forEach((team) => {
    if (team.members) {
      team.members.forEach((m) => {
        const row = {
          teamNumber: team.teamNumber,
          teamName: team.teamName,
          memberName: m.name,
          registerNumber: m.registerNumber,
          department: m.department,
          avgScore: m.avgScore,
          lastEvaluatedAt: m.lastEvaluatedAt || team.lastEvaluatedAt,
        };
        if (m.roundScores) {
          m.roundScores.forEach((rs) => {
            row[rs.roundName] = rs.score !== null ? rs.score : '-';
          });
        }
        individualMemberRows.push(row);
      });
    }
  });

  // Export Columns for Competition Results with IST Timestamps
  const compExportColumns = [
    { header: 'Rank', accessor: (r) => r.rank },
    { header: 'Team Number', accessor: (r) => r.teamNumber },
    { header: 'Team Name', accessor: (r) => r.teamName },
    { header: 'Department', accessor: (r) => r.department },
    ...roundColumns.map((rName, idx) => ({
      header: `${rName} Score`,
      accessor: (r) => (r.roundScores && r.roundScores[idx] ? r.roundScores[idx].score ?? '-' : '-'),
    })),
    ...roundColumns.map((rName, idx) => ({
      header: `${rName} Evaluated At (IST)`,
      accessor: (r) => (r.roundScores && r.roundScores[idx]?.updatedAt ? formatISTWithSuffix(r.roundScores[idx].updatedAt) : '-'),
    })),
    { header: 'Final Weighted Score', accessor: (r) => r.finalScore ?? '-' },
    { header: 'Attendance', accessor: (r) => (r.attendanceSummary ? `${r.attendanceSummary.present}/${r.attendanceSummary.total}` : '-') },
    { header: 'Last Evaluated At (IST)', accessor: (r) => (r.lastEvaluatedAt ? formatISTWithSuffix(r.lastEvaluatedAt) : '-') },
  ];

  // Export Columns for Individual Results with IST Timestamps
  const indExportColumns = [
    { header: 'Team Number', accessor: (r) => r.teamNumber },
    { header: 'Team Name', accessor: (r) => r.teamName },
    { header: 'Member Name', accessor: (r) => r.memberName },
    { header: 'Register Number', accessor: (r) => r.registerNumber },
    { header: 'Department', accessor: (r) => r.department },
    ...roundColumns.map((rName) => ({
      header: `${rName} Score`,
      accessor: (r) => r[rName] ?? '-',
    })),
    { header: 'Average Score', accessor: (r) => r.avgScore ?? '-' },
    { header: 'Last Evaluated At (IST)', accessor: (r) => (r.lastEvaluatedAt ? formatISTWithSuffix(r.lastEvaluatedAt) : '-') },
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
              backgroundColor: activeTab === 'competition' ? 'var(--spidey-red)' : 'transparent',
              color: activeTab === 'competition' ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            <Trophy size={16} /> Leaderboard Rankings
          </button>

          <button
            onClick={() => setActiveTab('individual')}
            className="btn"
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.9rem',
              backgroundColor: activeTab === 'individual' ? 'var(--spidey-red)' : 'transparent',
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
            placeholder="Search Team #, Name, Member..."
          />

          <ExportMenu
            filename={activeTab === 'competition' ? 'hems_competition_results' : 'hems_individual_scores'}
            title={activeTab === 'competition' ? 'HEMS Leaderboard Results' : 'HEMS Individual Member Scores'}
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
                {roundColumns.map((rName, idx) => (
                  <th key={idx}>{rName} (1-50)</th>
                ))}
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('finalScore')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Final Score <ArrowUpDown size={14} />
                  </div>
                </th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6 + roundColumns.length} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--spidey-cyan)', fontWeight: '700' }}>
                    Calculating competition rankings...
                  </td>
                </tr>
              ) : sortedResults.length === 0 ? (
                <tr>
                  <td colSpan={6 + roundColumns.length} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No evaluated teams found.
                  </td>
                </tr>
              ) : (
                sortedResults.map((row) => (
                  <tr key={row._id} style={{ backgroundColor: row.rank === 1 ? 'rgba(229, 9, 20, 0.08)' : 'transparent' }}>
                    <td>
                      {row.rank === 1 ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.5)' }}>
                          🥇 1st Rank
                        </span>
                      ) : row.rank === 2 ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(0, 240, 255, 0.2)', color: 'var(--spidey-cyan)', border: '1px solid rgba(0, 240, 255, 0.4)' }}>
                          🥈 2nd Rank
                        </span>
                      ) : row.rank === 3 ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ff4d56', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                          🥉 3rd Rank
                        </span>
                      ) : (
                        <span style={{ fontWeight: '700', color: 'var(--text-muted)', paddingLeft: '0.5rem' }}>
                          #{row.rank}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="team-badge">{row.teamNumber}</span>
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{row.teamName}</td>
                    <td>{row.department}</td>
                    {row.roundScores && row.roundScores.map((rs, idx) => (
                      <td key={idx} style={{ fontFamily: 'JetBrains Mono', fontWeight: '600' }}>
                        {rs.score !== null ? `${rs.score} / 10` : '-'}
                      </td>
                    ))}
                    <td>
                      {row.finalScore !== null ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--spidey-red)' }}>
                            {row.finalScore}
                          </span>
                          {row.lastEvaluatedAt && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }} title={`Evaluated at ${formatISTWithSuffix(row.lastEvaluatedAt)}`}>
                              <Clock size={10} /> {formatIST(row.lastEvaluatedAt, { second: undefined })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Incomplete</span>
                      )}
                    </td>
                    <td>
                      {row.attendanceSummary ? (
                        <span
                          className="badge"
                          style={{
                            backgroundColor: row.attendanceSummary.present === row.attendanceSummary.total && row.attendanceSummary.total > 0
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(0, 240, 255, 0.12)',
                            color: row.attendanceSummary.present === row.attendanceSummary.total && row.attendanceSummary.total > 0
                              ? '#34d399'
                              : 'var(--spidey-cyan)',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                          }}
                          title={`${row.attendanceSummary.present} Present, ${row.attendanceSummary.absent} Absent, ${row.attendanceSummary.notMarked} Not Marked`}
                        >
                          {row.attendanceSummary.display}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
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
                {roundColumns.map((rName, idx) => (
                  <th key={idx}>{rName} Ind. Score</th>
                ))}
                <th style={{ color: 'var(--spidey-red)', fontWeight: '800' }}>Average Score</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6 + roundColumns.length} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--spidey-cyan)', fontWeight: '700' }}>
                    Loading member individual records...
                  </td>
                </tr>
              ) : individualMemberRows.length === 0 ? (
                <tr>
                  <td colSpan={6 + roundColumns.length} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
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
                    <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{r.memberName}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)' }}>{r.registerNumber}</td>
                    <td>{r.department}</td>
                    {roundColumns.map((rName, rIdx) => (
                      <td key={rIdx} style={{ fontFamily: 'JetBrains Mono' }}>{r[rName]}</td>
                    ))}
                    <td>
                      {r.avgScore !== null && r.avgScore !== undefined ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="font-mono" style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--spidey-red)' }}>
                            {r.avgScore}
                          </span>
                          {r.lastEvaluatedAt && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }} title={`Evaluated at ${formatISTWithSuffix(r.lastEvaluatedAt)}`}>
                              <Clock size={10} /> {formatIST(r.lastEvaluatedAt, { second: undefined })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                      )}
                    </td>
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
