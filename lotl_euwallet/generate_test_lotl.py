"""Generate a test LOTL (List of Trusted Lists) in JSON format — unsigned, for development/testing.

Based on the structure defined in:
  https://github.com/webuild-consortium/wp4-trust-group/tools/lotl/

Produces:
  output/list_of_trusted_lists.json

Note: For XML generation, use wp4-xml-lotl which correctly implements ETSI TS 119 612.
"""

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

# ---------------------------------------------------------------------------
# Config (mirrors tools/lotl/settings.py)
# ---------------------------------------------------------------------------

TL_TYPE_TO_REFERENCE_URI = {
    "wrpac-provider": "http://uri.etsi.org/19602/LoTEType/EUWRPACProvidersList",
    "wrprc-provider": "http://uri.etsi.org/19602/LoTEType/EUWRPRCProvidersList",
    "pub-eaa-provider": "http://uri.etsi.org/19602/LoTEType/EUPubEAAProvidersList",
    "pid-provider": "http://uri.etsi.org/19602/LoTEType/EUPIDProvidersList",
    "qeaa-provider": "http://uri.etsi.org/TrstSvc/TrustedList/TSLType/EUgeneric",
    "eaa-provider": "http://uri.etsi.org/19602/LoTEType/EUPubEAAProvidersList",
    "wallet-provider": "http://uri.etsi.org/19602/LoTEType/EUWalletProvidersList",
    "ebwoid-provider": "http://uri.etsi.org/19602/LoTEType/EURegistrarsAndRegistersList",
}

# Backward-compatible alias
TL_TYPE_TO_LOTE_URI = TL_TYPE_TO_REFERENCE_URI

LOTE_TAG = "http://uri.etsi.org/19602/LoTETag"

SCHEME_OPERATOR_NAME = "WE BUILD WP4 Trust Group"
SCHEME_NAME = "WP4 List of Trusted Lists"
SCHEME_INFO_URI = "https://webuild-consortium.github.io/wp4-trust-group/"

OUTPUT_DIR = Path("output")

# ---------------------------------------------------------------------------
# Data model (mirrors tools/lotl/tl_entry.py)
# ---------------------------------------------------------------------------


@dataclass
class TLEntry:
    tl_type: str
    participant_id: str
    tl_url: str
    tl_url_xml: Optional[str] = None
    tl_url_json: Optional[str] = None
    trust_anchor: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)

    def get_tl_url_json(self) -> str:
        return self.tl_url_json or self.tl_url

    def get_tl_url_xml(self) -> str:
        return self.tl_url_xml or self.tl_url


# ---------------------------------------------------------------------------
# Test data: one or more participants per TL type
# ---------------------------------------------------------------------------

TEST_ENTRIES: list[TLEntry] = [
    TLEntry(
        tl_type="pid-provider",
        participant_id="italy",
        tl_url="https://trust.example.it/pid_providers.json",
        tl_url_xml="https://trust.example.it/pid_providers.xml",
        tl_url_json="https://trust.example.it/pid_providers.json",
        trust_anchor="-----BEGIN CERTIFICATE-----\nMIIBtestITALY==\n-----END CERTIFICATE-----",
        metadata={"operator_name": "Italian PID Authority", "country": "IT"},
    ),
    TLEntry(
        tl_type="pid-provider",
        participant_id="germany",
        tl_url="https://trust.example.de/pid_providers.json",
        tl_url_xml="https://trust.example.de/pid_providers.xml",
        tl_url_json="https://trust.example.de/pid_providers.json",
        trust_anchor="-----BEGIN CERTIFICATE-----\nMIIBtestGERMANY==\n-----END CERTIFICATE-----",
        metadata={"operator_name": "German PID Authority", "country": "DE"},
    ),
    TLEntry(
        tl_type="wallet-provider",
        participant_id="italy",
        tl_url="https://trust.example.it/wallet_providers.json",
        tl_url_json="https://trust.example.it/wallet_providers.json",
        trust_anchor="-----BEGIN CERTIFICATE-----\nMIIBtestWALLETIT==\n-----END CERTIFICATE-----",
        metadata={"operator_name": "Italian Wallet Authority", "country": "IT"},
    ),
    TLEntry(
        tl_type="wallet-provider",
        participant_id="france",
        tl_url="https://trust.example.fr/wallet_providers.json",
        tl_url_json="https://trust.example.fr/wallet_providers.json",
        trust_anchor="-----BEGIN CERTIFICATE-----\nMIIBtestWALLETFR==\n-----END CERTIFICATE-----",
        metadata={"operator_name": "French Wallet Authority", "country": "FR"},
    ),
    TLEntry(
        tl_type="wrpac-provider",
        participant_id="eu-central",
        tl_url="https://trust.example.eu/wrpac_providers.json",
        trust_anchor="-----BEGIN CERTIFICATE-----\nMIIBtestWRPAC==\n-----END CERTIFICATE-----",
        metadata={"operator_name": "EU WRPAC Authority", "country": "EU"},
    ),
    TLEntry(
        tl_type="wrprc-provider",
        participant_id="eu-central",
        tl_url="https://trust.example.eu/wrprc_providers.json",
        trust_anchor="-----BEGIN CERTIFICATE-----\nMIIBtestWRPRC==\n-----END CERTIFICATE-----",
        metadata={"operator_name": "EU WRPRC Authority", "country": "EU"},
    ),
    TLEntry(
        tl_type="pub-eaa-provider",
        participant_id="spain",
        tl_url="https://trust.example.es/pub_eaa_providers.json",
        trust_anchor="-----BEGIN CERTIFICATE-----\nMIIBtestPUBEAAES==\n-----END CERTIFICATE-----",
        metadata={"operator_name": "Spanish Pub-EAA Authority", "country": "ES"},
    ),
    TLEntry(
        tl_type="ebwoid-provider",
        participant_id="eu-central",
        tl_url="https://trust.example.eu/ebwoid_providers.json",
        trust_anchor="-----BEGIN CERTIFICATE-----\nMIIBtestEBWOID==\n-----END CERTIFICATE-----",
        metadata={"operator_name": "EU EBWOID Registry", "country": "EU"},
    ),
]


