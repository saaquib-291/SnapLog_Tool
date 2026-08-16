// postgres.js - PostgreSQL database connection & query manager for Forensic Evidence Suite
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Connection configuration (Defaults or Environment Variables)
const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'forensic_db',
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 30000,
  max: 10,
};

let pool = null;
let isConnected = false;

/**
 * Initialize PostgreSQL connection pool and create tables if they do not exist
 */
async function initDatabase() {
  try {
    pool = new Pool(dbConfig);

    // Test connection
    const client = await pool.connect();
    isConnected = true;
    console.log(`[POSTGRES] Connected successfully to PostgreSQL at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

    // Create Forensic Schema Tables
    await client.query(`
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
        examiner_id VARCHAR(64),
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
    `);

    // Insert default examiner and sample cases if empty
    const countRes = await client.query('SELECT COUNT(*) FROM cases');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO examiners (id, username, email, role, department)
        VALUES ('examiner001', 'examiner001', 'examiner001@forensic.gov.in', 'Lead Cyber Examiner', 'Digital Evidence Unit')
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO cases (id, title, description, examiner_id, platforms)
        VALUES 
          ('CASE2026-001', 'Sample Investigation Case', 'Demo case for Panchnama evidence capture workflow', 'examiner001', '["instagram"]'::jsonb),
          ('CASE2026-002', 'Cyber Harassment & Radicalization Sweep', 'Investigation into suspicious social media accounts', 'examiner001', '["whatsapp", "facebook"]'::jsonb)
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('[POSTGRES] Seeded default forensic cases into database.');
    }

    client.release();
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`[POSTGRES] Could not connect to PostgreSQL server (${error.message}). Falling back to local JSON/file storage.`);
    return false;
  }
}

/**
 * Get all cases from PostgreSQL (or fallback to JSON)
 */
async function getAllCases() {
  if (isConnected && pool) {
    try {
      const res = await pool.query('SELECT id, title, description, examiner_id as "examinerId", platforms, created_at as "createdAt" FROM cases ORDER BY created_at DESC');
      return res.rows;
    } catch (err) {
      console.error('[POSTGRES] Error fetching cases:', err.message);
    }
  }

  // Fallback to cases.json
  try {
    const jsonPath = path.join(__dirname, '..', '..', 'data', 'cases.json');
    const data = await fs.readFile(jsonPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

/**
 * Get case by ID from PostgreSQL (or fallback to JSON)
 */
async function getCaseById(caseId) {
  if (isConnected && pool) {
    try {
      const res = await pool.query(
        'SELECT id, title, description, examiner_id as "examinerId", platforms, created_at as "createdAt" FROM cases WHERE id = $1',
        [caseId]
      );
      if (res.rows.length > 0) return res.rows[0];
    } catch (err) {
      console.error('[POSTGRES] Error fetching case by ID:', err.message);
    }
  }

  // Fallback to cases.json
  const allCases = await getAllCases();
  return allCases.find((c) => c.id === caseId) || null;
}

/**
 * Add a new case to PostgreSQL (and sync to JSON)
 */
async function addCase(caseData) {
  const newId = `CASE2026-${Date.now().toString().slice(-4)}`;
  const newCase = {
    id: newId,
    title: caseData.title,
    description: caseData.description || '',
    examinerId: caseData.examinerId || 'examiner001',
    createdAt: new Date().toISOString(),
    platforms: []
  };

  if (isConnected && pool) {
    try {
      await pool.query(
        'INSERT INTO cases (id, title, description, examiner_id, platforms, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [newCase.id, newCase.title, newCase.description, newCase.examinerId, JSON.stringify(newCase.platforms), newCase.createdAt]
      );
      console.log(`[POSTGRES] Saved case ${newId} to PostgreSQL table 'cases'.`);
    } catch (err) {
      console.error('[POSTGRES] Error inserting case:', err.message);
    }
  }

  // Always keep local JSON in sync as secondary replica
  try {
    const jsonPath = path.join(__dirname, '..', '..', 'data', 'cases.json');
    let cases = [];
    try {
      const data = await fs.readFile(jsonPath, 'utf8');
      cases = JSON.parse(data);
    } catch (_) {}
    cases.push(newCase);
    await fs.writeFile(jsonPath, JSON.stringify(cases, null, 2));
  } catch (e) {
    console.error('[FILE] Error syncing cases.json:', e.message);
  }

  return newCase;
}

/**
 * Save evidence artifact to PostgreSQL
 */
async function saveArtifact(artifact) {
  if (isConnected && pool) {
    try {
      await pool.query(`
        INSERT INTO evidence_artifacts (id, case_id, platform, section, sequence_number, file_path, hash_sha256, source_url_or_screen, captured_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET hash_sha256 = EXCLUDED.hash_sha256
      `, [
        artifact.id || `SCR-${Date.now().toString().slice(-6)}`,
        artifact.caseId,
        artifact.platform,
        artifact.section,
        artifact.sequenceNumber || 1,
        artifact.filePath,
        artifact.hash,
        artifact.sourceUrlOrScreen || '',
        artifact.timestamp || new Date().toISOString()
      ]);

      // Update case platforms list in DB
      await pool.query(`
        UPDATE cases 
        SET platforms = (
          SELECT jsonb_agg(DISTINCT elem)
          FROM jsonb_array_elements_text(platforms || jsonb_build_array($2::text)) as elem
        )
        WHERE id = $1
      `, [artifact.caseId, artifact.platform.toLowerCase()]);

      console.log(`[POSTGRES] Saved evidence artifact ${artifact.id} for case ${artifact.caseId} to PostgreSQL.`);
      return true;
    } catch (err) {
      console.error('[POSTGRES] Error saving artifact:', err.message);
    }
  }
  return false;
}

module.exports = {
  initDatabase,
  getAllCases,
  getCaseById,
  addCase,
  saveArtifact,
  getIsConnected: () => isConnected,
  dbConfig
};
