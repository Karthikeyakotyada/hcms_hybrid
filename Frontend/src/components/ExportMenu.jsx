import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';

const ExportMenu = ({ filename = 'export', title = 'Report', columns = [], data = [] }) => {
  const [open, setOpen] = useState(false);

  const handleCSV = () => {
    if (!data.length) return alert('No data to export');
    // Format simple flat object for CSV
    const flatData = data.map((item) => {
      const row = {};
      columns.forEach((col) => {
        row[col.header] = col.accessor(item);
      });
      return row;
    });
    exportToCSV(filename, flatData);
    setOpen(false);
  };

  const handleExcel = () => {
    if (!data.length) return alert('No data to export');
    const flatData = data.map((item) => {
      const row = {};
      columns.forEach((col) => {
        row[col.header] = col.accessor(item);
      });
      return row;
    });
    exportToExcel(filename, 'Sheet1', flatData);
    setOpen(false);
  };

  const handlePDF = () => {
    if (!data.length) return alert('No data to export');
    exportToPDF(filename, title, columns, data);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-secondary"
        style={{ gap: '0.5rem' }}
      >
        <Download size={16} /> Export Report
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '110%',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
            width: '180px',
            padding: '0.4rem 0',
          }}
        >
          <button
            onClick={handleCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              width: '100%',
              padding: '0.6rem 1rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          >
            <FileText size={16} color="var(--accent-info)" /> Export CSV
          </button>

          <button
            onClick={handleExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              width: '100%',
              padding: '0.6rem 1rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          >
            <FileSpreadsheet size={16} color="var(--accent-success)" /> Export Excel (.xlsx)
          </button>

          <button
            onClick={handlePDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              width: '100%',
              padding: '0.6rem 1rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          >
            <File size={16} color="var(--accent-danger)" /> Export PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
