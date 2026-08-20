import React from "react";
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
