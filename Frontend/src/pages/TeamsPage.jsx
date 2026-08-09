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
  Filter,
  ChevronDown,
  Check,
} from 'lucide-react';

const RANGE_OPTIONS = [
  { label: 'All Teams', value: 'ALL', min: null, max: null },
  { label: 'Teams 1 – 10', value: '1-10', min: 1, max: 10 },
  { label: 'Teams 11 – 20', value: '11-20', min: 11, max: 20 },
  { label: 'Teams 21 – 30', value: '21-30', min: 21, max: 30 },
  { label: 'Teams 31 – 40', value: '31-40', min: 31, max: 40 },
  { label: 'Teams 41 – 50', value: '41-50', min: 41, max: 50 },
  { label: 'Teams 51 – 60', value: '51-60', min: 51, max: 60 },
  { label: 'Teams 61 – 70', value: '61-70', min: 61, max: 70 },
];

const SmoothRangeDropdown = ({ selectedValue, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  const selectedOption = options.find((o) => o.value === selectedValue) || options[0];

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
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          backgroundColor: isOpen ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-secondary)',
          border: isOpen ? '1px solid var(--spidey-red)' : '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.45rem 0.8rem',
          color: 'var(--text-primary)',
          fontSize: '0.85rem',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '0 0 12px rgba(239, 68, 68, 0.25)' : 'none',
          outline: 'none',
        }}
      >
        <Filter size={15} style={{ color: 'var(--spidey-red)', flexShrink: 0 }} />
        <span>{selectedOption.label}</span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            marginLeft: '0.15rem',
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 100,
            minWidth: '165px',
            backgroundColor: '#12131e',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '0.35rem',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(239, 68, 68, 0.15)',
            backdropFilter: 'blur(16px)',
            animation: 'fadeInScale 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === selectedValue;
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
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.83rem',
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                  backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
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
                {isSelected && <Check size={14} style={{ color: 'var(--spidey-red)' }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [teamRange, setTeamRange] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal States
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
      const activeRange = RANGE_OPTIONS.find((r) => r.value === teamRange) || RANGE_OPTIONS[0];
      const limit = activeRange.min ? 50 : 10;
      const data = await teamService.getTeams(page, limit, search, department, activeRange.min, activeRange.max);
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
    const handler = setTimeout(() => {
      fetchTeams(1);
    }, 200);

    return () => clearTimeout(handler);
  }, [search, department, teamRange]);

  const handlePageChange = (newPage) => {
    fetchTeams(newPage);
  };

  const openAddModal = () => {
    setFormData({
      teamNumber: '',
      teamName: '',
      department: '',
      members: [
        { name: '', registerNumber: '', department: '', email: '', phone: '' },
      ],
    });
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (team) => {
    setSelectedTeam(team);
    setFormData({
      teamNumber: team.teamNumber,
      teamName: team.teamName,
      department: team.department,
      members: (team.members && team.members.length > 0)
        ? team.members.map((m) => ({
            _id: m._id,
            name: m.name,
            registerNumber: m.registerNumber,
            department: m.department,
            email: m.email || '',
            phone: m.phone || '',
          }))
        : [{ name: '', registerNumber: '', department: team.department || '', email: '', phone: '' }],
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

  const handleAddMemberRow = () => {
    setFormData((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        { name: '', registerNumber: '', department: prev.department || '', email: '', phone: '' },
      ],
    }));
  };

  const handleRemoveMemberRow = (index) => {
    if (formData.members.length <= 1) {
      alert('A team must have at least 1 member.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }));
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
        teamNumber: '1',
        teamName: 'Cyber Knights',
        department: 'Computer Science',
        members: [
          { name: 'Member 1', registerNumber: 'REG101', department: 'Computer Science', email: 'm1@demo.com', phone: '9876543210' },
          { name: 'Member 2', registerNumber: 'REG102', department: 'Computer Science', email: 'm2@demo.com', phone: '9876543211' },
          { name: 'Member 3', registerNumber: 'REG103', department: 'Computer Science', email: 'm3@demo.com', phone: '9876543212' },
        ],
      },
      {
        teamNumber: '2',
        teamName: 'Code Alchemists',
        department: 'Information Technology',
        members: [
          { name: 'Alice Smith', registerNumber: 'IT201', department: 'Information Technology', email: 'alice@demo.com', phone: '9876543214' },
          { name: 'Bob Jones', registerNumber: 'IT202', department: 'Information Technology', email: 'bob@demo.com', phone: '9876543215' },
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
    { header: 'Members Count', accessor: (row) => (row.members || []).length },
    { header: 'Members', accessor: (row) => (row.members || []).map((m) => `${m.name} (${m.registerNumber})`).join(', ') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Actions Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, flexWrap: 'wrap' }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by Team Number, Name, Member Name..."
          />

          {/* Smooth Glassmorphic Team Range Dropdown */}
          <SmoothRangeDropdown selectedValue={teamRange} onChange={setTeamRange} options={RANGE_OPTIONS} />
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
      {error && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* Teams Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Team #</th>
              <th>Team Name</th>
              <th>Department</th>
              <th>Members</th>
              <th style={{ textAlign: 'right', width: '140px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading teams data...
                </td>
              </tr>
            ) : teams.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
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
          <div className="modal-content" style={{ maxWidth: '680px' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Team Number *</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      placeholder="e.g. 1"
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

                <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />

                {/* Header with Dynamic Add Member Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--spidey-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} /> Team Members ({formData.members.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddMemberRow}
                    className="btn btn-cyan btn-sm"
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Plus size={14} /> Add Member
                  </button>
                </div>

                {formData.members.map((m, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                      <h5 style={{ fontSize: '0.85rem', color: 'var(--spidey-cyan)', fontWeight: '700' }}>Member #{idx + 1}</h5>
                      {formData.members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMemberRow(idx)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Remove this member"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>

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
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Department</span>
                <div style={{ fontWeight: '600' }}>{selectedTeam.department}</div>
              </div>

              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--spidey-cyan)' }}>
                  Team Roster ({selectedTeam.members ? selectedTeam.members.length : 0} Members)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {selectedTeam.members && selectedTeam.members.map((m, idx) => (
                    <div key={m._id || idx} className="card" style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                        Member #{idx + 1}
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{m.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--spidey-cyan)', fontFamily: 'JetBrains Mono', margin: '0.2rem 0' }}>
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
                  Paste a valid JSON array of teams (each team can have any number of members, 1 or more), or download the template below.
                </p>

                <button type="button" onClick={downloadBulkTemplate} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
                  <Download size={14} /> Download Sample JSON Template
                </button>

                <textarea
                  className="form-input font-mono"
                  style={{ minHeight: '220px', resize: 'vertical' }}
                  placeholder="Paste JSON array here..."
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  required
                />
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
