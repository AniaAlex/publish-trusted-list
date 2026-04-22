"""Create ETSI-compliant self-signed X.509 cert for LOTL signing.

Mirrors tools/lotl/create_signing_cert.py from wp4-trust-group.

Per ETSI TS 119 612 clause 5.7.1:
- ECDSA P-256, self-signed
- KeyUsage: digitalSignature + nonRepudiation
- ExtendedKeyUsage: id-tsl-kp-tslSigning (0.4.0.2231.3.0)
"""

import argparse
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.x509.oid import ObjectIdentifier

ID_TSL_KP_TSL_SIGNING = ObjectIdentifier("0.4.0.2231.3.0")


def create_lotl_signing_cert(
    scheme_territory: str,
    scheme_operator_name: str,
    output_dir: Path,
    validity_days: int = 365 * 3,
    key_path: Path | None = None,
    cert_path: Path | None = None,
) -> tuple[bytes, bytes]:
    output_dir.mkdir(parents=True, exist_ok=True)

    key = ec.generate_private_key(ec.SECP256R1())
    subject = issuer = x509.Name([
        x509.NameAttribute(x509.oid.NameOID.COUNTRY_NAME, scheme_territory),
        x509.NameAttribute(x509.oid.NameOID.ORGANIZATION_NAME, scheme_operator_name),
    ])

    now = datetime.now(timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now)
        .not_valid_after(now + timedelta(days=validity_days))
        .add_extension(x509.KeyUsage(
            digital_signature=True, content_commitment=True,
            key_encipherment=False, data_encipherment=False, key_agreement=False,
            key_cert_sign=False, crl_sign=False, encipher_only=False, decipher_only=False,
        ), critical=True)
        .add_extension(x509.ExtendedKeyUsage([ID_TSL_KP_TSL_SIGNING]), critical=False)
        .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
        .add_extension(x509.SubjectKeyIdentifier.from_public_key(key.public_key()), critical=False)
        .sign(key, hashes.SHA256())
    )

    key_pem  = key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.TraditionalOpenSSL, serialization.NoEncryption())
    cert_pem = cert.public_bytes(serialization.Encoding.PEM)

    if key_path:
        key_path.write_bytes(key_pem)
    if cert_path:
        cert_path.write_bytes(cert_pem)

    return key_pem, cert_pem


def main() -> int:
    parser = argparse.ArgumentParser(description="Create ETSI TS 119 612 LOTL signing certificate")
    parser.add_argument("--output-dir", "-o", type=Path, default=Path("certs"),
                        help="Output directory (default: certs/)")
    parser.add_argument("--scheme-territory", "-t", default="EU",
                        help="ISO 3166-1 alpha-2 territory (default: EU)")
    parser.add_argument("--scheme-operator-name", "-n", default="WP4 Trust Registry Group",
                        help="Scheme operator name")
    parser.add_argument("--validity-days", type=int, default=365 * 3)
    parser.add_argument("--key-file", default="lotl_signing_key.pem")
    parser.add_argument("--cert-file", default="lotl_signing_cert.pem")
    args = parser.parse_args()

    key_path  = args.output_dir / args.key_file
    cert_path = args.output_dir / args.cert_file

    try:
        _, cert_pem = create_lotl_signing_cert(
            scheme_territory=args.scheme_territory,
            scheme_operator_name=args.scheme_operator_name,
            output_dir=args.output_dir,
            validity_days=args.validity_days,
            key_path=key_path,
            cert_path=cert_path,
        )
    except OSError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    print(f"ETSI TS 119 612 signing certificate created:")
    print(f"  Key:      {key_path}")
    print(f"  Cert:     {cert_path}")
    print(f"  Subject:  C={args.scheme_territory}, O={args.scheme_operator_name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
