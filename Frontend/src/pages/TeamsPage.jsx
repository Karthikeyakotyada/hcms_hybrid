import React, { useEffect, useState } from 'react';
import { teamService } from '../services/teamService';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import ExportMenu from '../components/ExportMenu';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  FileSpreadsheet,
  Users,
  X,
  AlertCircle,
  CheckCircle,
  Download,
} from 'lucide-react';

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Form State for Add / Edit
  const initialFormState = {
    teamNumber: '',
    teamName: '',
    department: '',
    guideName: '',
    members: [
      { name: '', registerNumber: '', department: '', email: '', phone: '' },
      { name: '', registerNumber: '', department: '', email: '', phone: '' },
      { name: '', registerNumber: '', department: '', email: '', phone: '' },
      { name: '', registerNumber: '', department: '', email: '', phone: '' },
    ],
  };

  const [formData, setFormData] = useState(initialFormState);
  const [bulkInput, setBulkInput] = useState('');
  const [formError, setFormError] = useState('');

  const fetchTeams = async (page = 1) => {
    try {
      setLoading(true);
      const data = await teamService.getTeams(page, 10, search, department);
      setTeams(data.teams);
      setPagination(data.pagination);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams(1);
  }, [search, department]);

  const handlePageChange = (newPage) => {
    fetchTeams(newPage);
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (team) => {
    setSelectedTeam(team);
    setFormData({
      teamNumber: team.teamNumber,
      teamName: team.teamName,
      department: team.department,
      guideName: team.guideName || '',
      members: team.members.map((m) => ({
        _id: m._id,
        name: m.name,
        registerNumber: m.registerNumber,
        department: m.department,
        email: m.email || '',
        phone: m.phone || '',
      })),
    });
    setFormError('');
    setShowEditModal(true);
  };

  const openViewModal = (team) => {
    setSelectedTeam(team);
    setShowViewModal(true);
  };

  const handleFormMemberChange = (index, field, value) => {
    const updatedMembers = [...formData.members];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setFormData({ ...formData, members: updatedMembers });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await teamService.createTeam(formData);
      setSuccessMsg(`Team ${formData.teamNumber} created successfully!`);
      setShowAddModal(false);
      fetchTeams(pagination.page);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create team');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await teamService.updateTeam(selectedTeam._id, formData);
      setSuccessMsg(`Team ${formData.teamNumber} updated successfully!`);
      setShowEditModal(false);
      fetchTeams(pagination.page);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update team');
    }
  };

  const handleDelete = async (team) => {
    if (window.confirm(`Are you sure you want to delete Team ${team.teamNumber} (${team.teamName})? This will also remove all their evaluation scores.`)) {
      try {
        await teamService.deleteTeam(team._id);
        setSuccessMsg(`Team ${team.teamNumber} deleted.`);
        fetchTeams(pagination.page);
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete team');
      }
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const parsedData = JSON.parse(bulkInput);
      const res = await teamService.bulkImport(Array.isArray(parsedData) ? parsedData : [parsedData]);
      setSuccessMsg(res.message);
      setShowBulkModal(false);
      setBulkInput('');
      fetchTeams(1);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError('Invalid JSON format or server rejected bulk data. Check template.');
    }
  };

  const downloadBulkTemplate = () => {
    const template = [
      {
        teamNumber: 'T-101',
        teamName: 'Cyber Knights',
        department: 'Computer Science',
        guideName: 'Dr. Alan Turing',
        members: [
          { name: 'Member 1', registerNumber: 'REG101', department: 'Computer Science', email: 'm1@demo.com', phone: '9876543210' },
          { name: 'Member 2', registerNumber: 'REG102', department: 'Computer Science', email: 'm2@demo.com', phone: '9876543211' },
          { name: 'Member 3', registerNumber: 'REG103', department: 'Computer Science', email: 'm3@demo.com', phone: '9876543212' },
          { name: 'Member 4', registerNumber: 'REG104', department: 'Computer Science', email: 'm4@demo.com', phone: '9876543213' },
        ],
      },
    ];
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(template, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'hems_teams_import_template.json');
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  // Export Columns definition
  const exportColumns = [
    { header: 'Team Number', accessor: (row) => row.teamNumber },
    { header: 'Team Name', accessor: (row) => row.teamName },
    { header: 'Department', accessor: (row) => row.department },
    { header: 'Guide Name', accessor: (row) => row.guideName || '-' },
    { header: 'Member 1', accessor: (row) => row.members[0] ? `${row.members[0].name} (${row.members[0].registerNumber})` : '-' },
    { header: 'Member 2', accessor: (row) => row.members[1] ? `${row.members[1].name} (${row.members[1].registerNumber})` : '-' },
    { header: 'Member 3', accessor: (row) => row.members[2] ? `${row.members[2].name} (${row.members[2].registerNumber})` : '-' },
    { header: 'Member 4', accessor: (row) => row.members[3] ? `${row.members[3].name} (${row.members[3].registerNumber})` : '-' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Actions Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by Team Number, Name, Member Name..."
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ExportMenu filename="hems_teams" title="Hackathon Teams Roster" columns={exportColumns} data={teams} />
          
          <button onClick={() => setShowBulkModal(true)} className="btn btn-secondary">
            <FileSpreadsheet size={16} /> Bulk Import
          </button>

          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} /> Add New Team
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', color: '#34d399', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {error && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Teams Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Team #</th>
              <th>Team Name</th>
              <th>Department</th>
              <th>Guide Name</th>
              <th>Members (4)</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading teams...
                </td>
              </tr>
            ) : teams.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No teams found. Click "Add New Team" or use "Bulk Import" to create teams.
                </td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr key={team._id}>
                  <td>
                    <span className="team-badge">{team.teamNumber}</span>
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{team.teamName}</td>
                  <td>{team.department}</td>
                  <td>{team.guideName || <span style={{ color: 'var(--text-muted)' }}>N/A</span>}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {team.members && team.members.map((m) => (
                        <span key={m._id} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          &bull; {m.name} <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>({m.registerNumber})</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button onClick={() => openViewModal(team)} className="btn btn-secondary btn-sm" title="View Team Details">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => openEditModal(team)} className="btn btn-secondary btn-sm" title="Edit Team">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(team)} className="btn btn-danger btn-sm" title="Delete Team">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        totalItems={pagination.total}
        itemLabel="teams"
      />

      {/* Add / Edit Team Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                {showAddModal ? 'Add New Team' : `Edit Team ${selectedTeam?.teamNumber}`}
              </h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {formError && (
                  <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.85rem' }}>
                    {formError}
                  </div>
                )}

                {/* Team Info Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Team Number *</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      placeholder="e.g. T-01"
                      value={formData.teamNumber}
                      onChange={(e) => setFormData({ ...formData, teamNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Team Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Innovators"
                      value={formData.teamName}
                      onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Computer Science"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Guide Name (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Faculty Guide / Mentor Name"
                    value={formData.guideName}
                    onChange={(e) => setFormData({ ...formData, guideName: e.target.value })}
                  />
                </div>

                <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />

                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} /> Team Roster (Exactly 4 Members Required)
                </h4>

                {formData.members.map((m, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <h5 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>Member #{idx + 1}</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr', gap: '0.75rem', marginBottom: '0.6rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Full Name *"
                        value={m.name}
                        onChange={(e) => handleFormMemberChange(idx, 'name', e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        className="form-input font-mono"
                        placeholder="Register Number *"
                        value={m.registerNumber}
                        onChange={(e) => handleFormMemberChange(idx, 'registerNumber', e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Department *"
                        value={m.department}
                        onChange={(e) => handleFormMemberChange(idx, 'department', e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="Email (Optional)"
                        value={m.email}
                        onChange={(e) => handleFormMemberChange(idx, 'email', e.target.value)}
                      />
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="Phone (Optional)"
                        value={m.phone}
                        onChange={(e) => handleFormMemberChange(idx, 'phone', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {showAddModal ? 'Save Team' : 'Update Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Team Modal */}
      {showViewModal && selectedTeam && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="team-badge" style={{ fontSize: '1rem', padding: '0.3rem 0.8rem' }}>
                  {selectedTeam.teamNumber}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{selectedTeam.teamName}</h3>
              </div>
              <button onClick={() => setShowViewModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Department</span>
                  <div style={{ fontWeight: '600' }}>{selectedTeam.department}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Faculty Guide</span>
                  <div style={{ fontWeight: '600' }}>{selectedTeam.guideName || 'None assigned'}</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--accent-primary)' }}>
                  Team Roster (4 Members)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {selectedTeam.members && selectedTeam.members.map((m, idx) => (
                    <div key={m._id} className="card" style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                        Member #{idx + 1}
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{m.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono', margin: '0.2rem 0' }}>
                        Reg #: {m.registerNumber}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dept: {m.department}</div>
                      {m.email && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Email: {m.email}</div>}
                      {m.phone && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Phone: {m.phone}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowViewModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Bulk Import Teams (JSON)</h3>
              <button onClick={() => setShowBulkModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Paste a valid JSON array of teams with exactly 4 members per team, or download the template below.
                </p>

                <button type="button" onClick={downloadBulkTemplate} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
                  <Download size={14} /> Download Sample JSON Template
                </button>

                {formError && (
                  <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.85rem' }}>
                    {formError}
                  </div>
                )}

                <textarea
                  className="form-textarea font-mono"
                  rows="10"
                  placeholder="Paste JSON array here..."
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowBulkModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Import Teams
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
