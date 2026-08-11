import React, { useEffect, useState } from 'react';
import { attendanceService } from '../services/attendanceService';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  QrCode,
  Edit3,
  X,
  RotateCcw,
} from 'lucide-react';

const ParticipantAttendanceModal = ({ isOpen, onClose, member, onStatusChanged }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingSessionId, setUpdatingSessionId] = useState(null);

  const fetchHistory = async () => {
    if (!member) return;
    try {
      setLoading(true);
      setError('');
      const data = await attendanceService.getParticipantHistory(member.memberId || member._id);
      setHistory(data.history || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load participant attendance history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && member) {
      fetchHistory();
    }
  }, [isOpen, member]);

  const handleMark = async (sessionId, status) => {
    try {
      setUpdatingSessionId(sessionId);
      await attendanceService.manualMarkAttendance(
        member.memberId || member._id,
        sessionId,
        status
      );
      await fetchHistory();
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update attendance');
    } finally {
      setUpdatingSessionId(null);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 240, 255, 0.15)',
                color: 'var(--spidey-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{member.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--spidey-cyan)', fontWeight: '700' }}>
                  {member.registerNumber}
                </span>
                {member.team && (
                  <>
                    <span>&bull;</span>
                    <span>Team {member.team.teamNumber} ({member.team.teamName})</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Attendance Records Across Sessions
            </h4>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Loading attendance history...
              </div>
            ) : history.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No attendance sessions found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {history.map((h) => {
                  const isUpdating = updatingSessionId === h.sessionId;
                  return (
                    <div
                      key={h.sessionId}
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                          {h.sessionName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.78rem' }}>
                          {h.status === 'PRESENT' && (
                            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle size={12} /> Present
                            </span>
                          )}
                          {h.status === 'ABSENT' && (
                            <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <XCircle size={12} /> Absent
                            </span>
                          )}
                          {h.status === 'NOT_MARKED' && (
                            <span className="badge" style={{ backgroundColor: 'rgba(100, 116, 139, 0.2)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <HelpCircle size={12} /> Not Marked
                            </span>
                          )}

                          {h.method && (
                            <span style={{ color: 'var(--text-muted)' }}>
                              via {h.method}
                            </span>
                          )}

                          {h.scannedAt && (
                            <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Clock size={12} /> {new Date(h.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Manual Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => handleMark(h.sessionId, 'PRESENT')}
                          className={`btn btn-sm ${h.status === 'PRESENT' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          disabled={isUpdating}
                        >
                          Mark Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMark(h.sessionId, 'ABSENT')}
                          className={`btn btn-sm ${h.status === 'ABSENT' ? 'btn-danger' : 'btn-secondary'}`}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          disabled={isUpdating}
                        >
                          Mark Absent
                        </button>
                        {h.status !== 'NOT_MARKED' && (
                          <button
                            type="button"
                            onClick={() => handleMark(h.sessionId, 'NOT_MARKED')}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--text-muted)' }}
                            title="Reset to Not Marked (removes record)"
                            disabled={isUpdating}
                          >
                            <RotateCcw size={12} /> Reset
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantAttendanceModal;
