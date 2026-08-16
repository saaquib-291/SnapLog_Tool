import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, ArrowRight, ShieldAlert, Cpu, Database } from 'lucide-react';
import authService from '../services/authService';
import { Button } from '../components/ui/table-20-utils/button';
import { Badge } from '../components/ui/table-20-utils/badge';

const LoginPage = () => {
  const [username, setUsername] = useState('examiner001');
  const [password, setPassword] = useState('forensics2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await authService.login(username, password);
      if (user) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Authentication failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-hero-wrapper">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '16px',
              background: '#0f172a',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
              marginBottom: '1rem'
            }}
          >
            <ShieldCheck size={28} style={{ color: '#38bdf8' }} />
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Evidence Capture Suite
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
            Dual-Platform Social Media Panchnama Tool
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <Badge variant="secondary" style={{ gap: '0.25rem', fontSize: '0.6875rem' }}>
              <Lock size={10} /> Sec 65B Compliant
            </Badge>
            <Badge variant="secondary" style={{ gap: '0.25rem', fontSize: '0.6875rem' }}>
              <Cpu size={10} /> SHA-256 Hashed
            </Badge>
            <Badge variant="secondary" style={{ gap: '0.25rem', fontSize: '0.6875rem' }}>
              <Database size={10} /> Air-Gapped Local
            </Badge>
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.8125rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Officer / Examiner ID</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. examiner001"
                required
                disabled={loading}
                style={{ paddingLeft: '2.25rem' }}
              />
              <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Security Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                style={{ paddingLeft: '2.25rem' }}
              />
              <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            style={{ width: '100%', height: '2.75rem', marginTop: '0.5rem', gap: '0.5rem', fontSize: '0.9375rem' }}
          >
            <span>{loading ? 'Authenticating Officer...' : 'Authenticate & Enter Suite'}</span>
            <ArrowRight size={16} />
          </Button>
        </form>

        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Authorized Law Enforcement & Cyber Forensic Portal
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;