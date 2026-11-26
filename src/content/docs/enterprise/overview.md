---
title: Vaelspire Enterprise
description: Commercial capabilities for global scale, WORM immutable audit storage, SIEM/OpenTelemetry streaming, seat/region licensing, and FIPS 140-3 compliance.
---

**Vaelspire's promise:** we never gate basic security behind an enterprise paywall. Passwords, MFA, Passkeys, RBAC, CSRF/origin protection, and single-region self-hosting are **MIT-licensed and free forever**.

When your business scales across continents or enters regulated audits (SOC 2, HIPAA, FINRA, SEC 17a-4, FedRAMP), **Vaelspire Enterprise** unlocks the operational and compliance infrastructure enterprises actually pay for — built directly on the exact same Rust core.

## Edition Comparison

| Capability | Vaelspire Core (MIT) | Pro / Growth | Vaelspire Enterprise |
| :--- | :--- | :--- | :--- |
| **Core Security** *(Argon2id, MFA, Passkeys, Sessions, API Keys, RBAC, Forward-Auth)* | **100% Free** | Included | Included |
| **Regions Supported** | **1 region** (single binary or single-region HA) | **2–3 regions** (read replicas / failover) | **Unlimited regions** (active-active geo-replication, global revocation sync, EU/US/APAC residency pinning) |
| **Audit Data Retention** | Local append-only audit log | Extended retention (90–365 days) & exports | **Multi-year retention (1–7+ years)**, cryptographic hash-chaining, auditor portal |
| **WORM Immutable Storage** | — | — | **S3 Object Lock, Azure Immutable Blob, GCS Bucket Lock** *(SEC 17a-4 / HIPAA / FINRA)* |
| **Telemetry & SIEM** | Prometheus `/metrics` + JSON logs | OpenTelemetry traces/metrics + webhooks | **Real-time SIEM connectors** *(Splunk, Datadog, Microsoft Sentinel, CrowdStrike, Kafka)* |
| **License Seats** | Unlimited single-region community use | Workforce seat packs | Volume workforce seats + separate CIAM MAU packs + unlimited service/agent accounts |
| **Compliance & Support** | Audited crypto crates + OIDC Conformance CI | Priority bug fixes & support SLA | **FIPS 140-3 builds**, third-party pen-test/audit reports (NDA), SOC 2 / ISO packages, dedicated SLA |

## Built for Real-World Enterprise Operations

### 🌍 Multi-Region Geo-Replication & Residency Pinning
Keep login latency under 50ms worldwide while enforcing strict regional data boundaries (EU identities stay in EU regions; US identities stay in US regions).

### 🔒 WORM Immutable Audit Storage
Stream tamper-proof, hash-chained audit records directly into cloud Write-Once-Read-Many buckets so even a compromised admin cannot alter historical login or access records.

### 🎟️ Offline Licensing That Never Bricks Logins
Self-hosted Enterprise uses **offline-verifiable Ed25519-signed license files** that work cleanly in fully air-gapped environments. If a license expires or seat counts temporarily spike, **user authentication never breaks** — Vaelspire alerts administrators loudly and pauses only new Enterprise configuration changes until reconciled.

### 🛡️ Revenue-Funded Audits & FIPS 140-3
Formal third-party penetration tests, SOC 2 Type II / ISO 27001 packages, and FIPS 140-3 validated builds are packaged under Vaelspire Enterprise so regulated organizations get attested artifacts and guaranteed CVE SLAs without inflating the cost of Open-Core.

## Licensing Split

- **Open-Core** (`/` outside `enterprise/`): **MIT License** (`LICENSE`)
- **Enterprise** (`enterprise/` and Enterprise-marked modules): **Vaelspire Enterprise License** (`LICENSE-ENTERPRISE`) — free to inspect and evaluate in non-production environments; commercial license required for production deployment.
