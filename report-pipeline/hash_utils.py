import hashlib

def calculate_sha256(file_path):
    """
    Calculates the SHA-256 hash of a file.
    """
    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except Exception as e:
        return None

def verify_hash(file_path, expected_hash):
    """
    Verifies that the file at file_path has the expected SHA-256 hash.
    """
    calculated = calculate_sha256(file_path)
    if calculated is None:
        return False
    return calculated.lower() == expected_hash.lower()
