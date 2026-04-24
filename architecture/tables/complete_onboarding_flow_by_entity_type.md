# Complete Onboarding Flows by Entity Type

This document describes the onboarding flow for each entity type in the EUDI Wallet trust infrastructure, with references to source documentation.

**Date**: 2026-04-24  
**Aligned with**: ARF v2.8.0, Trust Infrastructure Schema

---

## 1. PID Provider

| Step | Action | Actor | Reference |
|------|--------|-------|-----------|
| 1 | Register with MS Registrar | PID Provider | [pid_eaa_provider_onboarding.md#L172](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md), ARF Topic 27 |
| 2 | Obtain Access Certificate | Access CA | [terms-and-entities.md#L124](../../task1-use-cases/terms-and-entities.md), Reg_10 |
| 3 | Generate attestation signing key | PID Provider (internal) | Inferred - not explicitly documented |
| 4 | Member State notifies to EC | MS Registrar | [trust-infrastructure-schema.md#L148](../../task2-trust-framework/trust-infrastructure-schema.md), GenNot_01 |
| 5 | EC compiles and publishes | PID Provider TL | [pid_eaa_provider_onboarding.md#L172](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md), Topic 31 |

**Key Points - Trust Anchor Submission**:

| Question | Answer | Reference |
|----------|--------|-----------|
| Where is signing cert submitted? | To **MS Registrar** during registration (Step 1) | [trust-infrastructure-schema.md#L150](../../task2-trust-framework/trust-infrastructure-schema.md), PPNot_02 |
| What is submitted? | "PID Provider trust anchors, i.e., public keys and name" | [trusted-list-registration-trust-evaluation-matrix.md#L80](../../task2-trust-framework/trusted-list-registration-trust-evaluation-matrix.md), PPNot_02 |
| Who forwards to EC? | **Member State** notifies EC | GenNot_01 |
| Who puts it in TL? | **European Commission** compiles PID Provider TL | PPNot_05 |
| TL used by whom? | Relying Parties validate PID signatures | OIA_12 |

---

## 2. QEAA Provider

| Step | Action | Actor | Reference |
|------|--------|-------|-----------|
| 1 | Register with MS Registrar | QEAA Provider | [pid_eaa_provider_onboarding.md#L173](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md), ARF Topic 27 |
| 2 | Obtain Access Certificate | Access CA | [terms-and-entities.md#L124](../../task1-use-cases/terms-and-entities.md), Reg_10 |
| 3 | QEAA Provider IS a QTSP (self-issues qualified signing cert) | QEAA Provider | [terms-and-entities.md#L31](../../task1-use-cases/terms-and-entities.md) "QEAA Provider (a QTSP under eIDAS)" |
| 4 | MS TLP compiles Member State QTSP TL | MS TLP | [pid_eaa_provider_onboarding.md#L507](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md), eIDAS Article 22 |
| 5 | MS notifies to EC (TL pointer) | MS | [pid_eaa_provider_onboarding.md#L173](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md), eIDAS Article 22(3) |

**Key Points - Trust Anchor Submission**:

| Question | Answer | Reference |
|----------|--------|-----------|
| Where is signing cert created? | QEAA Provider **IS a QTSP** - self-issues qualified certificate | [terms-and-entities.md#L31](../../task1-use-cases/terms-and-entities.md) |
| Where is trust anchor submitted? | To **MS TLP** (not Registrar for TL purposes) | eIDAS Article 22 |
| Who compiles TL? | **MS TLP** compiles national QTSP TL | [pid_eaa_provider_onboarding.md#L507](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md) |
| What MS notifies to EC? | **TL pointer** (URL), not individual trust anchors | eIDAS Article 22(3) |
| TL used by whom? | Relying Parties validate QEAA qualified signatures per Art. 32 | OIA_13 |

> **Note**: QEAA Provider trust anchor goes on **national QTSP TL** (MS TLP), not EC-compiled TL.

---

## 3. PuB-EAA Provider

| Step | Action | Actor | Reference |
|------|--------|-------|-----------|
| 1 | Register with MS Registrar | PuB-EAA Provider | [pid_eaa_provider_onboarding.md#L174](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md), ARF Topic 27 |
| 2 | Obtain Access Certificate | Access CA | [terms-and-entities.md#L124](../../task1-use-cases/terms-and-entities.md), Reg_10 |
| 3 | Obtain qualified signing cert FROM external QTSP | QTSP | [relying-party-evaluates-credentials.md#L28](../../task1-use-cases/subtask1-2-trust-registry/relying-party-evaluates-credentials.md), [trusted-list-registration-trust-evaluation-matrix.md#L41](../../task2-trust-framework/trusted-list-registration-trust-evaluation-matrix.md) ISSU_09 |
| 4 | Member State notifies to EC | MS Registrar | [trust-infrastructure-schema.md#L148](../../task2-trust-framework/trust-infrastructure-schema.md), GenNot_01 |
| 5 | EC compiles and publishes | PuB-EAA Provider TL | [pid_eaa_provider_onboarding.md#L174](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md), Topic 31 |

**Key Points - Trust Anchor Submission**:

| Question | Answer | Reference |
|----------|--------|-----------|
| Where is signing cert obtained? | From **external QTSP** (PuB-EAA is NOT a QTSP) | [trusted-list-registration-trust-evaluation-matrix.md#L41](../../task2-trust-framework/trusted-list-registration-trust-evaluation-matrix.md), ISSU_09 |
| What goes to EC notification? | Authorization data (NOT signing cert) | PuBPNot_02 |
| Who puts signing cert in TL? | **QTSP** puts it on their QTSP TL | eIDAS Article 22 |
| How many TL entries? | **TWO**: PuB-EAA TL (authorization) + QTSP TL (signature) | [trust-infrastructure-schema.md#L152](../../task2-trust-framework/trust-infrastructure-schema.md) |
| TL used by whom? | RP validates qualified signature via QTSP TL, authorization via PuB-EAA TL | OIA_14, ISSU_09 |

> **Note**: PuB-EAA has **two TL entries**: PuB-EAA TL (authorization) + QTSP TL (qualified signature).

---

## 4. Non-qualified EAA Provider

| Step | Action | Actor | Reference |
|------|--------|-------|-----------|
| 1 | Register with MS Registrar | Non-qualified EAA Provider | [pid_eaa_provider_onboarding.md#L175](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md), ARF Topic 27 |
| 2 | Obtain Access Certificate | Access CA | [terms-and-entities.md#L124](../../task1-use-cases/terms-and-entities.md), Reg_10 |
| 3 | Generate attestation signing key | Non-qualified EAA Provider (internal) | Inferred - per Rulebook (Topic 12) |
| 4 | MS TLP compiles national EAA Provider TL | MS TLP | [pid_eaa_provider_onboarding.md#L508](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md), national extension |
| 5 | MS TLP submits TL URL to EC | MS TLP | [pid_eaa_provider_onboarding.md#L175](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md) |

**Key Points - Trust Anchor Submission**:

| Question | Answer | Reference |
|----------|--------|-----------|
| Where is signing cert created? | Provider generates internally | Inferred - per Rulebook (Topic 12) |
| Where is trust anchor submitted? | To **MS Registrar** during registration | ARF Topic 27 |
| Who compiles TL? | **MS TLP** compiles national EAA Provider TL | [pid_eaa_provider_onboarding.md#L508](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md) |
| What MS notifies to EC? | **TL URL** (not individual trust anchors) | [trust-infrastructure-schema.md](../../task2-trust-framework/trust-infrastructure-schema.md) |
| TL used by whom? | Relying Parties validate EAA signatures per Rulebook | OIA_15, Topic 12 |

> **Note**: ARF states non-qualified EAA TL is "out of scope" but implemented as national extension per [trust-infrastructure-schema.md](../../task2-trust-framework/trust-infrastructure-schema.md).

---

## 5. Wallet Provider

| Step | Action | Actor | Reference |
|------|--------|-------|-----------|
| 1 | ⚠️ NO registration with Registrar | — | [trust-infrastructure-schema.md#L30](../../task2-trust-framework/trust-infrastructure-schema.md) "do **not** register with Registrars" |
| 2 | Member State notifies to EC | MS | [trust-infrastructure-schema.md#L26](../../task2-trust-framework/trust-infrastructure-schema.md), GenNot_01 |
| 3 | EC compiles and publishes | Wallet Provider TL | [trust-infrastructure-schema.md#L26](../../task2-trust-framework/trust-infrastructure-schema.md) |

**Key Points - Trust Anchor Submission**:

| Question | Answer | Reference |
|----------|--------|-----------|
| Where is trust anchor submitted? | Directly to **Member State** (no Registrar) | [trust-infrastructure-schema.md#L30](../../task2-trust-framework/trust-infrastructure-schema.md) |
| What is submitted? | "Wallet Provider trust anchors" | WPNot_02 |
| Who forwards to EC? | **Member State** notifies EC | GenNot_01, WPNot_01, WPNot_02 |
| Who puts it in TL? | **European Commission** compiles Wallet Provider TL | WPNot_04, WPNot_05 |
| TL used by whom? | PID/Attestation Providers validate Wallet Unit Attestations | ISSU_21, ISSU_30 |

---

## 6. Relying Party

| Step | Action | Actor | Reference |
|------|--------|-------|-----------|
| 1 | Register with MS Registrar | Relying Party | [relying_party_onboarding.md#L265](../../task1-use-cases/subtask1-1-onboarding/relying_party_onboarding.md), ARF Topic 27 |
| 2 | Obtain Access Certificate | Access CA | [terms-and-entities.md#L124](../../task1-use-cases/terms-and-entities.md), Reg_10a |
| 3 | (Optional) Obtain Registration Certificate | WRPRC Provider | [relying_party_onboarding.md#L452](../../task1-use-cases/subtask1-1-onboarding/relying_party_onboarding.md), Topic 44 |
| 4 | ⚠️ NOT listed in any TL | — | [trust-infrastructure-schema.md#L25](../../task2-trust-framework/trust-infrastructure-schema.md) "N/A (Uses Access Certificates/Registry)" |

**Key Points - No Signing Certificate for TL**:

| Question | Answer | Reference |
|----------|--------|-----------|
| Does RP have signing certificate? | **NO** - RPs don't sign attestations | N/A |
| How is RP trusted? | Via **Access Certificate** issued by Access CA | Reg_10a, RPA_04 |
| Where is RP validated? | Access CA TL (for access cert) + Registry (for registration) | [trust-infrastructure-schema.md#L25](../../task2-trust-framework/trust-infrastructure-schema.md) |
| Why no TL entry? | RPs consume credentials, don't issue them | [trust-infrastructure-schema.md#L25](../../task2-trust-framework/trust-infrastructure-schema.md) |
| Trust validation by whom? | Wallet Unit validates RP access cert via Access CA TL | RPA_04 |

---

## 7. Access CA (WRPAC Provider)

| Step | Action | Actor | Reference |
|------|--------|-------|-----------|
| 1 | ⚠️ NO registration with Registrar | — | [trust-infrastructure-schema.md#L30](../../task2-trust-framework/trust-infrastructure-schema.md) |
| 2 | Member State notifies to EC | MS | [trust-infrastructure-schema.md#L27](../../task2-trust-framework/trust-infrastructure-schema.md), GenNot_01 |
| 3 | EC compiles and publishes | Access CA TL | [trust-infrastructure-schema.md#L27](../../task2-trust-framework/trust-infrastructure-schema.md) |

**Key Points - Trust Anchor Submission**:

| Question | Answer | Reference |
|----------|--------|-----------|
| Where is CA cert submitted? | Directly to **Member State** (no Registrar) | [trust-infrastructure-schema.md#L30](../../task2-trust-framework/trust-infrastructure-schema.md) |
| What is submitted? | "Trust anchors of Access CAs" (CA certificates) | RPACANot_02 |
| Who forwards to EC? | **Member State** notifies EC | GenNot_01 |
| Who puts it in TL? | **European Commission** compiles Access CA TL | RPACANot_04 |
| TL used by whom? | Wallet Units validate access certs of RPs and Providers | RPA_04, ISSU_24, ISSU_34 |

---

## 8. WRPRC Provider (Provider of Registration Certificates)

| Step | Action | Actor | Reference |
|------|--------|-------|-----------|
| 1 | ⚠️ NO registration with Registrar | — | [trust-infrastructure-schema.md#L30](../../task2-trust-framework/trust-infrastructure-schema.md) |
| 2 | Member State notifies to EC | MS | [trust-infrastructure-schema.md#L28](../../task2-trust-framework/trust-infrastructure-schema.md), GenNot_01 |
| 3 | EC compiles and publishes | WRPRC Provider TL | [trust-infrastructure-schema.md#L28](../../task2-trust-framework/trust-infrastructure-schema.md) |

**Key Points - Trust Anchor Submission**:

| Question | Answer | Reference |
|----------|--------|-----------|
| Where is CA cert submitted? | Directly to **Member State** (no Registrar) | [trust-infrastructure-schema.md#L30](../../task2-trust-framework/trust-infrastructure-schema.md) |
| What is submitted? | Trust anchors (CA certificates for registration certs) | RPACANot_02 |
| Who forwards to EC? | **Member State** notifies EC | GenNot_01 |
| Who puts it in TL? | **European Commission** compiles WRPRC Provider TL | RPACANot_04 |
| TL used by whom? | Wallet Units validate registration certificates | RPRC_17 |

---

## Summary: TL Compilation Authority

| Entity Type | Registration | TL Compiled By | TL Type |
|-------------|--------------|----------------|---------|
| PID Provider | MS Registrar | EC | PID Provider TL |
| QEAA Provider | MS Registrar | **MS TLP** | National QTSP TL |
| PuB-EAA Provider | MS Registrar | EC + external QTSP | PuB-EAA TL + QTSP TL |
| Non-qualified EAA | MS Registrar | MS TLP | National EAA TL |
| Wallet Provider | None | EC | Wallet Provider TL |
| Relying Party | MS Registrar | **N/A** | Not in TL |
| Access CA | None | EC | Access CA TL |
| WRPRC Provider | None | EC | WRPRC Provider TL |

---

## Primary Sources

| Document | Location | Content |
|----------|----------|---------|
| Trust Infrastructure Schema | [trust-infrastructure-schema.md](../../task2-trust-framework/trust-infrastructure-schema.md) | Responsibilities Matrix, notification flows |
| PID/EAA Provider Onboarding | [pid_eaa_provider_onboarding.md](../../task1-use-cases/subtask1-1-onboarding/pid_eaa_provider_onboarding.md) | Provider registration and TL flows |
| Relying Party Onboarding | [relying_party_onboarding.md](../../task1-use-cases/subtask1-1-onboarding/relying_party_onboarding.md) | RP registration flow |
| Wallet Provider Onboarding | [wallet-provider-onboarding.md](../../task1-use-cases/subtask1-1-onboarding/wallet-provider-onboarding.md) | Wallet Provider notification flow |
| Terms and Entities | [terms-and-entities.md](../../task1-use-cases/terms-and-entities.md) | Entity responsibilities and definitions |
| RP Evaluates Credentials | [relying-party-evaluates-credentials.md](../../task1-use-cases/subtask1-2-trust-registry/relying-party-evaluates-credentials.md) | Validation requirements (OIA_12-15) |
| Trust Evaluation Matrix | [trusted-list-registration-trust-evaluation-matrix.md](../../task2-trust-framework/trusted-list-registration-trust-evaluation-matrix.md) | ISSU_09 (PuB-EAA qualified signature) |

---

## Key Regulatory References

| Reference | Description |
|-----------|-------------|
| ARF Topic 27 | Registration of PID Providers, Providers of QEAAs, PuB-EAAs, and non-qualified EAAs, and Relying Parties |
| ARF Topic 31 | Notification and publication of PID Provider, Wallet Provider, Attestation Provider, Access CA, and Provider of Registration Certificates |
| ARF Topic 44 | Registration certificates for PID Providers, Providers of QEAAs, PuB-EAAs, and non-qualified EAAs, and Relying Parties |
| eIDAS Article 22 | Trusted Lists (QTSP publication) |
| eIDAS Article 22(3) | Notification of TL pointers to EC |
| eIDAS Article 32 | Qualified signature validation |
| GenNot_01 | MS SHALL notify PID Providers, PuB-EAA Providers, Wallet Providers, Access CAs, WRPRC Providers to EC |
| Reg_10 | Access CA SHALL issue access certificates to registered entities |
