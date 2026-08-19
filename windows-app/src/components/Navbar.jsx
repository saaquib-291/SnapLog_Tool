import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, FolderGit2, Table2, User, Plus } from 'lucide-react';
import { Button } from './ui/table-20-utils/button';

const Navbar = ({ title, showAddButton = false, onAddClick, showBackButton = false, onBackClick }) => {
  const location = useLocation();

  const isDashboard = location.pathname.includes('/dashboard');
  const isTable = location.pathname.includes('/table');

  return (
    <nav className="app-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link to="/dashboard" className="navbar-brand">
          <div className="brand-icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>
              Forensic<span style={{ color: '#2563eb' }}>Capture</span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 500, lineHeight: 1 }}>
              Panchnama Evidence Suite
            </div>
          </div>
        </Link>

        {showBackButton && (
          <Button variant="outline" size="sm" onClick={onBackClick} style={{ gap: '0.375rem' }}>
            ← Back to Dashboard
          </Button>
        )}

        <div className="navbar-nav">
          <Link to="/dashboard" className={`nav-link ${isDashboard ? 'active' : ''}`}>
            <FolderGit2 size={15} />
            <span>Cases</span>
          </Link>
          <Link to="/table" className={`nav-link ${isTable ? 'active' : ''}`}>
            <Table2 size={15} />
            <span>Evidence Ledger</span>
          </Link>
        </div>
      </div>

      <div className="nav-actions">
        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '50%',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.8125rem',
              border: '2px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'transform 0.15s ease'
            }}
            title="Examiner Profile"
          >
            <User size={15} />
          </div>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;