-- PostgreSQL Schema for Dual-Platform Social Media Forensic Evidence Suite
-- Database: forensic_db

CREATE TABLE IF NOT EXISTS examiners (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(128) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(128) DEFAULT 'Forensic Examiner',
    department VARCHAR(255) DEFAULT 'Digital Forensics Unit',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cases (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    examiner_id VARCHAR(64) REFERENCES examiners(id) ON DELETE SET NULL,
    platforms JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(64) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence_artifacts (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) REFERENCES cases(id) ON DELETE CASCADE,
    platform VARCHAR(64) NOT NULL,
    section VARCHAR(128) NOT NULL,
    sequence_number INT NOT NULL,
    file_path TEXT NOT NULL,
    hash_sha256 VARCHAR(64) NOT NULL,
    source_url_or_screen TEXT,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    integrity_status VARCHAR(32) DEFAULT 'verified'
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR(64),
    action VARCHAR(128) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for high-performance forensic querying
CREATE INDEX IF NOT EXISTS idx_cases_examiner ON cases(examiner_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_case ON evidence_artifacts(case_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_platform ON evidence_artifacts(platform);
CREATE INDEX IF NOT EXISTS idx_artifacts_hash ON evidence_artifacts(hash_sha256);
