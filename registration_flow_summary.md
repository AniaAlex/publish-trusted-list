# Participant Registration Flows Summary

This document summarises the onboarding and registration flows for all participant types in the EUDI Wallet trust infrastructure, covering notification to Member State authorities, registration with Registrars, Access/Registration Certificate issuance, and publication on Trusted Lists.

---

## Overview Table

| Participant | Notified to EC/MS | Registers with Registrar | Access Certificate | Registration Certificate | On Trusted List |
|---|---|---|---|---|---|
| Wallet Provider | Yes (MS notifies EC) | No | No | No | Yes (EC TL) |
| Access Certificate Provider | Yes (MS notifies EC) | No | No | No | Yes (WP4 LoTL `wrpac-provider`) |
| Registration Certificate Provider | Yes (MS notifies EC) | No | No | No | Yes (WP4 LoTL `wrprc-provider`) |
| PID Provider | Yes (MS notifies EC) | Yes | Yes (mandatory) | Optional | Yes (LoTL `pid-provider`) |
| PuB-EAA Provider | Yes (EC compiles list) | Yes | Yes (mandatory) | Optional | Yes (LoTL `pub-eaa-provider`) |
| QEAA Provider | Yes (MS QTSP notification) | Yes | Yes (mandatory) | Optional | Yes (national TS 119 612 TL) |
| Non-qualified EAA Provider | National only | Yes | Yes (mandatory) | Optional | National extension |
| Relying Party | No | Yes | Yes (per RP instance) | Optional | Never |
| Registrar / EBWOID | Yes (MS notifies EC) | No | No | No | Yes (LoTL `ebwoid-provider`) |

---

## 1. Wallet Provider

**Regulatory basis:** Art. 6a EUDI Regulation; Topic 9 (ARF 1.4).

**Flow:**

1. Wallet Provider develops and certifies the Wallet Solution (conformity assessment against ETSI EN 119 461 / common criteria).
2. Member State (MS) designates the Wallet Provider and notifies the European Commission (EC).
3. EC compiles the **EU Wallet Providers Trusted List** (`EUWalletProvidersList`).
4. The Wallet Provider's entry on the TL includes the Wallet Solution identifier, status, and the trust anchor (public key / certificate) for the Wallet Unit attestation.

**Certificates / credentials issued:** None at onboarding. The Wallet Provider later issues **Wallet Unit Attestations (WUA)** to individual Wallet Units during device provisioning.

**Does NOT register with a Registrar.** Designation is a sovereign act by the MS, not a registration process.

---

## 2. Access Certificate Provider (WRPAC)

**Regulatory basis:** ETSI TS 119 411-8; Topic 31 (ARF 1.4).

**Flow:**

1. The Access Certificate Provider (an Accredited CA or national authority) is designated by the MS.
2. MS notifies the EC; the provider is added to the **EU WRPAC Providers List** (`EUWRPACProvidersList`) on the LoTL.
3. The CA operates as a sub-CA under a trust hierarchy anchored in the TL entry (root CA certificate = trust anchor).

**Certificates issued (at runtime, not onboarding):** The CA issues **Access Certificates** (X.509, ETSI TS 119 411-8) to Relying Party Instances and PID/EAA Provider service endpoints. These are per-instance certificates used to authenticate the entity during Wallet transactions. They do not encode attestation type or intended use.

**Does NOT register with a Registrar.** The CA is a notified entity, not a registrant.

---

## 3. Registration Certificate Provider (WRPRC)

**Regulatory basis:** ETSI TS 119 475; Topic 31 (ARF 1.4).

**Flow:**

1. The Registration Certificate Provider is designated by the MS (may be the same entity as the Registrar or a separate CA).
2. MS notifies the EC; the provider is added to the **EU WRPRC Providers List** (`EUWRPRCProvidersList`) on the LoTL.
3. The provider issues **Registration Certificates** (`rc-wrp+jwt` or CBOR equivalent) to registered entities after the Registrar confirms their registration.

**Credentials issued (at runtime):** Registration Certificates carrying `intended_uses`, `eligible_for_credential_types`, and entitlement claims scoped to a specific Registrar-assigned registration. Issuance is at Registrar policy discretion — not all registrants receive one.

**Does NOT register with a Registrar** at onboarding.

---

## 4. Registrar / EBWOID

**Regulatory basis:** Art. 45e EUDI Regulation; Topic 31 (ARF 1.4); ETSI TS 119 475.

**Flow:**

1. The Registrar (national or designated body) is notified to the EC by the MS.
2. Added to the **EU Registrars and Registers List** (`EURegistrarsAndRegistersList`, `ebwoid-provider`) on the LoTL.
3. Operates a **National Register** that records Relying Parties and optionally PID/EAA Providers.
4. Coordinates with the Access CA and Registration Certificate Provider to trigger credential issuance after registration.

**Does NOT register with another Registrar.** It is itself the designated registration authority.

---

## 5. PID Provider

**Regulatory basis:** Art. 45a EUDI Regulation; Topic 10 (ARF 1.4).

**Flow:**

1. The PID Provider (typically a MS identity authority) **registers** with the national Registrar.
2. The Registrar verifies the application and records the entity in the National Register.
3. The Registrar coordinates issuance of an **Access Certificate** (mandatory) by the Access CA, authenticating the PID Provider's issuance endpoint.
4. A **Registration Certificate** (optional, per Registrar policy) is issued encoding the provider's entitlements.
5. MS **notifies** the EC of the designated PID Provider.
6. EC publishes the entry on the **EU PID Providers List** (`EUPIDProvidersList`) on the LoTL.

