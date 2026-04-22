"""Centralized configuration — mirrors tools/lotl/settings.py."""

import os
from pathlib import Path

TL_ENTRIES_DIR = os.environ.get("LOTL_TL_ENTRIES_DIR", "tl_entries/")
OUTPUT_DIR     = os.environ.get("LOTL_OUTPUT_DIR", "output/")

SCHEME_OPERATOR_NAME = "WE BUILD WP4 Trust Group"
SCHEME_NAME          = "WP4 List of Trusted Lists"
SCHEME_INFO_URI      = "https://webuild-consortium.github.io/wp4-trust-group/"
SCHEME_TERRITORY     = "EU"

LOTL_XML_FILENAME  = "list_of_trusted_lists.xml"
LOTL_JSON_FILENAME = "list_of_trusted_lists.json"

VALID_TL_TYPES = frozenset([
    "wrpac-provider",
    "wrprc-provider",
    "pub-eaa-provider",
    "pid-provider",
    "qeaa-provider",
    "eaa-provider",
    "wallet-provider",
    "ebwoid-provider",
])

# Maps each TL type to its ETSI LoTE type URI (TS 119 602) or TSL type URI (TS 119 612).
TL_TYPE_TO_REFERENCE_URI = {
    "wrpac-provider":  "http://uri.etsi.org/19602/LoTEType/EUWRPACProvidersList",
    "wrprc-provider":  "http://uri.etsi.org/19602/LoTEType/EUWRPRCProvidersList",
    "pub-eaa-provider":"http://uri.etsi.org/19602/LoTEType/EUPubEAAProvidersList",
    "pid-provider":    "http://uri.etsi.org/19602/LoTEType/EUPIDProvidersList",
    "qeaa-provider":   "http://uri.etsi.org/TrstSvc/TrustedList/TSLType/EUgeneric",
    "eaa-provider":    "http://uri.etsi.org/19602/LoTEType/EUPubEAAProvidersList",
    "wallet-provider": "http://uri.etsi.org/19602/LoTEType/EUWalletProvidersList",
    "ebwoid-provider": "http://uri.etsi.org/19602/LoTEType/EURegistrarsAndRegistersList",
}


def get_schema_path() -> Path:
    return Path(__file__).parent / "schemas" / "tl_entry.json"
