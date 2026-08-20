import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Award,
  Key,
  Calendar,
  LogOut,
  Building,
  CheckCircle2,
  HardDrive,
  FileSpreadsheet
} from 'lucide-react';
import authService from '../services/authService';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await authService.getCurrentUser();
        // Handle both direct object or { user: ... }
        setUser(userData?.user || userData);
      } catch (err) {
        setError('Failed to load profile: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (err) {
      setError('Logout failed: ' + err.message);
    }
  };

  return (
    <div className="app-container">
      <Navbar title="Examiner Profile" showBackButton={true} onBackClick={() => navigate('/dashboard')} />

      <main className="page-container" style={{ maxWidth: '800px' }}>
        {error && (
          <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '4.5rem',
                height: '4.5rem',
                borderRadius: '50%',
                background: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 700,
                border: '3px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
              }}
            >
              {user?.username ? user.username.charAt(0).toUpperCase() : 'E'}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                  {user?.username || 'Officer / Examiner 001'}
                </h1>
                <Badge variant="secondary" style={{ gap: '0.25rem' }}>
                  <ShieldCheck size={12} style={{ color: '#10b981' }} /> Active Officer
                </Badge>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                {user?.email || 'examiner001@forensic.gov.in'} • Digital Forensics & Cyber Evidence Unit
              </p>
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout} style={{ gap: '0.375rem', color: '#dc2626' }}>
              <LogOut size={14} />
              <span>Logout</span>
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>OFFICER BADGE ID</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', marginTop: '0.25rem' }}>
                {user?.id || 'EXAM-2026-001'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DEPARTMENT / AGENCY</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', marginTop: '0.25rem' }}>
                {user?.department || 'Digital Forensics & Cybercrime Unit'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CLEARANCE LEVEL</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#10b981', marginTop: '0.25rem' }}>
                Forensic Examiner Level 3
              </div>
            </div>
          </div>
        </div>

        {/* Security & Verification Credentials */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.25rem' }}>
            Forensic Integrity & Compliance
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Key size={18} style={{ color: '#2563eb' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>Local Cryptographic Keystore</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Hardware-bound local key for SHA-256 evidence signing</div>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={13} /> Active
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Award size={18} style={{ color: '#f59e0b' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>Section 65B BSA Certificate Generator</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Automated Indian Evidence Act documentary certificate template</div>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={13} /> Enabled
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <HardDrive size={18} style={{ color: '#8b5cf6' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>Air-Gapped Local Database</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SQLite on-device evidence database — 0% cloud transmission</div>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={13} /> Secure
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;