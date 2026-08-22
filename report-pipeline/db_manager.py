import sqlite3

def get_evidence_for_case(db_path, case_id):
    """
    Connects to the forensic.db SQLite database and retrieves all evidence
    records for a given case_id.
    """
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    query = """
    SELECT 
        e.id as screenshot_id,
        e.case_id,
        c.examiner_id,
        e.platform,
        e.section,
        e.sequence_number,
        e.captured_at as timestamp,
        e.hash_sha256 as sha256_hash,
        e.file_path,
        e.source_url_or_screen
    FROM evidence_artifacts e
    LEFT JOIN cases c ON e.case_id = c.id
    WHERE e.case_id = ?
    ORDER BY e.sequence_number ASC
    """
    cursor.execute(query, (case_id,))
    rows = cursor.fetchall()
    
    evidence_records = []
    for row in rows:
        record = dict(row)
        # Convert to proper types for schema validation
        record['os'] = 'windows'  # Hardcoded since we are reading from windows DB
        evidence_records.append(record)
        
    conn.close()
    
    return evidence_records
