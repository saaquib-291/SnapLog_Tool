import React from 'react';
import { Calendar, User, ArrowRight, CheckCircle2, Clock, UserCheck, Trash2 } from 'lucide-react';
import { Badge } from './ui/table-20-utils/badge';

const CaseCard = ({ case: caseItem, onClick, onDelete }) => {
  const platforms = caseItem.platforms || [];
  const hasPlatforms = platforms.length > 0;

  return (
    <div className="modern-card" onClick={onClick}>
      <div>
        <div className="card-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span className="card-badge-id">{caseItem.id}</span>
            {caseItem.victimName && (
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#2563eb', background: '#eff6ff', border: '1px solid #dbeafe', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                Victim: {caseItem.victimName}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge variant={hasPlatforms ? 'secondary' : 'outline'} style={{ gap: '0.25rem' }}>
              {hasPlatforms ? (
                <>
                  <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                  <span>{platforms.length} Platforms Captured</span>
                </>
              ) : (
                <>
                  <Clock size={12} style={{ color: '#f59e0b' }} />
                  <span>Pending Capture</span>
                </>
              )}
            </Badge>

            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(caseItem);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.25rem 0.375rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.borderColor = '#fca5a5';
                  e.currentTarget.style.background = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'transparent';
                }}
                title="Delete Case"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        <h3 className="card-title">{caseItem.title}</h3>
        <p className="card-desc">{caseItem.description || 'Forensic social media evidence capture workflow for Panchnama documentation.'}</p>

        <div className="card-platform-pills">
          {hasPlatforms ? (
            platforms.map((platform) => (
              <span key={platform} className="platform-pill active">
                {platform}
              </span>
            ))
          ) : (
            <span className="platform-pill" style={{ opacity: 0.7 }}>
              Ready for Capture
            </span>
          )}
        </div>
      </div>

      <div className="card-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <User size={13} />
            {caseItem.examinerId || 'examiner001'}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={13} />
            {new Date(caseItem.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#2563eb', fontWeight: 600, fontSize: '0.8125rem' }}>
          <span>Open Case</span>
          <ArrowRight size={13} />
        </div>
      </div>
    </div>
  );
};

export default CaseCard;