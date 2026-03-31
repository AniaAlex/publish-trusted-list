# LoTE Types

Based on ETSI TS 119 602 V1.1.1 (2025-11), Annex C.

---

## Overview

A LoTE (List of Trusted Entities) is typed via the `LoTEType` field in `ListAndSchemeInformation`.
Each type corresponds to a distinct category of trusted entities notified by Member States under EU legislation.

The EU Commission publishes one EU-level LoTE per type, aggregating notifications from all Member States.
Member States should mirror this by publishing one national LoTE per type.

---

## Registered LoTE Type URIs

All URIs are registered under the radix `http://uri.etsi.org/19602/`.

| LoTE Type | URI | Description |
|-----------|-----|-------------|
| PID Providers | `http://uri.etsi.org/19602/LoTEType/EUPIDProvidersList` | Providers of person identity data notified by Member States under applicable EU legislation |
| Wallet Providers | `http://uri.etsi.org/19602/LoTEType/EUWalletProvidersList` | Wallet providers notified by Member States under applicable EU legislation |
| WRPAC Providers | `http://uri.etsi.org/19602/LoTEType/EUWRPACProvidersList` | Providers of wallet relying party access certificates notified by Member States |
| WRPRC Providers | `http://uri.etsi.org/19602/LoTEType/EUWRPRCProvidersList` | Providers of wallet relying party registration certificates notified by Member States |
| Public EAA Providers | `http://uri.etsi.org/19602/LoTEType/EUPubEAAProvidersList` | Public sector bodies issuing electronic attestation of attributes notified by Member States |
| Registrars and Registers | `http://uri.etsi.org/19602/LoTEType/EURegistrarsAndRegistersList` | Registrars and registers notified by Member States |

---

## Associated URIs per Type

Each LoTE type has corresponding registered URIs for `StatusDeterminationApproach` and `SchemeTypeCommunityRules`.

### PID Providers
- **StatusDeterminationApproach:** `http://uri.etsi.org/19602/PIDProvidersList/StatusDetn/EU`
- **SchemeTypeCommunityRules:** `http://uri.etsi.org/19602/PIDProviders/schemerules/EU`

### Wallet Providers
- **StatusDeterminationApproach:** `http://uri.etsi.org/19602/WalletProvidersList/StatusDetn/EU`
- **SchemeTypeCommunityRules:** `http://uri.etsi.org/19602/WalletProvidersList/schemerules/EU`

### WRPAC Providers
- **StatusDeterminationApproach:** `http://uri.etsi.org/19602/WRPACProvidersList/StatusDetn/EU`
- **SchemeTypeCommunityRules:** `http://uri.etsi.org/19602/WRPACProvidersList/schemerules/EU`

### WRPRC Providers
- **StatusDeterminationApproach:** `http://uri.etsi.org/19602/WRPRCrovidersList/StatusDetn/EU`
- **SchemeTypeCommunityRules:** `http://uri.etsi.org/19602/WRPRCProvidersList/schemerules/EU`

### Public EAA Providers
- **StatusDeterminationApproach:** `http://uri.etsi.org/19602/PubEAAProvidersList/StatusDetn/EU`
- **SchemeTypeCommunityRules:** `http://uri.etsi.org/19602/PubEAAProvidersList/schemerules/EU`

### Registrars and Registers
- **StatusDeterminationApproach:** `http://uri.etsi.org/19602/RegistrarsAndRegistersList/StatusDetn/EU`
- **SchemeTypeCommunityRules:** `http://uri.etsi.org/19602/RegistrarsAndRegistersList/schemerules/EU`

---

## Recommended Per-Country Structure

Each Member State should publish one LoTE file per type. Example for Sweden (SE):

```
lote-SE-pid-providers.json          → LoTEType: EUPIDProvidersList
lote-SE-wallet-providers.json       → LoTEType: EUWalletProvidersList
lote-SE-wrpac-providers.json        → LoTEType: EUWRPACProvidersList
lote-SE-wrprc-providers.json        → LoTEType: EUWRPRCProvidersList
lote-SE-pub-eaa-providers.json      → LoTEType: EUPubEAAProvidersList
lote-SE-registrars-registers.json   → LoTEType: EURegistrarsAndRegistersList
```

Each file is independently pointed to from the EU LOTL (or a national LOTL) with the appropriate `LoTEQualifiers` in the pointer entry.

---

## Issue with lote-SE.json

The current `lote-SE.json` mixes multiple entity types (`pid-provider`, `credential-issuer`, `verifier`) in a single file.
This makes it impossible to assign a single unambiguous `LoTEType` URI and does not align with the EU-level per-type structure.
The file should be split into separate typed LoTEs.
