"""XAdES Baseline B signing for LOTL XML — mirrors tools/lotl/xades_signer.py."""

from pathlib import Path
from typing import Union

from lxml import etree
from signxml import XMLSigner, XMLVerifier


def sign_xml(
    xml_content: bytes,
    key_pem: Union[bytes, str, Path],
    cert_pem: Union[bytes, str, Path],
) -> bytes:
    """Sign XML bytes with XAdES Baseline B (enveloped signature).

    The root element must have Id="lotl-1" so the signature references it.
    """
    def _load(val: Union[bytes, str, Path]) -> str:
        if isinstance(val, Path):
            return val.read_text()
        if isinstance(val, bytes):
            return val.decode("utf-8")
        if not val.strip().startswith("-----") and Path(val).exists():
            return Path(val).read_text()
        return val

    key_str  = _load(key_pem)
    cert_str = _load(cert_pem)

    # Detect key type to pick the right signature algorithm.
    # signxml requires matching algorithm strings for RSA vs ECDSA.
    sig_alg = "ecdsa-sha256" if ("EC PRIVATE" in key_str or "BEGIN EC" in key_str) else "rsa-sha256"

    root = etree.fromstring(xml_content)
    signer = XMLSigner(
        signature_algorithm=sig_alg,
        digest_algorithm="sha256",
        c14n_algorithm="http://www.w3.org/2001/10/xml-exc-c14n#",
    )
    signed_root = signer.sign(root, key=key_str, cert=cert_str, always_add_key_value=False)
    return etree.tostring(signed_root, encoding="utf-8", xml_declaration=True, pretty_print=True)


def verify_xml(
    xml_content: bytes,
    cert_pem: Union[bytes, str, Path, None] = None,
    ca_pem_file: Union[str, Path, None] = None,
) -> bytes:
    """Verify XAdES signature. Returns verified signed XML bytes."""
    root = etree.fromstring(xml_content)
    verifier = XMLVerifier()
    kwargs: dict = {}
    if cert_pem is not None:
        if isinstance(cert_pem, Path):
            cert_pem = cert_pem.read_text()
        elif isinstance(cert_pem, bytes):
            cert_pem = cert_pem.decode("utf-8")
        kwargs["x509_cert"] = cert_pem
    if ca_pem_file is not None:
        kwargs["ca_pem_file"] = str(ca_pem_file)
    result = verifier.verify(root, **kwargs)
    return etree.tostring(result.signed_xml, encoding="utf-8", xml_declaration=True, pretty_print=True)
