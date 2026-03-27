"""Sign the LoTL JSON with JAdES Compact Baseline B (JWS).

Based on:
  https://github.com/webuild-consortium/wp4-trust-group/blob/eacd574/tools/lotl/jades_signer.py

Usage:
  python sign_json.py

Prerequisites:
  pip install jwcrypto cryptography
  bash generate_test_keys.sh
"""

import base64
import json
from pathlib import Path
from typing import Any

from jwcrypto import jwk, jws
from jwcrypto.common import json_encode

KEYS_DIR   = Path(__file__).parent
OUTPUT_DIR = Path(__file__).parent.parent.parent / "output"

JSON_IN  = OUTPUT_DIR / "list_of_trusted_lists.json"
JSON_OUT = OUTPUT_DIR / "list_of_trusted_lists_signed.json"


def _cert_to_b64(cert_pem: str) -> str:
    """Convert PEM certificate to base64-encoded DER for x5c header."""
    from cryptography import x509
    from cryptography.hazmat.primitives import serialization

    cert = x509.load_pem_x509_certificate(cert_pem.encode())
    return base64.b64encode(cert.public_bytes(serialization.Encoding.DER)).decode("ascii")


def sign_json(payload: dict[str, Any], key_pem: str, cert_pem: str) -> dict[str, Any]:
    key      = jwk.JWK.from_pem(key_pem.encode())
    cert_b64 = _cert_to_b64(cert_pem)

    payload = dict(payload)
    payload.pop("signature", None)

    header = {"alg": "RS256", "x5c": [cert_b64]}

    token = jws.JWS(json_encode(payload))
    token.add_signature(key, None, json_encode(header), None)

    compact = token.serialize(compact=True)
    sig_b64 = compact.split(".")[2]

    payload["signature"] = {
        "protected": header,
        "signature": sig_b64,
        "header": {"x5c": [cert_b64]},
    }
    return payload


def verify_json(payload: dict[str, Any]) -> None:
    sig      = payload["signature"]
    cert_der = base64.b64decode(sig["protected"]["x5c"][0])

    from cryptography import x509
    from cryptography.hazmat.primitives import serialization

    cert     = x509.load_der_x509_certificate(cert_der)
    cert_pem = cert.public_bytes(serialization.Encoding.PEM)
    pub_key  = jwk.JWK.from_pem(cert_pem)

    payload_copy = {k: v for k, v in payload.items() if k != "signature"}

    def b64u(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode().rstrip("=")

    protected_b64 = b64u(json.dumps(sig["protected"], separators=(",", ":")).encode())
    payload_b64   = b64u(json_encode(payload_copy).encode())
    compact       = f"{protected_b64}.{payload_b64}.{sig['signature']}"

    token = jws.JWS()
    token.deserialize(compact)
    token.verify(pub_key)
    print("[verify] Signature valid.")


def main():
    key_pem  = (KEYS_DIR / "test_private_key.pem").read_text()
    cert_pem = (KEYS_DIR / "test_cert.pem").read_text()

    payload = json.loads(JSON_IN.read_text())
    signed  = sign_json(payload, key_pem, cert_pem)

    JSON_OUT.write_text(json.dumps(signed, indent=2))
    print(f"[sign]   Signed JSON written to {JSON_OUT}")

    verify_json(signed)


if __name__ == "__main__":
    main()
