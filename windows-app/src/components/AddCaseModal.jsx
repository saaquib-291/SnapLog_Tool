import React, { useState } from 'react';
import { X, Plus, FolderPlus, Shield, User } from 'lucide-react';
import { Button } from './ui/table-20-utils/button';

const AddCaseModal = ({ show, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [victimName, setVictimName] = useState('');
  const [description, setDescription] = useState('');
  const [examinerId, setExaminerId] = useState('examiner001');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    onClose();
    setTitle('');
    setVictimName('');
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

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Case Title / FIR No. *</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Cyber Harassment & Extortion Investigation (FIR-2026/089)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

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

            <div className="form-group">
              <label className="form-label">Investigation Scope & Notes</label>
              <textarea
                className="form-input"
                placeholder="Brief description of the suspect accounts, target handles, and seizure objectives..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

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

          <div className="modal-footer">
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} style={{ gap: '0.375rem' }}>
              <Plus size={15} />
              <span>{loading ? 'Creating Case...' : 'Create Case'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCaseModal;