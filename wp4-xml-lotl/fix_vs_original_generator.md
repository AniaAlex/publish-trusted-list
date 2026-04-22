# Fix vs Original xml_generator.py

## What the original does (wp4-trust-group/tools/lotl/xml_generator.py)

For each TL entry, only `entry.tl_url` is written to the output XML:

```python
dist_points = _make_elem("DistributionPoints", scheme_info)
for entry in entries:
    dp = _make_elem("DistributionPoint", dist_points)
    uri_elem = _make_elem("URI", dp)
    uri_elem.text = entry.tl_url   # only primary URL
                                    # entry.tl_url_xml is never used
```

Result — one URI per TL, even when the participant provides both formats:

```xml
<DistributionPoint>
  <URI>https://trust.wp4.sunet.se/pid-providers/sweden.json</URI>
</DistributionPoint>
```

## The problem

The `TLEntry` dataclass carries three URL fields: `tl_url`, `tl_url_json`, and `tl_url_xml`.
The TL entry JSON format explicitly supports `tl_url_xml` so participants can advertise an XML version of their TL alongside the JSON one.
The original generator ignores `tl_url_xml` entirely — it is parsed and stored but never written to the XML output.

## The fix (lotl_xml_tool/xml_generator.py)

Collect both URLs for a TL and emit them as sibling `<URI>` elements inside the same `<DistributionPoint>`:

```python
dist_points = _el(si, "DistributionPoints")
for entry in entries:
    urls = [entry.tl_url]
    if entry.tl_url_xml and entry.tl_url_xml != entry.tl_url:
        urls.append(entry.tl_url_xml)
    dp = _el(dist_points, "DistributionPoint")
    for url in urls:
        _el(dp, "URI", url)
```

Result — both format URLs appear inside one `<DistributionPoint>` for that TL:

```xml
<DistributionPoint>
  <URI>https://trust.wp4.sunet.se/pid-providers/sweden.json</URI>
  <URI>https://trust.wp4.sunet.se/pid-providers/sweden.xml</URI>
</DistributionPoint>
```

## Why this matters

ETSI TS 119 612 allows multiple `<URI>` elements inside one `<DistributionPoint>` for exactly this purpose — a consumer picks whichever format it can process (JSON or XML). Without the fix, a consumer that only handles XML would find no XML URL for TLs that publish both formats, even though the TL entry file contains one.

## Recommendation

Apply the same fix to `wp4-trust-group/tools/lotl/xml_generator.py`.

---

## Known limitation: DistributionPoints vs PointersToOtherTSL

The current implementation puts participant TL URLs in `<DistributionPoints>`, which in ETSI TS 119 612 is actually meant for URLs where **the LOTL itself** can be downloaded.

The correct element for referencing other TLs is `<PointersToOtherTSL>/<OtherTSLPointer>`, which would also carry:
- `<ServiceDigitalIdentities>` — the `trust_anchor` cert for verifying the referenced TL's signature
- `<TSLLocation>` — the TL URL
- `<AdditionalInformation>` — TSLType, SchemeOperatorName, SchemeTerritory

The `trust_anchor` field in each TL entry JSON is therefore currently unused in the XML output.

This is a known simplification, acceptable for the WeBuild prototype. Full TS 119 612 compliance requires migrating to `<PointersToOtherTSL>`.
