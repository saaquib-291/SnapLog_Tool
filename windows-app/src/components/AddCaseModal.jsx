import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  FolderPlus,
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Users,
  MessageCircle,
  MessageSquare,
  Send,
  Globe,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { Button } from './ui/table-20-utils/button';

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', color: '#E4405F', icon: Camera, bg: '#fff1f2', border: '#fecdd3' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2', icon: Users, bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'twitter', name: 'Twitter / X', color: '#0f172a', icon: MessageCircle, bg: '#f8fafc', border: '#cbd5e1' },
  { id: 'whatsapp', name: 'WhatsApp', color: '#16a34a', icon: MessageSquare, bg: '#f0fdf4', border: '#bbf7d0' },
  { id: 'telegram', name: 'Telegram', color: '#0284c7', icon: Send, bg: '#f0f9ff', border: '#bae6fd' },
  { id: 'google', name: 'Google', color: '#ea4335', icon: Globe, bg: '#fef2f2', border: '#fecaca' },
];

const AddCaseModal = ({ show, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [victimName, setVictimName] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [targetUsername, setTargetUsername] = useState('');
  const [targetPassword, setTargetPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [description, setDescription] = useState('');
  const [examinerId, setExaminerId] = useState('examiner001');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (show) {
      // Electron Windows fix: explicitly focus input upon modal mount
      const timer = setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const handleClose = () => {
    onClose();
    setTitle('');
    setVictimName('');
    setSelectedPlatform('instagram');
    setTargetUsername('');
    setTargetPassword('');
    setShowPassword(false);
    setDescription('');
    setExaminerId('examiner001');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Case title / FIR Reference is required');
      return;
    }

    setLoading(true);
    const caseData = {
      title: title.trim(),
      victimName: victimName.trim() || 'Complainant / Anonymous',
      targetPlatform: selectedPlatform,
      platforms: selectedPlatform ? [selectedPlatform] : [],
      description: description.trim(),
      examinerId: examinerId.trim() || 'examiner001',
    };

    try {
      await onSubmit(caseData);
      handleClose();
    } catch (err) {
      setError('Failed to add case: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderPlus size={18} style={{ color: '#2563eb' }} />
            <h2>Register New Panchnama Case</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X size={16} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
          <div className="modal-body" style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0, padding: '1.25rem 1.5rem' }}>
            {error && (
              <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            {/* Case Title */}
            <div className="form-group">
              <label className="form-label">Case Title / FIR No. *</label>
              <input
                ref={titleInputRef}
                autoFocus
                className="form-input"
                type="text"
                placeholder="e.g. Cyber Harassment & Extortion Investigation (FIR-2026/089)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Victim Name */}
            <div className="form-group">
              <label className="form-label">Victim / Complainant Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Aarav Mehta / Victim Identity"
                value={victimName}
                onChange={(e) => setVictimName(e.target.value)}
              />
            </div>

            {/* Target Social Media Platform Selector */}
            <div className="form-group">
              <label className="form-label">Target Social Media Platform *</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  marginTop: '0.375rem'
                }}
              >
                {PLATFORMS.map((plat) => {
                  const Icon = plat.icon;
                  const isSelected = selectedPlatform === plat.id;
                  return (
                    <button
                      key={plat.id}
                      type="button"
                      onClick={() => setSelectedPlatform(plat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem 0.75rem',
                        borderRadius: '8px',
                        border: isSelected
                          ? `2px solid ${plat.color}`
                          : '1px solid #e2e8f0',
                        background: isSelected ? plat.bg : '#ffffff',
                        color: isSelected ? '#0f172a' : '#64748b',
                        fontWeight: isSelected ? 600 : 500,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                    >
                      <Icon size={16} style={{ color: plat.color, flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {plat.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2
                          size={13}
                          style={{
                            color: plat.color,
                            marginLeft: 'auto',
                            flexShrink: 0
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Investigation Scope & Notes */}
            <div className="form-group">
              <label className="form-label">Investigation Scope & Notes</label>
              <textarea
                className="form-input"
                placeholder="Brief description of the suspect accounts, target handles, and seizure objectives..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Assigned Examiner ID */}
            <div className="form-group">
              <label className="form-label">Assigned Lead Examiner ID</label>
              <input
                className="form-input"
                type="text"
                value={examinerId}
                onChange={(e) => setExaminerId(e.target.value)}
              />
            </div>

            <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={16} style={{ color: '#10b981', flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                All evidence captured under this case will be cryptographically hashed with SHA-256 and formatted for Section 65B Panchnama certificates.
              </span>
            </div>
          </div>

          <div className="modal-footer" style={{ flexShrink: 0, padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} style={{ gap: '0.375rem', background: '#2563eb', color: '#ffffff' }}>
              <Plus size={15} />
              <span>{loading ? 'Registering Case...' : 'Register Case'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCaseModal;