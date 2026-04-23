# Removal Conditions by Entity Type (ETSI TS 119 602 v1.1.1)

This document describes when entities and services are removed from Lists of Trusted Entities (LoTE) based on their profile type.

## Summary Table

| Entity Type | What Gets Removed | Removal Condition | Citation |
|-------------|-------------------|-------------------|----------|
| **PID Issuer** | Entire entity | "When a listed body is not responsible for this issuance and revocation process, **it shall be removed from the list**." | Annex D, Table D.3, p. 49 |
| **Wallet Provider** | Service first, then entity | "When the certification of a wallet solution is withdrawn or expired, the **corresponding entry... shall be removed** from the TE service entries under the wallet provider. When no more certified wallet solutions are listed under a wallet provider, **the wallet provider entry itself shall be removed from the list**." | Annex E, Table E.3, p. 53 |
| **WRPAC Provider** | Entire entity | "When a listed WRPAC provider **does not have that mandate anymore**, it shall be removed from the list." | Annex F, Table F.3, p. 57 |
| **WRPRC Provider** | Entire entity | "When a listed WRPRC provider **does not have that mandate anymore**, it shall be removed from the list." | Annex G, Table G.3, p. 61 |
| **Pub-EAA Provider** | Nothing removed | "When the listed entity is not to be considered as a provider... all services listed under the corresponding trusted entity entry **shall have their current status set to** `http://uri.etsi.org/19602/PubEAAProvidersList/SvcStatus/withdrawn`" | Annex H, Table H.3, p. 65 |
| **Registrar** | Entire entity | "When a listed registrar **does not have that mandate anymore**, it shall be removed from the list." | Annex I, Table I.3, p. 69 |

## Key Differences

### Profiles with Implicit Trust (ServiceStatus Forbidden)

For **PID, Wallet, WRPAC, WRPRC, and Registrars**:
- `ServiceStatus` field is **forbidden** ("shall not be used")
- **Presence in the list = trusted**
- When trust is withdrawn → entity/service is **removed** from the list

### Pub-EAA Profile (ServiceStatus Mandatory)

For **Pub-EAA** only:
- `ServiceStatus` field is **mandatory**
- Status values: `notified` (trusted) or `withdrawn` (not trusted)
- `HistoricalInformationPeriod = 65535` (permanent history)
- Withdrawn entities **stay in the list** with status `withdrawn`
- Required for historical validation of attestations

## Source

**ETSI TS 119 602 V1.1.1 (2025-11)**
*Electronic Signatures and Trust Infrastructures (ESI); Lists of trusted entities; Data model*
