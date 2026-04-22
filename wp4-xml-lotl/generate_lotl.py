#!/usr/bin/env python3
"""Generate a signed LOTL XML (ETSI TS 119 612) from tl_entries/ directory.

Usage:
  # With signing key/cert files:
  python generate_lotl.py \
      --tl-entries-dir tl_entries \
      --output-dir output \
      --signing-key certs/lotl_signing_key.pem \
      --signing-cert certs/lotl_signing_cert.pem

  # Unsigned (no key/cert):
  python generate_lotl.py --tl-entries-dir tl_entries --output-dir output

  # Via environment variables:
  export LOTL_SIGNING_KEY=$(cat certs/lotl_signing_key.pem)
  export LOTL_SIGNING_CERT=$(cat certs/lotl_signing_cert.pem)
  python generate_lotl.py
"""

import argparse
import os
import sys
from pathlib import Path

from lotl_xml_tool.collector import collect_entries, validate_entries
from lotl_xml_tool.settings import LOTL_XML_FILENAME, OUTPUT_DIR, TL_ENTRIES_DIR
from lotl_xml_tool.xml_generator import generate_lotl_xml


def get_sequence_number(output_dir: Path) -> int:
    """Read current sequence number from existing LOTL XML, increment by 1."""
    xml_path = output_dir / LOTL_XML_FILENAME
    if not xml_path.exists():
        return 1
    try:
        from lxml import etree
        NS = "http://uri.etsi.org/19612/v2.4.1#"
        tree = etree.parse(str(xml_path))
        el = tree.find(f".//{{{NS}}}TSLSequenceNumber")
        if el is not None and el.text:
            return int(el.text) + 1
    except Exception:
        pass
    return 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate signed LOTL XML (TS 119 612)")
    parser.add_argument("--tl-entries-dir", default=TL_ENTRIES_DIR,
                        help=f"TL entries root directory (default: {TL_ENTRIES_DIR})")
    parser.add_argument("--output-dir", default=OUTPUT_DIR,
                        help=f"Output directory (default: {OUTPUT_DIR})")
    parser.add_argument("--signing-key",  default=None,
                        help="Path to signing private key PEM (or set LOTL_SIGNING_KEY env)")
    parser.add_argument("--signing-cert", default=None,
                        help="Path to signing certificate PEM (or set LOTL_SIGNING_CERT env)")
    parser.add_argument("--sequence-number", type=int, default=None,
                        help="Override sequence number (auto-increments from existing LOTL if omitted)")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # --- Collect TL entries ---
    print(f"Collecting TL entries from: {args.tl_entries_dir}")
    try:
        entries = collect_entries(args.tl_entries_dir)
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    if not entries:
        print("No TL entries found — nothing to generate.", file=sys.stderr)
        return 1

    errors = validate_entries(entries)
    if errors:
        print("Validation errors:", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    by_type: dict[str, list[str]] = {}
    for e in entries:
        by_type.setdefault(e.tl_type, []).append(e.participant_id)
    print(f"Found {len(entries)} entries:")
    for tl_type, participants in sorted(by_type.items()):
        print(f"  {tl_type}: {', '.join(participants)}")

    # --- Sequence number ---
    seq = args.sequence_number or get_sequence_number(output_dir)
    print(f"Sequence number: {seq}")

    # --- Generate unsigned XML ---
    xml_bytes = generate_lotl_xml(entries, sequence_number=seq)

    # --- Sign if key/cert provided ---
    key_pem  = args.signing_key  or os.environ.get("LOTL_SIGNING_KEY", "")
    cert_pem = args.signing_cert or os.environ.get("LOTL_SIGNING_CERT", "")

    if key_pem and cert_pem:
        try:
            from lotl_xml_tool.xades_signer import sign_xml
            print("Signing with XAdES Baseline B...")
            xml_bytes = sign_xml(xml_bytes, key_pem=key_pem, cert_pem=cert_pem)
            print("Signature applied.")
        except ImportError:
            print("Warning: signxml not installed — writing unsigned XML.", file=sys.stderr)
    else:
        print("No signing key/cert — writing unsigned XML.")

    # --- Write output ---
    xml_path = output_dir / LOTL_XML_FILENAME
    xml_path.write_bytes(xml_bytes)
    print(f"\nOutput: {xml_path} ({len(xml_bytes):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
