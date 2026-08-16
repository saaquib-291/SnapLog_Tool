import React from "react";
import { ShieldCheck, FileCheck2, HardDrive, Hash, Layers } from "lucide-react";
import Navbar from "../components/Navbar";
import Table20 from "../components/Table20";

export default function TableDemoPage() {
  return (
    <div className="app-container">
      <Navbar title="Forensic Evidence Ledger" />

      <main className="page-container">
        <div className="page-header">
          <div className="page-title-group">
            <h1>Master Evidence Ledger</h1>
            <p>Chronological point-of-capture SHA-256 artifacts, platform sweeps, and court-ready metadata.</p>
          </div>
        </div>

        {/* Quick Stat Summary */}
        <div className="stats-grid" style={{ marginBottom: "1.75rem" }}>
          <div className="stat-card">
            <div className="stat-header">
              <span>CAPTURED ARTIFACTS</span>
              <FileCheck2 size={16} style={{ color: "#2563eb" }} />
            </div>
            <div className="stat-value">8</div>
            <div className="stat-caption">Full-page screenshots indexed</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>HASH INTEGRITY</span>
              <Hash size={16} style={{ color: "#10b981" }} />
            </div>
            <div className="stat-value">100%</div>
            <div className="stat-caption">SHA-256 point-of-capture verified</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>ACTIVE PLATFORMS</span>
              <Layers size={16} style={{ color: "#8b5cf6" }} />
            </div>
            <div className="stat-value">5</div>
            <div className="stat-caption">Instagram, WhatsApp, X, TG, Google</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>LEGAL CERTIFICATION</span>
              <ShieldCheck size={16} style={{ color: "#f59e0b" }} />
            </div>
            <div className="stat-value">Sec 65B</div>
            <div className="stat-caption">BSA / IEA Panchnama Ready</div>
          </div>
        </div>

        {/* Master Evidence Table */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Table20 />
        </div>
      </main>
    </div>
  );
}
