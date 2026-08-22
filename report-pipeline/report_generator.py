import os
import argparse
import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

# Import local modules
from db_manager import get_evidence_for_case
from metadata_schema import validate_metadata
from hash_utils import verify_hash

def generate_report(case_id, evidence_records, output_path, case_dir=None):
    """
    Generates a PDF report using ReportLab based on the provided evidence records.
    Both Android and Windows use this exact same code to ensure identical PDFs.
    """
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title = Paragraph(f"Forensic Report - Case {case_id}", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 12))

    # Evidence Records
    for idx, record in enumerate(evidence_records):
        # Validate schema
        try:
            validate_metadata(record)
        except Exception as e:
            story.append(Paragraph(f"Evidence #{idx + 1} - [SCHEMA VALIDATION FAILED: {e}]", styles['Heading2']))
            story.append(Spacer(1, 24))
            continue

        story.append(Paragraph(f"Evidence #{idx + 1}", styles['Heading2']))
        story.append(Spacer(1, 6))
        
        # Verify hash
        file_path = record.get("file_path")
        if case_dir and not os.path.isabs(file_path):
            file_path = os.path.join(case_dir, file_path)

        hash_status = "UNVERIFIED"
        expected_hash = record.get("sha256_hash", "")
        if file_path and os.path.exists(file_path):
            if verify_hash(file_path, expected_hash):
                hash_status = "VERIFIED (MATCH)"
            else:
                hash_status = "FAILED (MISMATCH)"
        else:
            hash_status = "FILE NOT FOUND"

        # Metadata Table
        data = [
            ["Screenshot ID", Paragraph(record.get("screenshot_id", ""), styles['Normal'])],
            ["Platform", record.get("platform", "")],
            ["Section", record.get("section", "")],
            ["Timestamp", record.get("timestamp", "")],
            ["Expected Hash", Paragraph(expected_hash, styles['Normal'])],
            ["Hash Verification", hash_status]
        ]
        
        t = Table(data, colWidths=[120, 330])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        # Colorize hash verification result
        if "VERIFIED" in hash_status:
            t.setStyle(TableStyle([('TEXTCOLOR', (1, 5), (1, 5), colors.green)]))
        else:
            t.setStyle(TableStyle([('TEXTCOLOR', (1, 5), (1, 5), colors.red)]))

        story.append(t)
        story.append(Spacer(1, 12))
        
        # Image
        if file_path and os.path.exists(file_path):
            try:
                # Add image scaled to fit width
                img = Image(file_path)
                img.drawHeight = img.drawHeight * (400 / img.drawWidth)
                img.drawWidth = 400
                story.append(img)
            except Exception as e:
                story.append(Paragraph(f"[Error loading image: {e}]", styles['Normal']))
        else:
            story.append(Paragraph("[Image file not found]", styles['Normal']))
            
        story.append(Spacer(1, 24))

    doc.build(story)

def main():
    parser = argparse.ArgumentParser(description="Generate forensic PDF report from case database")
    parser.add_argument("--db", required=True, help="Path to the forensic.db SQLite database")
    parser.add_argument("--case-id", required=True, help="The Case ID to generate the report for")
    parser.add_argument("--output", required=True, help="Output PDF file path")
    parser.add_argument("--case-dir", required=False, help="Base directory for relative image paths")
    
    args = parser.parse_args()

    if not os.path.exists(args.db):
        print(f"Error: Database file not found at {args.db}")
        sys.exit(1)

    print(f"Reading evidence for case {args.case_id} from {args.db}...")
    try:
        evidence = get_evidence_for_case(args.db, args.case_id)
    except Exception as e:
        print(f"Database error: {e}")
        sys.exit(1)

    if not evidence:
        print(f"No evidence found for case ID: {args.case_id}")
        sys.exit(1)

    print(f"Found {len(evidence)} evidence records. Generating PDF...")
    
    try:
        generate_report(args.case_id, evidence, args.output, case_dir=args.case_dir)
        print(f"Report successfully generated at: {os.path.abspath(args.output)}")
    except Exception as e:
        print(f"Report generation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