**Trust anchor on TL:** The PID Provider's public key or root certificate for credential signing (PID attestation signing key), distinct from the Access Certificate which is per-instance.

---

## 6. PuB-EAA Provider

**Regulatory basis:** Art. 45c EUDI Regulation; ETSI TS 119 602 Annex H; Topic 12 (ARF 1.4).

**Flow:**

1. The PuB-EAA Provider (public body or body acting under official authority) **registers** with the national Registrar.
2. Registrar verifies the mandate/authority and records the entity.
3. **Access Certificate** (mandatory) issued by the Access CA.
4. **Registration Certificate** (optional) issued encoding entitlements.
5. EC (not the MS, because PuB-EAA Providers may operate cross-border under EC mandate) **compiles** the entry and publishes it on the **EU PuB-EAA Providers List** (`EUPubEAAProvidersList`), which is a **LoTE** per ETSI TS 119 602 Annex H — not a traditional TS 119 612 Trusted List.

**Service Digital Identity on the LoTE:** The `ServiceDigitalIdentity` component **may** contain X.509 certificates (optional per Annex H Table H.3). When the SDI is absent or empty, key discovery proceeds via the `ServiceSupplyPoints` base URI using `/.well-known/openid-federation` or a JWKS endpoint. The WP4 pilot profile requires at least one X.509 certificate in the SDI as a WEBUILD profile restriction.

**Trust anchor:** For OpenID Federation flows, the trust anchor (federation root key) is pre-configured in the verifier out-of-band; it is NOT published in the Trusted List.

---

## 7. QEAA Provider

**Regulatory basis:** Art. 45b EUDI Regulation; ETSI TS 119 612; Topic 12 (ARF 1.4).

**Flow:**

1. The QEAA Provider is a **QTSP** (Qualified Trust Service Provider) already subject to national CA/B supervision and listed on the national **TS 119 612 Trusted List**.
2. The QTSP **registers** the specific QEAA issuance service with the national Registrar (in addition to the TS 119 612 notification flow).
3. **Access Certificate** (mandatory) issued by the Access CA — authenticates the QEAA issuance endpoint during credential presentation/issuance; separate from the qualified signing certificate used to sign attestations.
4. **Registration Certificate** (optional) issued encoding entitlements.
5. National supervisory body **publishes** the QEAA service entry on the **national TS 119 612 Trusted List** (TSLType `EUgeneric`), not on the LoTE.

**Two certificates in operation:**
- **Qualified signing certificate** (from qualified CA): signs the QEAA attestation content.
- **Access Certificate** (from WRPAC): authenticates the issuance channel to the Wallet Unit. Revocation is independent for each.

---

## 8. Non-qualified EAA Provider

**Regulatory basis:** National law; Topic 12 (ARF 1.4) national extension.

**Flow:**

1. Registers with the national Registrar (national law determines eligibility).
2. Access Certificate issued (mandatory — same WRPAC infrastructure as other providers).
3. Registration Certificate (optional).
4. No EC-level notification. The provider is **not** placed on an ETSI-standardised EU-level list.
5. Published on a **national extension list** — in the WP4 model this is `tl_type: eaa-provider` mapping to `EUPubEAAProvidersList` as a WEBUILD placeholder (no dedicated ETSI URI exists for non-qualified EAA).

**Note on URI mapping:** ETSI TS 119 602 does not define a dedicated `LoTEType` URI for non-qualified EAA. The WP4 LoTL reuses `EUPubEAAProvidersList` for `eaa-provider` entries as a pragmatic simplification, documented as a project-specific extension.

---

## 9. Relying Party

**Regulatory basis:** Art. 45e EUDI Regulation; Topic 31 (ARF 1.4).

**Flow:**

1. The Relying Party **registers** with the national Registrar.
2. Registrar verifies the legal basis for requesting each credential type and records the registration.
3. **Access Certificate** (mandatory, per RP instance / service supply point) issued by the Access CA. Each deployment or endpoint gets its own certificate. The Access Certificate authenticates the RP instance to the Wallet Unit during presentation; it does not certify the RP's identity for end users.
4. **Registration Certificate** (optional) issued encoding `intended_uses` and `eligible_for_credential_types`.

**Never placed on a Trusted List.** RPs authenticate via their Access Certificate chain to the WRPAC Provider TL entry. End-to-end trust is established by the chain: RP instance → Access Cert → Access CA → LoTL.

---

## Key Distinctions

| Concept | Detail |
|---|---|
| Notification vs. Registration | Wallet Providers, Access CAs, Reg Cert Providers, and Registrars are **notified** (sovereign/designated). PID/EAA Providers and RPs **register** with a Registrar. |
| Access Certificate scope | Issued per RP instance or provider service endpoint. Not a global identity — authenticates a specific connection. |
| Registration Certificate | Carries policy entitlements. Optional at Registrar discretion. Issued after registration is confirmed. |
| TL vs. LoTE | QEAA uses traditional TS 119 612 XML Trusted List. PuB-EAA uses TS 119 602 LoTE (JSON or XML). |
| SDI vs. key discovery | `ServiceDigitalIdentity` in a LoTE entry may hold a static X.509 cert; if absent, verifiers discover keys via `ServiceSupplyPoints` + `/.well-known/openid-federation` or JWKS endpoint. |
| OpenID Federation trust anchor | Pre-configured in verifiers out-of-band. NOT in the Trusted List. |

---

*Sources: EUDI Regulation (2024/1183); ARF 1.4 Topics 9/10/12/31; ETSI TS 119 411-8; ETSI TS 119 475; ETSI TS 119 602 V1.1.1 (2025-11) Annex H; ETSI TS 119 612 V2.4.1.*
