import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, File, ChevronDown, Layers, CheckCircle2, Sparkles } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';
import { attendanceService } from '../services/attendanceService';
import { formatISTWithSuffix } from '../utils/dateUtils';

const AttendanceExportMenu = ({ currentSessionName, currentSessionData = [], currentSessionColumns = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to fetch and prepare Master All-Sessions Matrix Data
  const getMasterDataAndColumns = async () => {
    const report = await attendanceService.getAllSessionsReport();
    const { sessions = [], matrix = [] } = report;

    if (!matrix.length) {
      alert('No participant records found to export.');
      return null;
    }

    // Define columns for Master Export with explicit IST timestamps
    const columns = [
      { header: 'Team #', accessor: (r) => r.teamNumber },
      { header: 'Team Name', accessor: (r) => r.teamName },
      { header: 'Participant Name', accessor: (r) => r.name },
      { header: 'Registration #', accessor: (r) => r.registerNumber },
      { header: 'Department', accessor: (r) => r.department },
      ...sessions.map((s) => ({
        header: `${s.name} Status`,
        accessor: (r) => {
          const sessObj = r.sessions?.[s.name];
          return typeof sessObj === 'object' && sessObj !== null ? sessObj.status : sessObj || 'Not Marked';
        },
      })),
      ...sessions.map((s) => ({
        header: `${s.name} Scan Time (IST)`,
        accessor: (r) => {
          const sessObj = r.sessions?.[s.name];
          return typeof sessObj === 'object' && sessObj?.scannedAt ? formatISTWithSuffix(sessObj.scannedAt) : '-';
        },
      })),
      { header: 'Present / Total', accessor: (r) => r.attendanceSummary },
      { header: 'Attendance Rate', accessor: (r) => r.attendanceRate },
      { header: 'Last Recorded Scan (IST)', accessor: (r) => (r.lastScannedAt ? formatISTWithSuffix(r.lastScannedAt) : '-') },
    ];

    const flatRows = matrix.map((row) => {
      const item = {
        'Team #': row.teamNumber,
        'Team Name': row.teamName,
        'Participant Name': row.name,
        'Registration #': row.registerNumber,
        'Department': row.department,
      };
      sessions.forEach((s) => {
        const sessObj = row.sessions?.[s.name];
        const status = typeof sessObj === 'object' && sessObj !== null ? sessObj.status : sessObj || 'Not Marked';
        const scanTime = typeof sessObj === 'object' && sessObj?.scannedAt ? formatISTWithSuffix(sessObj.scannedAt) : '-';
        item[`${s.name} Status`] = status;
        item[`${s.name} Scan Time (IST)`] = scanTime;
      });
      item['Present / Total'] = row.attendanceSummary;
      item['Attendance Rate'] = row.attendanceRate;
      item['Last Recorded Scan (IST)'] = row.lastScannedAt ? formatISTWithSuffix(row.lastScannedAt) : '-';
      return item;
    });

    return { columns, flatRows, rawMatrix: matrix, sessions };
  };

  // Export Master All Sessions
  const handleExportMaster = async (format) => {
    try {
      setIsExporting(true);
      const master = await getMasterDataAndColumns();
      if (!master) return;

      const filename = `hems_master_attendance_all_sessions_${new Date().toISOString().slice(0, 10)}`;
      const title = 'HEMS Master Attendance Report — All Sessions & Rounds';

      if (format === 'EXCEL') {
        exportToExcel(filename, 'Master Attendance', master.flatRows);
      } else if (format === 'CSV') {
        exportToCSV(filename, master.flatRows);
      } else if (format === 'PDF') {
        exportToPDF(filename, title, master.columns, master.rawMatrix);
      }
      setIsOpen(false);
    } catch (err) {
      console.error('Master export error:', err);
      alert('Failed to export master report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export Current Selected Session
  const handleExportCurrent = (format) => {
    if (!currentSessionData.length) {
      alert('No data in current session to export.');
      return;
    }

    const filename = `attendance_${(currentSessionName || 'session').toLowerCase().replace(/\s+/g, '_')}`;
    const title = `HEMS Attendance — ${currentSessionName || 'Session'}`;

    const flatData = currentSessionData.map((item) => {
      const row = {};
      currentSessionColumns.forEach((col) => {
        row[col.header] = col.accessor(item);
      });
      return row;
    });

    if (format === 'EXCEL') {
      exportToExcel(filename, 'Session Attendance', flatData);
    } else if (format === 'CSV') {
      exportToCSV(filename, flatData);
    } else if (format === 'PDF') {
      exportToPDF(filename, title, currentSessionColumns, currentSessionData);
    }
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block', zIndex: isOpen ? 99999 : 'auto' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontWeight: '700',
          fontSize: '0.84rem',
          padding: '0.52rem 0.95rem',
          backgroundColor: isOpen ? 'rgba(0, 240, 255, 0.12)' : 'var(--bg-input)',
          border: isOpen ? '1px solid var(--spidey-cyan)' : '1px solid var(--border-color)',
          boxShadow: isOpen ? '0 0 14px var(--spidey-cyan-glow)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        disabled={isExporting}
      >
        <Download size={15} style={{ color: 'var(--spidey-cyan)' }} />
        <span>{isExporting ? 'Exporting...' : 'Export Attendance'}</span>
        <ChevronDown
          size={14}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'var(--text-muted)',
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 999999,
            width: '280px',
            backgroundColor: '#0c101c',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '14px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 240, 255, 0.2)',
            backdropFilter: 'blur(24px)',
            padding: '0.5rem',
            animation: 'fadeInScale 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* SECTION 1: MASTER ALL SESSIONS (RECOMMENDED) */}
          <div style={{ padding: '0.4rem 0.6rem 0.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: '800', color: 'var(--spidey-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Layers size={13} /> Master Report (All Sessions)
            </div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Exports every round & check-in side-by-side in one sheet
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '0.3rem' }}>
            <button
              onClick={() => handleExportMaster('EXCEL')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                width: '100%',
                padding: '0.55rem 0.75rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <FileSpreadsheet size={16} color="#10b981" />
              <span>Master Excel (.xlsx)</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.68rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>All Rounds</span>
            </button>

            <button
              onClick={() => handleExportMaster('CSV')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                width: '100%',
                padding: '0.55rem 0.75rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <FileText size={16} color="var(--spidey-cyan)" />
              <span>Master CSV (.csv)</span>
            </button>

            <button
              onClick={() => handleExportMaster('PDF')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                width: '100%',
                padding: '0.55rem 0.75rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <File size={16} color="#ef4444" />
              <span>Master PDF Summary</span>
            </button>
          </div>

          {/* DIVIDER */}
          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.45rem 0' }} />

          {/* SECTION 2: CURRENT SELECTED SESSION */}
          <div style={{ padding: '0.3rem 0.6rem 0.2rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Session ({currentSessionName || 'Selected'})
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <button
              onClick={() => handleExportCurrent('EXCEL')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                width: '100%',
                padding: '0.5rem 0.75rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <FileSpreadsheet size={15} color="#10b981" />
              <span>Session Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => handleExportCurrent('CSV')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                width: '100%',
                padding: '0.5rem 0.75rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <FileText size={15} color="var(--spidey-cyan)" />
              <span>Session CSV (.csv)</span>
            </button>

            <button
              onClick={() => handleExportCurrent('PDF')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                width: '100%',
                padding: '0.5rem 0.75rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <File size={15} color="#ef4444" />
              <span>Session PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceExportMenu;
