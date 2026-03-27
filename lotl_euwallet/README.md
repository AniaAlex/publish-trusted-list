# lotl_euwallet

Generates a test (unsigned) List of Trusted Lists (LoTL) in JSON and XML format.

Source: [`webuild-consortium/wp4-trust-group @ eacd574`](https://github.com/webuild-consortium/wp4-trust-group/commit/eacd574ff1f1660927b788c29a7c5cb43e32bf34)

Reference repository: https://github.com/webuild-consortium/wp4-trust-group

---

## Usage

```bash
make lotl
```

Output is written to `output/`:
- `output/list_of_trusted_lists.json`
- `output/list_of_trusted_lists.xml`

---

## Tools in upstream `tools/lotl/`

### Core modules

| File | Purpose |
|---|---|
| `settings.py` | Centralized config: paths, valid TL types, `TL_TYPE_TO_LOTE_URI` mapping, output filenames |
| `tl_entry.py` | `TLEntry` dataclass — data model for a single participant TL entry; includes `from_dict()` factory |
| `json_generator.py` | Generates unsigned LoTL JSON (TS 119 602 LoTE structure) |
| `xml_generator.py` | Generates unsigned LoTL XML (ETSI TS 119 612 v2.4.1) |
| `jades_signer.py` | Signs LoTL JSON with JAdES Compact Baseline B |
| `xades_signer.py` | Signs LoTL XML with XAdES Baseline B (enveloped) |
| `collector.py` | Reads `lotl/tl_entries/<tl_type>/<participant_id>.json` files and validates them |
| `tl_validator.py` | Validates a single TL entry dict against `schemas/tl_entry.json` |
| `validator.py` | Validates TL signatures (fetches remote TLs and checks against trust anchors) |
| `producer.py` | Orchestrates the full pipeline: collect → validate → generate → sign → write |
| `cli.py` | CLI entry point (`python -m tools.lotl`) |
| `log.py` | Logging configuration |
| `__init__.py` | Package init |
| `__main__.py` | Allows `python -m tools.lotl` invocation |

### Schema

| File | Purpose |
|---|---|
| `schemas/tl_entry.json` | JSON Schema (Draft-07) for a TL entry file — requires `tl_url` and `trust_anchor` |

### TL entry directories

```
lotl/tl_entries/
├── eaa-provider/
├── ebwoid-provider/
├── pid-provider/
├── pub-eaa-provider/
├── qeaa-provider/
├── wallet-provider/
├── wrpac-provider/
└── wrprc-provider/
```

Each directory holds one JSON file per participant: `<participant_id>.json`.

### CI/CD

| File | Purpose |
|---|---|
| `.github/workflows/lotl-ci.yml` | GitHub Actions: runs pytest with coverage on every push |
| `pytest.ini` | Pytest config, 90% coverage threshold |
| `.coveragerc` | Coverage config scoped to `tools/lotl` |
| `requirements-dev.txt` | Dev dependencies: `lxml`, `signxml`, `jwcrypto`, `cryptography` |

---

## What `generate_test_lotl.py` inlines

`generate_test_lotl.py` is a self-contained version that mirrors the upstream tools without importing them:

| Upstream file | Mirrored as |
|---|---|
| `settings.py` | Module-level constants (`TL_TYPE_TO_LOTE_URI`, `SCHEME_*`, `OUTPUT_DIR`) |
| `tl_entry.py` | `TLEntry` dataclass (minus `source_path` and `from_dict()`) |
| `json_generator.py` | `generate_lotl_json()` — also fixes upstream bug in 6-month date rollover |
| `xml_generator.py` | `generate_lotl_xml()` — simplified; no signing hooks, no schemaLocation |

Signing (`jades_signer.py`, `xades_signer.py`), validation (`validator.py`, `tl_validator.py`), collection (`collector.py`), and the CLI are intentionally omitted — this script is for development/test use only.
