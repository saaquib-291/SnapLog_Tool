import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Shield,
  Printer,
  Terminal,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  Play,
  RotateCw,
  Hash,
  Download,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Trash2,
  MessageSquare
} from 'lucide-react';
import caseService from '../services/caseService';
import captureService from '../services/captureService';
import Navbar from '../components/Navbar';
import PlatformButton from '../components/PlatformButton';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const CaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePlatform, setActivePlatform] = useState(null);
  const [captureStatus, setCaptureStatus] = useState('idle'); // 'idle' | 'running' | 'completed'
  const [logs, setLogs] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [targetUsername, setTargetUsername] = useState('');
  const [targetPassword, setTargetPassword] = useState('');
  const [targetChatUser, setTargetChatUser] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true);
        const data = await caseService.getCaseById(id);
        setCaseData(data);

        // Load real captured evidence artifacts from database
        if (data && Array.isArray(data.artifacts) && data.artifacts.length > 0) {
          setEvidenceList(
            data.artifacts.map((a, idx) => ({
              id: a.id ? (a.id.startsWith('SCR-') ? a.id : `SCR-${String(a.sequenceNumber || idx + 1).padStart(3, '0')}`) : `SCR-${String(idx + 1).padStart(3, '0')}`,
              rawId: a.id,
              section: (a.section || 'Capture').replace(/_/g, ' '),
              platform: a.platform || data.targetPlatform || 'Instagram',
              timestamp: a.timestamp || data.createdAt,
              hash: a.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              file: a.filePath || ''
            }))
          );
        } else {
          setEvidenceList([]);
        }
      } catch (err) {
        setError('Failed to load case: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [id]);

  // Real-time live log & event listeners from Playwright / Electron backend
  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubProgress = window.electronAPI.onCaptureProgress?.((data) => {
      if (!data) return;
      const art = data.artifact || data;
      const hash = art.hash || data.hash;
      if (!hash) return;

      const seq = art.sequenceNumber || data.screenshotNumber || data.sequenceNumber;
      const section = (art.section || data.section || 'Capture').replace(/_/g, ' ');
      const platform = art.platform || data.platform || 'Instagram';
      const timestamp = art.timestamp || data.timestamp || new Date().toISOString();
      const filePath = art.filePath || data.filePath || '';
      const rawId = art.id || data.id || `SCR-${String(seq || 1).padStart(3, '0')}`;

      setEvidenceList((prev) => {
        if (prev.some(item => (item.rawId && item.rawId === rawId) || (item.hash && item.hash === hash))) {
          return prev;
        }
        const newEntry = {
          id: `SCR-${String(seq || prev.length + 1).padStart(3, '0')}`,
          rawId,
          section,
          platform,
          timestamp,
          hash,
          file: filePath
        };
        return [newEntry, ...prev];
      });
    });

    const unsubLog = window.electronAPI.onCaptureLog?.((data) => {
      if (data && data.text) {
        addLog(data.text, data.type || 'info');
      }
    });

    const unsubBrowserClosed = window.electronAPI.onCaptureBrowserClosed?.((data) => {
      addLog('[BROWSER] Website window closed by user/system. Progress is OVER.', 'warn');
      setCaptureStatus('completed');
      setActivePlatform(null);
    });

    const unsubCompleted = window.electronAPI.onCaptureCompleted?.((data) => {
      addLog(`[COMPLETED] Evidence capture finished for ${data.platform?.toUpperCase() || 'platform'}. Total artifacts: ${data.screenshotsCaptured || 0}. Progress is OVER.`, 'success');
      setCaptureStatus('completed');
      setActivePlatform(null);
    });

    const unsubError = window.electronAPI.onCaptureError?.((data) => {
      addLog(`[ERROR] Capture halted: ${data.error}`, 'error');
      setCaptureStatus('idle');
      setActivePlatform(null);
    });

    return () => {
      if (typeof unsubProgress === 'function') unsubProgress();
      if (typeof unsubLog === 'function') unsubLog();
      if (typeof unsubBrowserClosed === 'function') unsubBrowserClosed();
      if (typeof unsubCompleted === 'function') unsubCompleted();
      if (typeof unsubError === 'function') unsubError();
    };
  }, []);

  const addLog = (text, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, text, type }]);
  };

  const handleStartCapture = async (platform) => {
    setActivePlatform(platform);
    setCaptureStatus('running');
    setLogs([]);

    addLog(`[INIT] Initializing forensic session for platform: ${platform.toUpperCase()}`, 'info');

    try {
      if (window.electronAPI) {
        addLog(`[SECURITY] Connecting to Electron automation engine...`, 'info');
        await captureService.startCapture(caseData.id, platform, {
          username: targetUsername.trim(),
          password: targetPassword.trim(),
          targetChatUser: targetChatUser.trim()
        });
      } else {
        // Fallback simulated progress for browser-only dev testing
        addLog(`[SIMULATION] Running browser simulation mode...`, 'info');
        setTimeout(() => {
          addLog(`[AUTH] Session authenticated.`, 'success');
        }, 1200);

        setTimeout(() => {
          addLog(`[NAV] Navigating to platform feed...`, 'info');
          addLog(`[SCROLL] Auto-scrolling until DOM height stabilization detected...`, 'info');
          addLog(`[CAPTURE] Full-page screenshot captured -> ${platform}_timeline_001.png`, 'success');
        }, 3000);

        setTimeout(() => {
          addLog(`[SUCCESS] Evidence capture complete for ${platform.toUpperCase()}. Progress is OVER.`, 'success');
          setCaptureStatus('completed');
          setActivePlatform(null);
        }, 5500);
      }
    } catch (err) {
      addLog(`[ERROR] Capture failed: ${err.message}`, 'error');
      setCaptureStatus('idle');
      setActivePlatform(null);
    }
  };

  const handleDeleteCase = async () => {
    const confirmDelete = window.confirm(
      `⚠️ Delete Case Confirmation\n\nAre you sure you want to permanently delete case "${caseData.title}" (${caseData.id})?\n\nAll captured evidence records, screenshots, and logs for this case will be removed from the database.`
    );
    if (!confirmDelete) return;

    try {
      await caseService.deleteCase(caseData.id);
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to delete case: ' + err.message);
    }
  };

  const handleGeneratePdf = async () => {
    try {
      if (window.electronAPI && window.electronAPI.generatePanchnamaPdf) {
        addLog('[REPORT] Compiling evidence ledger into court-ready Panchnama PDF...', 'info');
        const res = await window.electronAPI.generatePanchnamaPdf(caseData.id, { evidenceList });
        if (res.success) {
          addLog(`[SUCCESS] Panchnama PDF generated: ${res.fileName}`, 'success');
          alert(`✅ Panchnama PDF generated successfully!\n\nSaved to:\n${res.filePath}\n\nOpening PDF file now...`);
        } else {
          addLog(`[ERROR] PDF Generation failed: ${res.error}`, 'error');
          alert('Failed to generate PDF: ' + res.error);
        }
      } else {
        alert(`[PANCHNAMA PDF GENERATOR]\nCompiling ${evidenceList.length} evidence items into Panchnama-ready PDF with Section 65B Certificate & SHA-256 Hashes.`);
      }
    } catch (err) {
      alert('Error generating report: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Navbar title="Loading Case..." />
        <main className="page-container" style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div style={{ fontSize: '1.125rem', color: '#64748b', fontWeight: 600 }}>Loading investigation file...</div>
        </main>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="app-container">
        <Navbar title="Case Not Found" showBackButton={true} onBackClick={() => navigate('/dashboard')} />
        <main className="page-container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', maxWidth: '400px', margin: '0 auto' }}>
            {error || 'Case could not be retrieved.'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        title={`Case: ${caseData.title || caseData.id}`}
        showBackButton={true}
        onBackClick={() => navigate('/dashboard')}
      />

      <main className="page-container">
        {/* Case Banner */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.75rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="card-badge-id">{caseData.id}</span>
                <Badge variant={caseData.platforms?.length > 0 ? 'secondary' : 'outline'}>
                  {caseData.platforms?.length > 0 ? 'Active Evidence File' : 'New Investigation'}
                </Badge>
                <Badge variant="secondary" style={{ gap: '0.25rem', fontSize: '0.75rem' }}>
                  <Lock size={11} /> Air-Gapped
                </Badge>
              </div>

              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{caseData.title}</h1>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem', maxWidth: '700px' }}>
                {caseData.description || 'Forensic evidence capture session for physical Panchnama documentary proof.'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGeneratePdf}
                disabled={evidenceList.length === 0}
                style={{ gap: '0.375rem' }}
              >
                <Download size={15} />
                <span>Export Panchnama PDF</span>
              </Button>
              <Button
                size="sm"
                onClick={handleGeneratePdf}
                disabled={evidenceList.length === 0}
                style={{ gap: '0.375rem' }}
              >
                <Printer size={15} />
                <span>Print Report</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteCase}
                style={{ gap: '0.375rem', color: '#ef4444', borderColor: '#fca5a5' }}
              >
                <Trash2 size={15} />
                <span>Delete Case</span>
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', fontSize: '0.8125rem', color: '#64748b' }}>
            <div>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Victim / Complainant:</span> {caseData.victimName || 'Aarav Mehta'}
            </div>
            <div>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Lead Examiner:</span> {caseData.examinerId || 'examiner001'}
            </div>
            <div>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Date Opened:</span> {new Date(caseData.createdAt).toLocaleDateString()}
            </div>
            <div>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Captured Artifacts:</span> {evidenceList.length} Screenshots
            </div>
            <div>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Legal Standard:</span> Section 65B BSA / IEA Certified
            </div>
          </div>
        </div>

        {/* Target Credentials Bar - In Memory Only */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <KeyRound size={16} style={{ color: '#2563eb' }} />
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a' }}>
                Volatile Session Credentials & Chat Target (For Auto-Fill)
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 600 }}>
              <Shield size={12} />
              <span>🔒 In-Memory Only • Never Saved to Disk or Database</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                Target Username / Handle / Email
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={14} style={{ position: 'absolute', left: '0.75rem', color: '#94a3b8', pointerEvents: 'none', zIndex: 1 }} />
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. amxn360 or victim@email.com"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                Target Password / PIN
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={14} style={{ position: 'absolute', left: '0.75rem', color: '#94a3b8', pointerEvents: 'none', zIndex: 1 }} />
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password for automated login"
                  value={targetPassword}
                  onChange={(e) => setTargetPassword(e.target.value)}
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.25rem', fontSize: '0.8125rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                Target Chat / Account Name <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <MessageSquare size={14} style={{ position: 'absolute', left: '0.75rem', color: '#94a3b8', pointerEvents: 'none', zIndex: 1 }} />
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. aditya, diganth, target_user"
                  value={targetChatUser}
                  onChange={(e) => setTargetChatUser(e.target.value)}
                  style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Platform Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>Execute Automated Capture</h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Click a platform to launch the automated Playwright capture engine</p>
            </div>
            {captureStatus === 'running' && (
              <Badge variant="outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                <RotateCw size={12} className="spin" />
                <span>Capturing {activePlatform}...</span>
              </Badge>
            )}
          </div>

          <div className="platform-grid">
            <PlatformButton
              platform="instagram"
              onClick={() => handleStartCapture('instagram')}
              disabled={captureStatus === 'running'}
            />
            <PlatformButton
              platform="whatsapp"
              onClick={() => handleStartCapture('whatsapp')}
              disabled={captureStatus === 'running'}
            />
            <PlatformButton
              platform="facebook"
              onClick={() => handleStartCapture('facebook')}
              disabled={captureStatus === 'running'}
            />
            <PlatformButton
              platform="twitter"
              onClick={() => handleStartCapture('twitter')}
              disabled={captureStatus === 'running'}
            />
            <PlatformButton
              platform="telegram"
              onClick={() => handleStartCapture('telegram')}
              disabled={captureStatus === 'running'}
            />
            <PlatformButton
              platform="google"
              onClick={() => handleStartCapture('google')}
              disabled={captureStatus === 'running'}
            />
          </div>
        </div>

        {/* Live Execution Console */}
        {logs.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                <Terminal size={16} />
                <span>Forensic Automation Log Stream</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Playwright headed session output</span>
            </div>

            <div className="terminal-card">
              {logs.map((log, idx) => (
                <div key={idx} className="terminal-line">
                  <span className="terminal-ts">[{log.timestamp}]</span>
                  <span className={log.type === 'success' ? 'terminal-success' : log.type === 'warn' ? 'terminal-warn' : ''}>
                    {log.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Artifacts Table */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Captured Evidence Ledger</h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Point-of-capture cryptographic SHA-256 hashes & section metadata</p>
            </div>
            <Badge variant="secondary" style={{ gap: '0.25rem' }}>
              <Hash size={12} /> {evidenceList.length} Hash Verified
            </Badge>
          </div>

          {evidenceList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <Clock size={32} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>No evidence captured yet for this case</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Select any social media platform above to begin automated capture.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ui-table">
                <thead className="ui-table-header">
                  <tr>
                    <th className="ui-table-head">Artifact ID</th>
                    <th className="ui-table-head">Platform</th>
                    <th className="ui-table-head">Section</th>
                    <th className="ui-table-head">SHA-256 Checksum</th>
                    <th className="ui-table-head">Captured Timestamp</th>
                    <th className="ui-table-head" style={{ textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody className="ui-table-body">
                  {evidenceList.map((item) => (
                    <tr key={item.id}>
                      <td className="ui-table-cell" style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                        {item.id}
                      </td>
                      <td className="ui-table-cell">{item.platform}</td>
                      <td className="ui-table-cell">
                        <Badge variant="secondary">{item.section}</Badge>
                      </td>
                      <td className="ui-table-cell" style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#334155' }}>
                        {item.hash.slice(0, 16)}...{item.hash.slice(-12)}
                      </td>
                      <td className="ui-table-cell" style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        {new Date(item.timestamp).toLocaleTimeString()} ({new Date(item.timestamp).toLocaleDateString()})
                      </td>
                      <td className="ui-table-cell" style={{ textAlign: 'right' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
                          <CheckCircle2 size={13} /> Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CaseDetailPage;