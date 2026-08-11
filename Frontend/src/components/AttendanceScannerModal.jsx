import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { attendanceService } from '../services/attendanceService';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  RefreshCw,
  QrCode,
  Sparkles,
  Volume2,
  VolumeX,
  Keyboard,
  ShieldCheck,
  ChevronDown,
  Check,
} from 'lucide-react';

const AttendanceScannerModal = ({ isOpen, onClose, activeSession, onScanSuccess }) => {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanResult, setScanResult] = useState(null); // { type: 'SUCCESS' | 'DUPLICATE' | 'NOT_FOUND', data }
  const [liveStats, setLiveStats] = useState(null);
  const [devInput, setDevInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showDevInput, setShowDevInput] = useState(true);

  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);
  const resetTimerRef = useRef(null);

  // Play auditory tone feedback
  const playBeep = (type) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'SUCCESS') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else if (type === 'DUPLICATE') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // Low error tone
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      // Audio not supported or blocked by autoplay policy
    }
  };

  // Fetch live stats during scanning
  const refreshLiveStats = async () => {
    if (!activeSession) return;
    try {
      const data = await attendanceService.getAttendanceStats(activeSession._id);
      setLiveStats(data);
    } catch (err) {
      console.error('Failed to fetch scanner stats:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshLiveStats();
    }
  }, [isOpen, activeSession]);

  // Discover and initialize camera list
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available
          const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear') || d.label.toLowerCase().includes('environment'));
          setSelectedCamera(backCam ? backCam.id : devices[0].id);
        } else {
          setCameraError('No camera devices detected. You can still use the Manual Dev Input.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Camera permission check error:', err);
        setCameraError('Camera access required. Please allow camera permissions or use Manual Simulation.');
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Start / stop camera stream
  useEffect(() => {
    if (!isOpen || !selectedCamera) return;

    let scanner = null;

    const startScanner = async () => {
      try {
        setCameraError('');
        const qrCodeId = 'reader-container';
        const element = document.getElementById(qrCodeId);
        if (!element) return;

        scanner = new Html5Qrcode(qrCodeId);
        html5QrCodeRef.current = scanner;

        const config = {
          fps: 15,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
        };

        await scanner.start(
          selectedCamera,
          config,
          (decodedText) => {
            handleDecodedCode(decodedText);
          },
          () => {
            // Ignore ongoing frame search errors
          }
        );

        setIsScanning(true);
      } catch (err) {
        console.error('Error starting Html5Qrcode:', err);
        setCameraError(err.message || 'Unable to open camera stream. Please grant permission.');
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(() => {}).then(() => {
          try {
            scanner.clear();
          } catch (e) {}
        });
      }
      html5QrCodeRef.current = null;
      setIsScanning(false);
    };
  }, [isOpen, selectedCamera]);

  // Core handler for barcode/QR decoded string
  const handleDecodedCode = async (rawCode) => {
    if (!rawCode || isProcessingRef.current) return;

    // Lock processing to prevent duplicate bursts
    isProcessingRef.current = true;
    setIsProcessing(true);

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    const cleanCode = rawCode.trim();

    try {
      const response = await attendanceService.scanAttendance(
        cleanCode,
        activeSession ? activeSession._id : null
      );

      playBeep('SUCCESS');
      setScanResult({
        type: 'SUCCESS',
        title: 'Attendance Marked',
        participant: response.member,
        team: response.team,
        scannedAt: new Date(response.attendance.scannedAt).toLocaleTimeString(),
        method: response.attendance.method,
      });

      refreshLiveStats();
      if (onScanSuccess) onScanSuccess(response);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        // Already marked
        playBeep('DUPLICATE');
        const data = err.response.data;
        setScanResult({
          type: 'DUPLICATE',
          title: 'Already Marked',
          participant: data.member,
          team: data.team,
          status: data.attendance ? data.attendance.status : 'PRESENT',
          scannedAt: data.attendance ? new Date(data.attendance.scannedAt).toLocaleTimeString() : '',
        });
      } else if (err.response && err.response.status === 404) {
        // Participant not found
        playBeep('NOT_FOUND');
        setScanResult({
          type: 'NOT_FOUND',
          title: 'Participant Not Found',
          rawCode: cleanCode,
          message: err.response.data.message || 'This registration number is not registered in HEMS.',
        });
      } else {
        playBeep('NOT_FOUND');
        setScanResult({
          type: 'NOT_FOUND',
          title: 'Scan Error',
          rawCode: cleanCode,
          message: err.response?.data?.message || 'Server error recording attendance. Please try again.',
        });
      }
    } finally {
      // Auto-resume scanning after brief feedback delay (1.8s) for continuous high-speed flow
      resetTimerRef.current = setTimeout(() => {
        setScanResult(null);
        isProcessingRef.current = false;
        setIsProcessing(false);
      }, 1800);
    }
  };

  const handleManualDevSubmit = (e) => {
    e.preventDefault();
    if (!devInput.trim() || isProcessing) return;
    const input = devInput.trim();
    setDevInput('');
    handleDecodedCode(input);
  };

  const handleDismissResult = () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setScanResult(null);
    isProcessingRef.current = false;
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, padding: '1rem' }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '740px',
          width: '100%',
          backgroundColor: '#0a0d14',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 240, 255, 0.1)',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.12), rgba(0, 240, 255, 0.08))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--spidey-red), #991b1b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px var(--spidey-red-glow)',
              }}
            >
              <QrCode size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#ffffff', letterSpacing: '0.02em' }}>
                  ID CARD ATTENDANCE SCANNER
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(0, 240, 255, 0.15)',
                    color: 'var(--spidey-cyan)',
                    fontWeight: '700',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                  }}
                >
                  {activeSession ? activeSession.name : 'Active Session'}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Continuous high-volume ID barcode & QR scanner with duplicate prevention
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="btn btn-secondary btn-sm"
              title={soundEnabled ? 'Mute sound' : 'Enable sound'}
              style={{ padding: '0.4rem', borderRadius: '8px' }}
            >
              {soundEnabled ? <Volume2 size={16} color="var(--spidey-cyan)" /> : <VolumeX size={16} color="var(--text-muted)" />}
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Scanner Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Real-time Session Progress Counter Bar */}
          {liveStats && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '0.75rem 1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                    Present
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10b981' }}>
                    {liveStats.presentCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {liveStats.totalParticipants}</span>
                  </div>
                </div>

                <div style={{ height: '30px', width: '1px', backgroundColor: 'var(--border-color)' }} />

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                    Rate
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--spidey-cyan)' }}>
                    {liveStats.attendanceRate}%
                  </div>
                </div>

                <div style={{ height: '30px', width: '1px', backgroundColor: 'var(--border-color)' }} />

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                    Absent / Not Marked
                  </span>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    {liveStats.absentCount} A &bull; {liveStats.notMarkedCount} NM
                  </div>
                </div>
              </div>

              {liveStats.recentScans && liveStats.recentScans.length > 0 && (
                <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Last scanned: </span>
                  <span style={{ color: '#fff', fontWeight: '700' }}>{liveStats.recentScans[0].name}</span>
                  <span style={{ color: 'var(--spidey-cyan)', fontFamily: 'JetBrains Mono', marginLeft: '0.3rem' }}>
                    ({liveStats.recentScans[0].registerNumber})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Camera Selector Bar */}
          {cameras.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Camera size={16} color="var(--spidey-cyan)" /> Select Camera:
              </span>
              <div style={{ position: 'relative' }}>
                <select
                  className="form-input"
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.84rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                >
                  {cameras.map((cam) => (
                    <option key={cam.id} value={cam.id} style={{ backgroundColor: '#0c101c', color: '#fff' }}>
                      {cam.label || `Camera ${cam.id.slice(0, 8)}...`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Camera Viewport with Reticle & Animated Scanline */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              minHeight: '300px',
              maxHeight: '340px',
              backgroundColor: '#000000',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '2px solid rgba(0, 240, 255, 0.4)',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.15) inset',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* HTML5 QR Container */}
            <div
              id="reader-container"
              style={{
                width: '100%',
                height: '100%',
                display: cameraError ? 'none' : 'block',
              }}
            />

            {/* Cyberpunk Scan Targeting Reticle Overlay */}
            {!cameraError && isScanning && (
              <div
                style={{
                  position: 'absolute',
                  pointerEvents: 'none',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '240px',
                    height: '240px',
                    border: '2px dashed rgba(0, 240, 255, 0.7)',
                    borderRadius: '16px',
                    boxShadow: '0 0 25px rgba(0, 240, 255, 0.3)',
                    position: 'relative',
                  }}
                >
                  {/* Corner Reticle Accents */}
                  <div style={{ position: 'absolute', top: -3, left: -3, width: 16, height: 16, borderTop: '4px solid var(--spidey-red)', borderLeft: '4px solid var(--spidey-red)' }} />
                  <div style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderTop: '4px solid var(--spidey-red)', borderRight: '4px solid var(--spidey-red)' }} />
                  <div style={{ position: 'absolute', bottom: -3, left: -3, width: 16, height: 16, borderBottom: '4px solid var(--spidey-red)', borderLeft: '4px solid var(--spidey-red)' }} />
                  <div style={{ position: 'absolute', bottom: -3, right: -3, width: 16, height: 16, borderBottom: '4px solid var(--spidey-red)', borderRight: '4px solid var(--spidey-red)' }} />

                  {/* Pulsing scanning text */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: 0,
                      right: 0,
                      textAlign: 'center',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      letterSpacing: '0.1em',
                      color: 'var(--spidey-cyan)',
                      textShadow: '0 0 8px var(--spidey-cyan)',
                    }}
                  >
                    ALIGN BARCODE / QR CODE
                  </div>
                </div>
              </div>
            )}

            {/* Camera Error / Fallback State */}
            {cameraError && (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <CameraOff size={42} color="#f87171" />
                <h4 style={{ color: '#fff', fontSize: '1rem' }}>Camera Stream Unavailable</h4>
                <p style={{ fontSize: '0.85rem', maxWidth: '400px' }}>{cameraError}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--spidey-cyan)' }}>
                  Use the Manual / Dev Barcode Simulator below to scan ID numbers instantly.
                </p>
              </div>
            )}

            {/* Instant Dynamic Feedback Overlay Banner */}
            {scanResult && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 20,
                  backgroundColor:
                    scanResult.type === 'SUCCESS'
                      ? 'rgba(6, 78, 59, 0.95)'
                      : scanResult.type === 'DUPLICATE'
                      ? 'rgba(120, 53, 15, 0.95)'
                      : 'rgba(127, 29, 29, 0.95)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.5rem',
                  textAlign: 'center',
                  animation: 'fadeInScale 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {scanResult.type === 'SUCCESS' && (
                  <>
                    <CheckCircle2 size={54} color="#34d399" style={{ marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6ee7b7', fontWeight: '800' }}>
                      ✓ ATTENDANCE MARKED
                    </span>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff', margin: '0.2rem 0' }}>
                      {scanResult.participant?.name}
                    </h2>
                    <div style={{ fontSize: '1.1rem', color: 'var(--spidey-cyan)', fontFamily: 'JetBrains Mono', fontWeight: '700' }}>
                      {scanResult.participant?.registerNumber}
                    </div>
                    {scanResult.team && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#e2e8f0' }}>
                        Team {scanResult.team.teamNumber} &bull; {scanResult.team.teamName}
                      </div>
                    )}
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: '#a7f3d0' }}>
                      <span>Status: <strong>PRESENT</strong></span>
                      <span>&bull;</span>
                      <span>Scanned at: {scanResult.scannedAt}</span>
                    </div>
                  </>
                )}

                {scanResult.type === 'DUPLICATE' && (
                  <>
                    <AlertTriangle size={54} color="#fbbf24" style={{ marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fde68a', fontWeight: '800' }}>
                      ⚠ ALREADY MARKED
                    </span>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ffffff', margin: '0.2rem 0' }}>
                      {scanResult.participant?.name}
                    </h2>
                    <div style={{ fontSize: '1.1rem', color: '#fde68a', fontFamily: 'JetBrains Mono', fontWeight: '700' }}>
                      {scanResult.participant?.registerNumber}
                    </div>
                    {scanResult.team && (
                      <div style={{ marginTop: '0.3rem', fontSize: '0.85rem', color: '#fef3c7' }}>
                        Team {scanResult.team.teamNumber} &bull; {scanResult.team.teamName}
                      </div>
                    )}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#fed7aa' }}>
                      Already recorded as <strong>{scanResult.status}</strong> at {scanResult.scannedAt}
                    </div>
                  </>
                )}

                {scanResult.type === 'NOT_FOUND' && (
                  <>
                    <XCircle size={54} color="#f87171" style={{ marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fca5a5', fontWeight: '800' }}>
                      ✕ PARTICIPANT NOT FOUND
                    </span>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#ffffff', fontFamily: 'JetBrains Mono', margin: '0.4rem 0' }}>
                      {scanResult.rawCode}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#fecaca', maxWidth: '380px' }}>
                      {scanResult.message}
                    </p>
                  </>
                )}

                <button
                  onClick={handleDismissResult}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '1rem', padding: '0.3rem 1rem', fontSize: '0.78rem' }}
                >
                  Continue Scanning &rarr;
                </button>
              </div>
            )}
          </div>

          {/* Dev / Manual Barcode Input Section */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '0.85rem 1.1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--spidey-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Keyboard size={15} /> Manual & Dev ID Card Simulator
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Test any registration number without physical ID card
              </span>
            </div>

            <form onSubmit={handleManualDevSubmit} style={{ display: 'flex', gap: '0.6rem' }}>
              <input
                type="text"
                className="form-input font-mono"
                style={{ flex: 1, padding: '0.55rem 0.85rem', fontSize: '0.9rem' }}
                placeholder="Enter Register Number (e.g. 24CS001, 24CS101)..."
                value={devInput}
                onChange={(e) => setDevInput(e.target.value)}
                disabled={isProcessing}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.25rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                disabled={!devInput.trim() || isProcessing}
              >
                <Sparkles size={15} /> Simulate Scan
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(10, 13, 20, 0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>HEMS Automatic Duplicate Prevention Enabled &bull; Operational Attendance Log</span>
          </div>

          <button onClick={onClose} className="btn btn-secondary">
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceScannerModal;
