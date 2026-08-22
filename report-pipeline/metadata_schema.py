import json
import os
from jsonschema import validate, ValidationError

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# The shared metadata schema is in the root shared folder
SCHEMA_PATH = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "shared", "metadata_schema.json"))

def load_schema():
    with open(SCHEMA_PATH, 'r') as f:
        return json.load(f)

def validate_metadata(metadata_record):
    """
    Validates a single metadata record against the shared JSON schema.
    Raises ValidationError if invalid.
    """
    schema = load_schema()
    validate(instance=metadata_record, schema=schema)
    return True
