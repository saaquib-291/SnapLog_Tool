// sqlite.js - Air-gapped SQLite database manager for Forensic Evidence Suite
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
const dbPath = path.join(__dirname, '..', '..', 'data', 'forensic.db');
const jsonPath = path.join(__dirname, '..', '..', 'data', 'cases.json');

/**
 * Save in-memory SQLite database state to disk
 */
function persistToDisk() {
  try {
    if (db) {
      const data = db.export();
      const buffer = Buffer.from(data);
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dbPath, buffer);
    }
  } catch (err) {
    console.error('[SQLITE] Error saving forensic.db to disk:', err.message);
  }
}

/**
 * Initialize SQLite database and tables
 */
async function initDatabase() {
  try {
    const SQL = await initSqlJs();

    // Check if existing forensic.db exists on disk
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log(`[SQLITE] Loaded existing database from ${dbPath}`);
    } else {
      db = new SQL.Database();
      console.log('[SQLITE] Created new in-memory SQLite database instance.');
    }

    // Create Forensic Tables
    db.run(`
      CREATE TABLE IF NOT EXISTS examiners (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'Forensic Examiner',
        department TEXT DEFAULT 'Digital Forensics Unit',
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        victim_name TEXT,
        examiner_id TEXT,
        target_platform TEXT,
        platforms TEXT DEFAULT '[]',
        status TEXT DEFAULT 'active',
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS evidence_artifacts (
        id TEXT PRIMARY KEY,
        case_id TEXT,
        platform TEXT NOT NULL,
        section TEXT NOT NULL,
        sequence_number INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        hash_sha256 TEXT NOT NULL,
        source_url_or_screen TEXT,
        captured_at TEXT,
        integrity_status TEXT DEFAULT 'verified'
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp TEXT
      );
    `);

    // Ensure columns exist if upgraded
    try {
      db.run('ALTER TABLE cases ADD COLUMN victim_name TEXT;');
    } catch (_) {}
    try {
      db.run('ALTER TABLE cases ADD COLUMN target_platform TEXT;');
    } catch (_) {}

    // Seed default records if empty
    const stmt = db.prepare('SELECT COUNT(*) as count FROM cases');
    let count = 0;
    if (stmt.step()) {
      count = stmt.getAsObject().count;
    }
    stmt.free();

    if (count === 0) {
      // Seed initial cases from cases.json if available
      let seedCases = [
        {
          id: 'CASE2026-001',
          title: 'Sample Investigation Case',
          description: 'Demo case for Panchnama evidence capture workflow',
          victimName: 'Aarav Mehta',
          examinerId: 'examiner001',
          createdAt: '2026-08-15T10:30:00Z',
          platforms: []
        },
        {
          id: 'CASE2026-002',
          title: 'Cyberbullying Investigation',
          description: 'Investigation into online harassment',
          victimName: 'Pooja Sharma',
          examinerId: 'examiner001',
          createdAt: '2026-08-10T14:15:00Z',
          platforms: ['instagram', 'facebook']
        }
      ];

      if (fs.existsSync(jsonPath)) {
        try {
          const raw = fs.readFileSync(jsonPath, 'utf8');
          seedCases = JSON.parse(raw);
        } catch (_) {}
      }

      for (const c of seedCases) {
        db.run(
          'INSERT OR IGNORE INTO cases (id, title, description, victim_name, examiner_id, platforms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [c.id, c.title, c.description || '', c.victimName || 'Aarav Mehta', c.examinerId || 'examiner001', JSON.stringify(c.platforms || []), c.createdAt || new Date().toISOString()]
        );
      }

      db.run(
        'INSERT OR IGNORE INTO examiners (id, username, email, role, department, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        ['examiner001', 'examiner001', 'examiner001@forensic.gov.in', 'Lead Forensic Examiner', 'Digital Evidence Unit', new Date().toISOString()]
      );

      console.log('[SQLITE] Seeded default forensic cases into SQLite database.');
      persistToDisk();
    }

    return true;
  } catch (error) {
    console.error('[SQLITE] Failed to initialize SQLite database:', error.message);
    return false;
  }
}

/**
 * Get all cases from SQLite
 */
function getAllCases() {
  if (!db) return [];
  try {
    const stmt = db.prepare('SELECT id, title, description, victim_name as victimName, examiner_id as examinerId, target_platform as targetPlatform, platforms, created_at as createdAt FROM cases ORDER BY created_at DESC');
    const cases = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      try {
        row.platforms = JSON.parse(row.platforms || '[]');
      } catch (_) {
        row.platforms = [];
      }
      cases.push(row);
    }
    stmt.free();
    return cases;
  } catch (err) {
    console.error('[SQLITE] Error getting cases:', err.message);
    return [];
  }
}

/**
 * Get case by ID from SQLite
 */