# ---------------------------------------------------------------------------
# JSON generator (mirrors tools/lotl/json_generator.py)
# ---------------------------------------------------------------------------


def generate_lotl_json(
    entries: list[TLEntry], sequence_number: int = 1
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    issue_dt = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    next_month = now.month + 6
    next_year = now.year + (next_month - 1) // 12
    next_month = ((next_month - 1) % 12) + 1
    next_update = now.replace(year=next_year, month=next_month).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )

    distribution_points: list[dict[str, Any]] = []
    for entry in entries:
        dist: dict[str, Any] = {
            "tlType": entry.tl_type,
            "referencedListTypeUri": TL_TYPE_TO_REFERENCE_URI[entry.tl_type],
            "participantId": entry.participant_id,
            "tlUrl": entry.tl_url,
            "tlUrlJson": entry.get_tl_url_json(),
            "tlUrlXml": entry.get_tl_url_xml(),
        }
        if entry.metadata:
            dist["metadata"] = entry.metadata
        distribution_points.append(dist)

    scheme_info: dict[str, Any] = {
        "loteVersionIdentifier": 1,
        "loteSequenceNumber": sequence_number,
        "loteType": "http://uri.etsi.org/TrstSvc/TrustedList/TSLType/EUgeneric",
        "schemeOperatorName": [{"lang": "en", "value": SCHEME_OPERATOR_NAME}],
        "schemeOperatorAddress": {
            "postalAddresses": [],
            "electronicAddress": [{"lang": "en", "uri": SCHEME_INFO_URI}],
        },
        "schemeName": [{"lang": "en", "value": SCHEME_NAME}],
        "schemeInformationURI": [{"lang": "en", "uri": SCHEME_INFO_URI}],
        "statusDeterminationApproach": (
            "http://uri.etsi.org/TrstSvc/TrustedList/StatusDetn/EUappropriate"
        ),
        "schemeTypeCommunityRules": [],
        "schemeTerritory": "EU",
        "listIssueDateTime": issue_dt,
        "nextUpdate": next_update,
        "distributionPoints": distribution_points,
    }

    return {"loteTag": LOTE_TAG, "schemeInformation": scheme_info}



# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    entries = TEST_ENTRIES
    sequence = 1

    # --- JSON ---
    lotl_json = generate_lotl_json(entries, sequence_number=sequence)
    json_path = OUTPUT_DIR / "list_of_trusted_lists.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(lotl_json, f, indent=2)
    print(f"[JSON] Written to {json_path}")
    print(
        f"       {len(lotl_json['schemeInformation']['distributionPoints'])} distribution points"
    )

    # Also write dated version
    json_dated_path = OUTPUT_DIR / "lotl_updated_22042026.json"
    with open(json_dated_path, "w", encoding="utf-8") as f:
        json.dump(lotl_json, f, indent=2)
    print(f"[JSON] Written to {json_dated_path}")

    # --- Summary ---
    print()
    print("Entries by type:")
    by_type: dict[str, list[str]] = {}
    for e in entries:
        by_type.setdefault(e.tl_type, []).append(e.participant_id)
    for tl_type, participants in sorted(by_type.items()):
        print(f"  {tl_type}: {', '.join(participants)}")


if __name__ == "__main__":
    main()
