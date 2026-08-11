import React, { useEffect, useState, useCallback, useRef } from 'react';
import { attendanceService } from '../services/attendanceService';
import StatCard from '../components/StatCard';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import ExportMenu from '../components/ExportMenu';
import AttendanceExportMenu from '../components/AttendanceExportMenu';
import AttendanceScannerModal from '../components/AttendanceScannerModal';
import AttendanceSessionsModal from '../components/AttendanceSessionsModal';
import ParticipantAttendanceModal from '../components/ParticipantAttendanceModal';
import { formatIST, formatISTWithSuffix } from '../utils/dateUtils';
import {
  QrCode,
  UserCheck,
  UserX,
  Users,
  Percent,
  Layers,
  CheckCircle,
  XCircle,
  HelpCircle,
  Filter,
  Check,
  X,
  Clock,
  RotateCcw,
  Eye,
  ChevronDown,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

const STATUS_FILTERS = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Present', value: 'PRESENT' },
  { label: 'Absent', value: 'ABSENT' },
  { label: 'Not Marked', value: 'NOT_MARKED' },
];

const METHOD_FILTERS = [
  { label: 'All Methods', value: 'ALL' },
  { label: 'ID Scan', value: 'SCAN' },
  { label: 'Manual Entry', value: 'MANUAL' },
];

/**
 * Ultra-smooth, Dark-themed Custom Dropdown component
 * Replaces ugly browser native <select> elements with glassmorphism & micro-interactions
 */
