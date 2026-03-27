"""Sign the LoTL XML with XAdES Baseline B (enveloped signature).

Based on:
  https://github.com/webuild-consortium/wp4-trust-group/blob/eacd574/tools/lotl/xades_signer.py

Usage:
  python sign_xml.py

Prerequisites:
  pip install lxml signxml
  bash generate_test_keys.sh
"""

from pathlib import Path

from lxml import etree
from signxml import XMLSigner, XMLVerifier

KEYS_DIR  = Path(__file__).parent
OUTPUT_DIR = Path(__file__).parent.parent.parent / "output"

XML_IN  = OUTPUT_DIR / "list_of_trusted_lists.xml"
XML_OUT = OUTPUT_DIR / "list_of_trusted_lists_signed.xml"


def sign_xml(xml_content: bytes, key_pem: str, cert_pem: str) -> bytes:
    root = etree.fromstring(xml_content)

    # Required for XAdES enveloped signature reference (URI="#lotl-1")
    if not root.get("Id"):
        root.set("Id", "lotl-1")

    signer = XMLSigner(
        signature_algorithm="rsa-sha256",
        digest_algorithm="sha256",
        c14n_algorithm="http://www.w3.org/2001/10/xml-exc-c14n#",
    )
    signed_root = signer.sign(
        root,
        key=key_pem,
        cert=cert_pem,
        always_add_key_value=False,
    )

    return etree.tostring(
        signed_root,
        encoding="utf-8",
        xml_declaration=True,
        pretty_print=True,
        method="xml",
    )


def verify_xml(xml_content: bytes, cert_pem: str) -> None:
    root = etree.fromstring(xml_content)
    result = XMLVerifier().verify(root, x509_cert=cert_pem, ca_pem_file=str(KEYS_DIR / "test_cert.pem"))
    print(f"[verify] Signature valid. Signed element: {result.signed_xml.tag}")


def main():
    key_pem  = (KEYS_DIR / "test_private_key.pem").read_text()
    cert_pem = (KEYS_DIR / "test_cert.pem").read_text()

    xml_content = XML_IN.read_bytes()
    signed = sign_xml(xml_content, key_pem, cert_pem)

    XML_OUT.write_bytes(signed)
    print(f"[sign]   Signed XML written to {XML_OUT}")

    verify_xml(signed, cert_pem)


if __name__ == "__main__":
    main()
