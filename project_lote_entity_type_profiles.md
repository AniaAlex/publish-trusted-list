Source: ETSI TS 119 602 v1.1.1, Annexes D–I (normative profiles).
Analysed from ts_119602v010101p.pdf in the g119612 repo.

| Feature | PID Issuers (D) | Wallet Providers (E) | WRPAC (F) | WRPRC (G) | Pub-EAA (H) | Registrars (I) |
|---|---|---|---|---|---|---|
| `ServiceStatus` | **Forbidden** | **Forbidden** | **Forbidden** | **Forbidden** | **Mandatory** (`notified`/`withdrawn`) | **Forbidden** |
| `StatusStartingTime` | Forbidden | Forbidden | Forbidden | Forbidden | Optional | Forbidden |
| `HistoricalInformationPeriod` | Absent | Absent | Absent | Absent | **65535 (permanent)** | Absent |
| `ServiceSupplyPoints` | Optional | Optional | Optional | Optional | Optional | **Mandatory** |
| `ServiceUniqueIdentifier` ext. | No | **Mandatory** (OJ reference) | No | No | No | No |
| `OJ:` legal ref in TETradeName | No | No | No | No | **Mandatory** | No |
| `PointersToOtherLoTE` | Required | Required | Required | Required | **Forbidden** | Required |
| Signature format | JAdES only | JAdES only | JAdES only | JAdES only | **JAdES or XAdES** | JAdES only |
| Permitted `ServiceType` URIs | PID/Issuance, PID/Revocation | WalletSolution/Issuance, WalletSolution/Revocation | WRPAC/Issuance+Revocation | WRPRC/Issuance+Revocation | PubEAA/Issuance+Revocation | Register (single type) |
| Withdrawn entries stay in list | No (removed) | No (removed) | No (removed) | No (removed) | **Yes (permanent history)** | No (removed) |

**"ServiceStatus forbidden"** means presence on the list = trusted, removal = withdrawal (clause 6.6.0 NOTE 1 + each annex table).
Only Pub-EAA keeps withdrawn entries permanently because issuers are public sector bodies with a legal obligation to maintain history.

**g119612 status:** currently writes `entityStatus` and `serviceStatus` for all entity types — non-compliant for all types except Pub-EAA. Profile-specific validation not yet implemented in `generate-lote-per-type`.