const SmoothSelect = ({ value, onChange, options, icon: Icon, placeholder = 'Select...', minWidth = '160px', alignRight = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', zIndex: isOpen ? 60 : 'auto' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: isOpen ? 'rgba(229, 9, 20, 0.14)' : 'var(--bg-input)',
          border: isOpen ? '1px solid var(--spidey-red)' : '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.48rem 0.85rem',
          color: 'var(--text-primary)',
          fontSize: '0.84rem',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '0 0 14px rgba(229, 9, 20, 0.3)' : 'none',
          outline: 'none',
          whiteSpace: 'nowrap',
          minWidth: minWidth,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {Icon && <Icon size={15} style={{ color: 'var(--spidey-cyan)', flexShrink: 0 }} />}
          <span style={{ color: selectedOption ? '#ffffff' : 'var(--text-muted)' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            marginLeft: '0.35rem',
            flexShrink: 0,
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            ...(alignRight ? { right: 0 } : { left: 0 }),
            zIndex: 100,
            minWidth: '100%',
            width: 'max-content',
            backgroundColor: '#0c101c',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '0.4rem',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.9), 0 0 25px rgba(229, 9, 20, 0.25)',
            backdropFilter: 'blur(24px)',
            animation: 'fadeInScale 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.2rem',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                  backgroundColor: isSelected ? 'rgba(229, 9, 20, 0.25)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  marginBottom: '2px',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} style={{ color: 'var(--spidey-cyan)' }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AttendancePage = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [attendanceData, setAttendanceData] = useState({
    rows: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
    stats: { totalParticipants: 0, presentCount: 0, absentCount: 0, notMarkedCount: 0, attendanceRate: 0 },
    session: null,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState(null);

  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', text }

  const showNotification = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch all sessions
  const fetchSessions = async () => {
    try {
      const sessList = await attendanceService.getSessions();
      setSessions(sessList);
      const active = sessList.find((s) => s.isActive) || sessList[0];
      if (active && !selectedSessionId) {
        setSelectedSessionId(active._id);
      }
      return sessList;
    } catch (err) {
      console.error('Failed to load sessions:', err);
      return [];
    }
  };

  // Fetch attendance list & stats
  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getAttendanceList({
        sessionId: selectedSessionId,
        status: statusFilter,
        method: methodFilter,
        search,
        department: departmentFilter,
        page,
        limit: 20,
      });
      setAttendanceData(data);
    } catch (err) {
      console.error('Error loading attendance list:', err);
      showNotification('Failed to load attendance list', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId, statusFilter, methodFilter, search, departmentFilter, page]);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchAttendance();
    }
  }, [selectedSessionId, statusFilter, methodFilter, search, departmentFilter, page, fetchAttendance]);

  const activeSessionObj = sessions.find((s) => s._id === selectedSessionId) || attendanceData.session;

  // Handle manual marking from table
  const handleQuickMark = async (memberId, status) => {
    try {
      await attendanceService.manualMarkAttendance(memberId, selectedSessionId, status);
      showNotification(
        status === 'NOT_MARKED'
          ? 'Reset to Not Marked'
          : `Marked as ${status}`,
        'success'
      );
      fetchAttendance();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error updating attendance', 'error');
    }
  };

  // Session options for SmoothSelect
  const sessionOptions = sessions.map((s) => ({
    label: `${s.name}${s.isActive ? ' (Active Target)' : ''}`,
    value: s._id,
  }));

  // Export Columns configuration
  const exportColumns = [
    { header: 'Registration Number', accessor: (r) => r.registerNumber },
    { header: 'Participant Name', accessor: (r) => r.name },
    { header: 'Team Number', accessor: (r) => (r.team ? r.team.teamNumber : '-') },
    { header: 'Team Name', accessor: (r) => (r.team ? r.team.teamName : '-') },
    { header: 'Department', accessor: (r) => r.department || '-' },
    { header: 'Session', accessor: () => (activeSessionObj ? activeSessionObj.name : 'Event Check-in') },
    { header: 'Status', accessor: (r) => r.status },
    { header: 'Method', accessor: (r) => r.method || '-' },
    { header: 'Scanned Time (IST)', accessor: (r) => (r.scannedAt ? formatISTWithSuffix(r.scannedAt) : '-') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Notifications */}
      {notification && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${notification.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            borderRadius: 'var(--radius-md)',
            color: notification.type === 'success' ? '#34d399' : '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            animation: 'fadeInScale 0.2s ease',
          }}
        >
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {notification.text}
        </div>
      )}

      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--bg-secondary)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
              Attendance Management
            </h2>
            {activeSessionObj && (
              <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                {activeSessionObj.name}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Record participant presence via ID card barcode / QR code scanning and manage sessions.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Custom Smooth Session Switcher Dropdown */}
          <SmoothSelect
            options={sessionOptions}
            value={selectedSessionId}
            onChange={(val) => {
              setSelectedSessionId(val);
              setPage(1);
            }}
            icon={Layers}
            minWidth="175px"
            alignRight={false}
          />

          <button
            onClick={() => setIsSessionsModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.52rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700' }}
            title="Manage or create attendance sessions"
          >
            <Layers size={15} /> Sessions
          </button>

          {/* Dual-Mode Export Menu (Master All-Sessions Matrix & Current Session) */}
          <AttendanceExportMenu
            currentSessionName={activeSessionObj ? activeSessionObj.name : 'Session'}
            currentSessionData={attendanceData.rows}
            currentSessionColumns={exportColumns}
          />

          {/* Main Primary Action: Scan ID Card */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="btn btn-primary"
            style={{
              padding: '0.55rem 1.3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '800',
              boxShadow: '0 0 20px var(--spidey-red-glow)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <QrCode size={18} /> Scan ID Card
          </button>
        </div>
      </div>

      {/* Summary Metric Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          title="Total Participants"
          value={attendanceData.stats.totalParticipants}
          subtitle="Registered across all teams"
          icon={Users}
          color="var(--spidey-cyan)"
        />

        <StatCard
          title="Present"
          value={attendanceData.stats.presentCount}
          subtitle={`Marked present for ${activeSessionObj ? activeSessionObj.name : 'session'}`}
          icon={UserCheck}
          color="#10b981"
        />

        <StatCard
          title="Absent"
          value={attendanceData.stats.absentCount}
          subtitle="Explicitly marked absent"
          icon={UserX}
          color="#ef4444"
        />

        <StatCard
          title="Not Marked"
          value={attendanceData.stats.notMarkedCount}
          subtitle="No attendance record logged"
          icon={HelpCircle}
          color="#64748b"
        />

        <StatCard
          title="Attendance Rate"
          value={`${attendanceData.stats.attendanceRate}%`}
          subtitle={`${attendanceData.stats.presentCount} of ${attendanceData.stats.totalParticipants} participants`}
          icon={Percent}
          color="var(--spidey-gold)"
        />
      </div>

      {/* Filter & Search Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.25rem',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: '1 1 300px', maxWidth: '440px' }}>
            <SearchBar
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search by Reg No, Name, Team #, Team Name..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            {/* Status Filter Buttons (Sleek Modern Pill Selector) */}
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--bg-input)',
                borderRadius: '10px',
                padding: '0.25rem',
                border: '1px solid var(--border-color)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3) inset',
              }}
            >
              {STATUS_FILTERS.map((sf) => {
                const isSelected = statusFilter === sf.value;
                return (
                  <button
                    key={sf.value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(sf.value);
                      setPage(1);
                    }}
                    style={{
                      backgroundColor: isSelected ? 'var(--spidey-red)' : 'transparent',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.82rem',
                      fontWeight: isSelected ? '800' : '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSelected ? '0 0 12px var(--spidey-red-glow)' : 'none',
                    }}
                  >
                    {sf.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Smooth Method Filter Dropdown */}
            <SmoothSelect
              options={METHOD_FILTERS}
              value={methodFilter}
              onChange={(val) => {
                setMethodFilter(val);
                setPage(1);
              }}
              icon={Filter}
              minWidth="145px"
              alignRight={true}
            />

            {/* Department Filter */}
            <input
              type="text"
              className="form-input"
              style={{ width: '160px', padding: '0.48rem 0.85rem', fontSize: '0.84rem' }}
              placeholder="Filter Dept..."
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Attendance Records Table Container */}
      <div className="table-container">
        <table className="custom-table" style={{ width: '100%', minWidth: '980px' }}>
          <thead>
            <tr>
                <th style={{ minWidth: '130px', padding: '0.9rem 1.1rem', textAlign: 'left', whiteSpace: 'nowrap' }}>Reg #</th>
                <th style={{ minWidth: '180px', padding: '0.9rem 1.1rem', textAlign: 'left', whiteSpace: 'nowrap' }}>Participant Name</th>
                <th style={{ minWidth: '110px', padding: '0.9rem 1.1rem', textAlign: 'left', whiteSpace: 'nowrap' }}>Team</th>
                <th style={{ minWidth: '130px', padding: '0.9rem 1.1rem', textAlign: 'left', whiteSpace: 'nowrap' }}>Department</th>
                <th style={{ minWidth: '140px', padding: '0.9rem 1.1rem', textAlign: 'left', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ minWidth: '110px', padding: '0.9rem 1.1rem', textAlign: 'left', whiteSpace: 'nowrap' }}>Method</th>
                <th style={{ minWidth: '130px', padding: '0.9rem 1.1rem', textAlign: 'left', whiteSpace: 'nowrap' }}>Scan Time</th>
                <th style={{ minWidth: '230px', padding: '0.9rem 1.1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--spidey-cyan)', fontWeight: '700' }}>
                    Loading attendance records...
                  </td>
                </tr>
              ) : attendanceData.rows.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    No participants matching current search/filter. Click <strong>Scan ID Card</strong> to record attendance.
                  </td>
                </tr>
              ) : (
                attendanceData.rows.map((row) => (
                  <tr
                    key={row.memberId}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '0.85rem 1.1rem', fontFamily: 'JetBrains Mono', fontWeight: '700', color: 'var(--spidey-cyan)', whiteSpace: 'nowrap' }}>
                      {row.registerNumber}
                    </td>
                    <td style={{ padding: '0.85rem 1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {row.name}
                    </td>
                    <td style={{ padding: '0.85rem 1.1rem', whiteSpace: 'nowrap' }}>
                      {row.team ? (
                        <span className="team-badge" title={row.team.teamName}>
                          T{row.team.teamNumber}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1.1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {row.department}
                    </td>
                    <td style={{ padding: '0.85rem 1.1rem', whiteSpace: 'nowrap' }}>
                      {row.status === 'PRESENT' && (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.65rem' }}>
                          <CheckCircle size={13} /> Present
                        </span>
                      )}
                      {row.status === 'ABSENT' && (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.65rem' }}>
                          <XCircle size={13} /> Absent
                        </span>
                      )}
                      {row.status === 'NOT_MARKED' && (
                        <span className="badge" style={{ backgroundColor: 'rgba(100, 116, 139, 0.2)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.65rem' }}>
                          <HelpCircle size={13} /> Not Marked
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1.1rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {row.method ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(0, 240, 255, 0.1)', color: 'var(--spidey-cyan)', fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
                          {row.method}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1.1rem', fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {row.scannedAt ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} title={`Recorded at ${formatISTWithSuffix(row.scannedAt)}`}>
                          <Clock size={13} style={{ color: 'var(--spidey-cyan)' }} /> {formatIST(row.scannedAt)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1.1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        {/* Mark Present */}
                        <button
                          onClick={() => handleQuickMark(row.memberId, 'PRESENT')}
                          className={`btn btn-sm ${row.status === 'PRESENT' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          title="Mark Present (Manual)"
                        >
                          <Check size={13} /> Present
                        </button>

                        {/* Mark Absent */}
                        <button
                          onClick={() => handleQuickMark(row.memberId, 'ABSENT')}
                          className={`btn btn-sm ${row.status === 'ABSENT' ? 'btn-danger' : 'btn-secondary'}`}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          title="Mark Absent (Manual)"
                        >
                          <X size={13} /> Absent
                        </button>

                        {/* Reset to Not Marked */}
                        {row.status !== 'NOT_MARKED' && (
                          <button
                            onClick={() => handleQuickMark(row.memberId, 'NOT_MARKED')}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem 0.5rem', color: 'var(--text-muted)' }}
                            title="Reset to Not Marked (removes record)"
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}

                        {/* View All Sessions History */}
                        <button
                          onClick={() => setSelectedMemberForHistory(row)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.55rem', color: 'var(--spidey-cyan)' }}
                          title="View Participant Attendance History"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={attendanceData.pagination.page}
        totalPages={attendanceData.pagination.totalPages}
        onPageChange={(newPage) => setPage(newPage)}
        totalItems={attendanceData.pagination.total}
        itemLabel="participants"
      />

      {/* ID Card Barcode/QR Scanner Modal */}
      <AttendanceScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          fetchAttendance();
        }}
        activeSession={activeSessionObj}
        onScanSuccess={() => {
          fetchAttendance();
        }}
      />

      {/* Sessions Management Modal */}
      <AttendanceSessionsModal
        isOpen={isSessionsModalOpen}
        onClose={() => setIsSessionsModalOpen(false)}
        sessions={sessions}
        onSessionUpdated={async () => {
          const updated = await fetchSessions();
          const active = updated.find((s) => s.isActive) || updated[0];
          if (active) setSelectedSessionId(active._id);
          fetchAttendance();
        }}
      />

      {/* Participant History Modal */}
      <ParticipantAttendanceModal
        isOpen={!!selectedMemberForHistory}
        onClose={() => setSelectedMemberForHistory(null)}
        member={selectedMemberForHistory}
        onStatusChanged={() => fetchAttendance()}
      />
    </div>
  );
};

export default AttendancePage;