function getCaseById(caseId) {
  if (!db) return null;
  try {
    const stmt = db.prepare('SELECT id, title, description, victim_name as victimName, examiner_id as examinerId, target_platform as targetPlatform, platforms, created_at as createdAt FROM cases WHERE id = ?');
    stmt.bind([caseId]);
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
      try {
        result.platforms = JSON.parse(result.platforms || '[]');
      } catch (_) {
        result.platforms = [];
      }
    }
    stmt.free();
    return result;
  } catch (err) {
    console.error('[SQLITE] Error getting case by ID:', err.message);
    return null;
  }
}

/**
 * Add a new case to SQLite & save to disk (Credentials are NEVER stored)
 */
function addCase(caseData) {
  const newId = `CASE2026-${Date.now().toString().slice(-4)}`;
  const initialPlatforms = caseData.platforms && caseData.platforms.length > 0 
    ? caseData.platforms 
    : (caseData.targetPlatform ? [caseData.targetPlatform] : []);

  const newCase = {
    id: newId,
    title: caseData.title,
    description: caseData.description || '',
    victimName: caseData.victimName || 'Complainant / Anonymous',
    examinerId: caseData.examinerId || 'examiner001',
    targetPlatform: caseData.targetPlatform || '',
    createdAt: new Date().toISOString(),
    platforms: initialPlatforms
  };

  if (db) {
    try {
      db.run(
        'INSERT INTO cases (id, title, description, victim_name, examiner_id, target_platform, platforms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          newCase.id,
          newCase.title,
          newCase.description,
          newCase.victimName,
          newCase.examinerId,
          newCase.targetPlatform,
          JSON.stringify(newCase.platforms),
          newCase.createdAt
        ]
      );
      persistToDisk();
      console.log(`[SQLITE] Saved new case ${newId} (No passwords persisted) to forensic.db`);
    } catch (err) {
      console.error('[SQLITE] Error inserting case:', err.message);
    }
  }

  // Also sync with cases.json backup (sanitized - no credentials)
  try {
    let cases = [];
    if (fs.existsSync(jsonPath)) {
      cases = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }
    // Ensure all existing entries in backup have no passwords
    cases = cases.map(c => {
      const { targetUsername, targetPassword, ...safeCase } = c;
      return safeCase;
    });
    cases.push(newCase);
    fs.writeFileSync(jsonPath, JSON.stringify(cases, null, 2));
  } catch (_) {}

  return newCase;
}

/**
 * Save evidence artifact to SQLite
 */
function saveArtifact(artifact) {
  if (!db) return false;
  try {
    const artifactId = artifact.id || `SCR-${Date.now().toString().slice(-6)}`;
    db.run(`
      INSERT OR REPLACE INTO evidence_artifacts 
      (id, case_id, platform, section, sequence_number, file_path, hash_sha256, source_url_or_screen, captured_at, integrity_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      artifactId,
      artifact.caseId,
      artifact.platform,
      artifact.section,
      artifact.sequenceNumber || 1,
      artifact.filePath,
      artifact.hash,
      artifact.sourceUrlOrScreen || '',
      artifact.timestamp || new Date().toISOString(),
      'verified'
    ]);

    // Update case platform array in SQLite
    const caseItem = getCaseById(artifact.caseId);
    if (caseItem) {
      const platforms = caseItem.platforms || [];
      const platLower = artifact.platform.toLowerCase();
      if (!platforms.includes(platLower)) {
        platforms.push(platLower);
        db.run('UPDATE cases SET platforms = ? WHERE id = ?', [JSON.stringify(platforms), artifact.caseId]);
      }
    }

    persistToDisk();
    console.log(`[SQLITE] Saved evidence artifact ${artifactId} for case ${artifact.caseId} to forensic.db`);
    return true;
  } catch (err) {
    console.error('[SQLITE] Error saving artifact:', err.message);
    return false;
  }
}

/**
 * Delete a case and its associated artifacts from SQLite & disk
 */
function deleteCase(caseId) {
  if (!db) return false;
  try {
    db.run('DELETE FROM cases WHERE id = ?', [caseId]);
    db.run('DELETE FROM evidence_artifacts WHERE case_id = ?', [caseId]);
    db.run('DELETE FROM audit_logs WHERE case_id = ?', [caseId]);
    persistToDisk();

    // Also update cases.json backup
    if (fs.existsSync(jsonPath)) {
      try {
        let cases = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        cases = cases.filter(c => c.id !== caseId);
        fs.writeFileSync(jsonPath, JSON.stringify(cases, null, 2));
      } catch (_) {}
    }

    console.log(`[SQLITE] Successfully deleted case ${caseId} from forensic.db`);
    return true;
  } catch (err) {
    console.error('[SQLITE] Error deleting case:', err.message);
    return false;
  }
}

module.exports = {
  initDatabase,
  getAllCases,
  getCaseById,
  addCase,
  deleteCase,
  saveArtifact,
  dbPath
};
