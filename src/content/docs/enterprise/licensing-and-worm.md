---
title: Enterprise Architecture — WORM, Geo-Rep & Offline Licensing
description: Technical architecture of Vaelspire Enterprise modules (vaelspire-license, vaelspire-worm, vaelspire-telemetry, vaelspire-georep) implementing vaelspire-core::extensions.
---

Vaelspire Enterprise lives in a completely separate **private repository** (`neotales/vaelspire-enterprise`) with its own Cargo workspace and commercial license. The 100% MIT Open-Core repository (`neotales/vaelspire`) never mixes in proprietary code or depends on Enterprise crates; instead, Enterprise crates implement the five extension traits in `vaelspire_core::extensions`.

## 1. Offline Ed25519 Licensing (`vaelspire-license`)

Enterprise deployments in air-gapped networks or strict VPCs cannot phone home to a SaaS billing server. Vaelspire uses signed offline `.vlic` tokens (`vlic1.<base64url-json>.<base64url-ed25519-sig>`):

- **Cryptographic verification:** Verified strictly offline against Neotales's pinned Ed25519 public verifying key (`Ed25519LicenseGate::from_vlic`).
- **Explicit entitlements:** Encodes `subject`, `tier`, `expires_at`, enabled `EnterpriseFeature` flags (`geo_replication`, `worm_storage`, `siem_telemetry`, `extended_audit_retention`, `fips`, `multi_org_governance`), and `LicenseLimits` (`max_regions`, `max_workforce_seats`, `max_ciam_maus`).
- **Non-bricking invariant:** `LicenseGate::allows_login(&self)` **always returns `true`**. If a `.vlic` expires (`LicenseStatus::GracePeriod`) or fails signature verification, user sign-in, OIDC token issuance, `/forward-auth`, and SCIM continue uninterrupted while Enterprise-only features degrade gracefully and admins are alerted.

## 2. Tamper-Evident WORM Audit Storage (`vaelspire-worm`)

Implements `vaelspire_core::extensions::AuditSink`:

1. Validates every `AuditEvent` against core's secret-free field allow-list (`ip`, `user_agent` only — passwords and tokens can never enter the chain).
2. Links each record sequentially with SHA-256 over `(sequence, archived_at_unix, prev_hash, canonical_event_json)` anchored to a fixed genesis hash (`0000...0000`).
3. Packages batches into NDJSON `WormArchiveObject` payloads with deterministic object keys, SHA-256 body checksums, and native immutability headers for:
   - **AWS S3 / MinIO Object Lock:** `x-amz-object-lock-mode` (`COMPLIANCE` or `GOVERNANCE`), `x-amz-object-lock-retain-until-date`, `x-amz-content-sha256`
   - **Azure Immutable Blob:** `x-ms-immutability-policy-mode: Locked`, `x-ms-immutability-policy-until-date`
   - **GCS Bucket Lock:** `x-goog-meta-vaelspire-worm-sha256`, `x-goog-meta-vaelspire-retention-days`
4. Includes `verify_chain(&[ChainedAuditRecord])` so external auditors can independently detect any inserted, reordered, deleted, or modified record.

## 3. Bounded SIEM & OpenTelemetry Export (`vaelspire-telemetry`)

Implements `vaelspire_core::extensions::TelemetrySink` with a synchronous, bounded queue that tracks `accepted`, `dropped`, and `buffered` counters — guaranteeing that an unreachable SIEM never blocks or fails an authentication request.

Supports native batch formatting for:
- **OpenTelemetry OTLP/HTTP JSON** (`ExportFormat::OtlpJson`)
- **Splunk HTTP Event Collector NDJSON** (`ExportFormat::SplunkHecNdjson`)
- **Datadog HTTP Logs Intake JSON** (`ExportFormat::DatadogLogsJson`)

## 4. Multi-Region Data Residency & Replication (`vaelspire-georep`)

Implements `RegionPolicy` and `ReplicationHook`:

- **`ResidencyPolicy`:** Lock-free tenant-to-region map pinning tenants to authoritative regions (`eu-central-1`, `us-east-1`, `ap-northeast-1`). `check_local_write(tenant_id)` rejects out-of-region mutations and returns the authoritative home region for routing.
- **`ReplicationLogHook`:** Captures ordered `ReplicationEnvelope` entries (`sequence`, `event_id`, `origin_region`, `tenant_id`, `kind`, `entity_id`, `occurred_at_unix`) with cursor-based `read_since(after_sequence)` for cross-region revocation and identity sync.
