"""Scan tl_entries/ directory and load TLEntry objects — mirrors tools/lotl/collector.py."""

import json
from pathlib import Path
from typing import Optional

from lotl_xml_tool.settings import VALID_TL_TYPES
from lotl_xml_tool.tl_entry import TLEntry


def collect_entries(tl_entries_dir: str | Path) -> list[TLEntry]:
    """Walk tl_entries/{tl_type}/*.json and return a list of TLEntry objects."""
    root = Path(tl_entries_dir)
    if not root.is_dir():
        raise FileNotFoundError(f"TL entries directory not found: {root}")

    entries: list[TLEntry] = []
    for type_dir in sorted(root.iterdir()):
        if not type_dir.is_dir():
            continue
        tl_type = type_dir.name
        if tl_type not in VALID_TL_TYPES:
            print(f"  [warn] Unknown TL type directory: {tl_type} — skipping")
            continue
        for json_file in sorted(type_dir.glob("*.json")):
            try:
                data = json.loads(json_file.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError) as e:
                print(f"  [warn] Cannot read {json_file}: {e}")
                continue
            if "tl_url" not in data:
                print(f"  [warn] Missing tl_url in {json_file} — skipping")
                continue
            participant_id = json_file.stem
            entry = TLEntry.from_dict(data, tl_type=tl_type, participant_id=participant_id, source_path=json_file)
            entries.append(entry)
    return entries


def validate_entries(entries: list[TLEntry]) -> list[str]:
    """Return a list of validation error strings (empty means all OK)."""
    errors: list[str] = []
    for e in entries:
        if not e.tl_url:
            errors.append(f"{e.participant_id}/{e.tl_type}: tl_url is empty")
        if not e.trust_anchor:
            errors.append(f"{e.participant_id}/{e.tl_type}: trust_anchor is missing")
        elif "BEGIN CERTIFICATE" not in e.trust_anchor:
            errors.append(f"{e.participant_id}/{e.tl_type}: trust_anchor does not look like PEM")
    return errors
