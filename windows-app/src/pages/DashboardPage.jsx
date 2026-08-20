import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  FileCheck2,
  Cpu,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import caseService from '../services/caseService';
import Navbar from '../components/Navbar';
import CaseCard from '../components/CaseCard';
import AddCaseModal from '../components/AddCaseModal';
import Table20 from '../components/Table20';
import PlatformButton from '../components/PlatformButton';
import { Button } from '../components/ui/button';

const DashboardPage = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const data = await caseService.getCases();
        setCases(data || []);
      } catch (err) {
        setError('Failed to load cases: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const handleAddCase = async (caseData) => {
    try {
      await caseService.addCase(caseData);
      const updatedCases = await caseService.getCases();
      setCases(updatedCases);
      setShowAddCaseModal(false);
    } catch (err) {
      setError('Failed to add case: ' + err.message);
    }
  };

  const handleDeleteCase = async (caseItem) => {
    const confirmDelete = window.confirm(
      `⚠️ Delete Case Confirmation\n\nAre you sure you want to delete case "${caseItem.title}" (${caseItem.id})?\n\nThis will remove the case and its associated evidence records from the local forensic database.`
    );
    if (!confirmDelete) return;

    try {
      await caseService.deleteCase(caseItem.id);
      const updatedCases = await caseService.getCases();
      setCases(updatedCases);
    } catch (err) {
      alert('Failed to delete case: ' + err.message);
    }
  };

  const handleViewCase = (caseId) => {
    navigate(`/case/${caseId}`);
  };

  const filteredCases = cases.filter(
    (c) =>
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCapturedPlatforms = cases.reduce(
    (acc, curr) => acc + (curr.platforms?.length || 0),
    0
  );

  return (
    <div className="app-container">
      <Navbar
        title="Forensic Dashboard"
        showAddButton={true}
        onAddClick={() => setShowAddCaseModal(true)}
      />

      <main className="page-container">
        {/* Header Title */}
        <div className="page-header">
          <div className="page-title-group">
            <h1>Investigation & Panchnama Cases</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddCaseModal(true)}
              style={{ gap: '0.375rem' }}
            >
              <Plus size={15} />
              <span>Register Case</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span>ACTIVE CASES</span>
              <FolderKanban size={16} style={{ color: '#2563eb' }} />
            </div>
            <div className="stat-value">{cases.length}</div>
            <div className="stat-caption">Registered investigation files</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>CAPTURED PLATFORMS</span>
              <FileCheck2 size={16} style={{ color: '#10b981' }} />
            </div>
            <div className="stat-value">{totalCapturedPlatforms}</div>
            <div className="stat-caption">Completed evidence sweeps</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>SUPPORTED PLATFORMS</span>
              <Layers size={16} style={{ color: '#8b5cf6' }} />
            </div>
            <div className="stat-value">6</div>
            <div className="stat-caption">Instagram, FB, X, WA, TG, Google</div>
          </div>
        </div>

        {/* View Mode Toolbar & Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <input
              type="text"
              placeholder="Search cases, IDs, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="table-input"
              style={{ paddingLeft: '2.25rem', width: '100%' }}
            />
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              style={{ gap: '0.375rem' }}
            >
              <LayoutGrid size={14} />
              <span>Grid View</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              style={{ gap: '0.375rem' }}
            >
              <TableIcon size={14} />
              <span>Table Ledger</span>
            </Button>
          </div>
        </div>

        {/* Content Area */}
        {error && (
          <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>Loading investigation cases...</div>
          </div>
        ) : viewMode === 'grid' ? (
          filteredCases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
              <FolderKanban size={40} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>No cases found</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
                Register a new investigation case to begin capturing evidence.
              </p>
              <Button onClick={() => setShowAddCaseModal(true)}>
                <Plus size={15} style={{ marginRight: '0.375rem' }} />
                Register First Case
              </Button>
            </div>
          ) : (
            <div className="cards-grid">
              {filteredCases.map((caseItem) => (
                <CaseCard
                  key={caseItem.id}
                  case={caseItem}
                  onClick={() => handleViewCase(caseItem.id)}
                  onDelete={handleDeleteCase}
                />
              ))}
            </div>
          )
        ) : (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Case & Evidence Data Ledger</h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Filter, sort, and review case logs with cryptographic hashes</p>
            </div>
            <Table20 />
          </div>
        )}

        <AddCaseModal
          show={showAddCaseModal}
          onClose={() => setShowAddCaseModal(false)}
          onSubmit={handleAddCase}
        />
      </main>
    </div>
  );
};

export default DashboardPage;