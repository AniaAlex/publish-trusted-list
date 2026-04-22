"""Generate LOTL in XML format (ETSI TS 119 612 v2.4.1) — mirrors tools/lotl/xml_generator.py."""

from datetime import datetime, timezone

from lxml import etree

from lotl_xml_tool.settings import (
    SCHEME_INFO_URI,
    SCHEME_NAME,
    SCHEME_OPERATOR_NAME,
    SCHEME_TERRITORY,
)
from lotl_xml_tool.tl_entry import TLEntry

NS_TSL = "http://uri.etsi.org/19612/v2.4.1#"
NS_XSI = "http://www.w3.org/2001/XMLSchema-instance"
NS_XML = "http://www.w3.org/XML/1998/namespace"

_SCHEMA_LOCATION = (
    f"{NS_TSL} "
    "https://forge.etsi.org/rep/esi/x19_612_trusted_lists/-/raw/v2.4.1/19612_xsd.xsd"
)


def _el(parent: etree._Element, tag: str, text: str | None = None) -> etree._Element:
    elem = etree.SubElement(parent, f"{{{NS_TSL}}}{tag}")
    if text is not None:
        elem.text = text
    return elem


def _lang_name(parent: etree._Element, container_tag: str, text: str, lang: str = "en") -> None:
    container = _el(parent, container_tag)
    name = _el(container, "Name", text)
    name.set(f"{{{NS_XML}}}lang", lang)


def _next_update_dt(now: datetime) -> datetime:
    month = now.month + 6
    year = now.year + (month - 1) // 12
    month = (month - 1) % 12 + 1
    return now.replace(year=year, month=month)


def generate_lotl_xml(
    entries: list[TLEntry],
    sequence_number: int = 1,
    operator_name: str = SCHEME_OPERATOR_NAME,
    scheme_name: str = SCHEME_NAME,
    scheme_info_uri: str = SCHEME_INFO_URI,
    territory: str = SCHEME_TERRITORY,
) -> bytes:
    """Return unsigned LOTL XML bytes following ETSI TS 119 612 v2.4.1.

    Root element Id="lotl-1" is required so the XAdES enveloped signature
    can reference it via URI="#lotl-1".
    """
    now = datetime.now(timezone.utc)
    issue_dt   = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    next_dt    = _next_update_dt(now).strftime("%Y-%m-%dT%H:%M:%SZ")

    nsmap = {None: NS_TSL, "xsi": NS_XSI}
    root = etree.Element(f"{{{NS_TSL}}}TrustServiceStatusList", nsmap=nsmap)
    root.set("Id", "lotl-1")
    root.set(f"{{{NS_XSI}}}schemaLocation", _SCHEMA_LOCATION)

    si = _el(root, "SchemeInformation")
    _el(si, "TSLVersionIdentifier", "6")
    _el(si, "TSLSequenceNumber", str(sequence_number))
    _el(si, "TSLType", "http://uri.etsi.org/TrstSvc/TrustedList/TSLType/EUgeneric")

    _lang_name(si, "SchemeOperatorName", operator_name)

    addr = _el(si, "SchemeOperatorAddress")
    postal = _el(addr, "PostalAddresses")
    pa = _el(postal, "PostalAddress")
    _el(pa, "StreetAddress", "N/A")
    _el(pa, "Locality", "N/A")
    _el(pa, "PostalCode", "N/A")
    _el(pa, "CountryName", territory)
    elec = _el(addr, "ElectronicAddress")
    uri_el = _el(elec, "URI", scheme_info_uri)

    _lang_name(si, "SchemeName", scheme_name)

    _el(si, "SchemeInformationURI", scheme_info_uri)
    _el(si, "StatusDeterminationApproach",
        "http://uri.etsi.org/TrstSvc/TrustedList/StatusDetn/EUappropriate")
    _el(si, "SchemeTypeCommunityRules",
        "http://uri.etsi.org/TrstSvc/TrustedList/SchemeTypeCommunityRules/EU")
    _el(si, "SchemeTerritory", territory)
    _el(si, "ListIssueDateTime", issue_dt)
    _el(si, "NextUpdate", next_dt)

    dist_points = _el(si, "DistributionPoints")
    for entry in entries:
        # Collect distinct URLs for this TL (primary + XML version if different).
        urls: list[str] = [entry.tl_url]
        if entry.tl_url_xml and entry.tl_url_xml != entry.tl_url:
            urls.append(entry.tl_url_xml)
        dp = _el(dist_points, "DistributionPoint")
        for url in urls:
            _el(dp, "URI", url)

    return etree.tostring(root, encoding="utf-8", xml_declaration=True, pretty_print=True)
