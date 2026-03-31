# Schema Gaps in lote-SE.json

Analysis of missing required fields when comparing `lote-SE.json` against the LoTE JSON schema.

---

## Structural Issues

| Issue | Detail |
|-------|--------|
| Missing `LoTE` wrapper | File is a flat object; schema requires `{ "LoTE": { ... } }` |
| Field naming mismatch | Schema uses PascalCase (`SchemeOperatorName`, `ListIssueDateTime`, etc.); file uses camelCase (`schemeOperator`, `issueDate`, etc.) |

---

## `ListAndSchemeInformation` (`schemeInformation` in file)

| Required field | Status |
|----------------|--------|
| `LoTEVersionIdentifier` (integer) | File has `"version": "1.0"` — wrong key and wrong type (string vs integer) |
| `LoTESequenceNumber` | Has `sequenceNumber` — wrong key name |
| `SchemeOperatorName` | Has `schemeOperator` — wrong key name |
| `ListIssueDateTime` | Has `issueDate` — wrong key name |
| `NextUpdate` | Completely absent |

---

## Per Entity — `TrustedEntityInformation`

Applies to all 5 entities.

| Required field | Status |
|----------------|--------|
| `TEName` | Has `entityName` — wrong key name |
| `TEAddress` | Completely absent in all entities |
| `TEInformationURI` | Completely absent in all entities |

---

## Entity `https://verifier.example.com` — Missing Services

| Required field | Status |
|----------------|--------|
| `TrustedEntityServices` | Completely absent — entity has `digitalIdentities` but no `services` array |

The verifier entity only registers its digital identity (DID + X.509 certificate) but declares no services. The schema requires at least one `TrustedEntityService` per entity regardless of entity type. Either a service entry must be added (e.g. a relying party / presentation verification service), or the schema must be relaxed to make `TrustedEntityServices` optional for verifier-type entities.

---

## Per Service — `ServiceInformation`

Applies to all services across all entities.

| Required field | Status |
|----------------|--------|
| `ServiceName` | Has `serviceName` — wrong key name |
| `ServiceDigitalIdentity` | Completely absent in all services |

---

## Summary of Additions Required

Fields that need to be **added** (not just renamed):

- `NextUpdate` in scheme information
- `TEAddress` for every entity
- `TEInformationURI` for every entity
- `services` for the verifier entity (`https://verifier.example.com`)
- `ServiceDigitalIdentity` for every service
