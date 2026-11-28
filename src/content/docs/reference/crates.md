---
title: Rust Crate Reference
description: Complete index of Vaelspire's 11 MIT Open-Core crates and 4 isolated Enterprise workspace crates.
---

Vaelspire is structured as a modular Rust 2024 workspace (`#![forbid(unsafe_code)]`, `clippy::pedantic`, zero logging in library crates) over `neotales-dbapi` and `neotales-migration`.

## MIT Open-Core Crates (`crates/`)

| Crate | Purpose | Key Types & Traits |
| :--- | :--- | :--- |
| **`vaelspire-core`** | I/O-free domain contracts, store trait, and Enterprise extension seams. | `AuthStore`, `AuthError`, `User`, `Session`, `ApiKey`, `AuditEvent`, `extensions::{LicenseGate, AuditSink, TelemetrySink, RegionPolicy, ReplicationHook}` |
| **`vaelspire-alerts`** | Reusable multi-sink alerting router (Webhook + HMAC-SHA256, Slack, Discord, Teams Adaptive Cards, Gotify, ntfy, Twilio/Generic SMS, SMTP Email) with zero Vaelspire coupling *(planned for future extraction to `neotales-alerts`)*. | `AlertEvent`, `Severity`, `AlertSink`, `AlertRouter`, `AlertHandle`, `AlertsConfig` |
| **`vaelspire-auth`** | Pure authentication engine: Argon2id + bcrypt auto-upgrade, keyed BLAKE3 digests, `Zeroizing` hygiene, TOTP MFA, Passkeys, API keys, RBAC, email/social/OIDC client flows. | `Auth`, `Policy`, `SessionCache`, `ApiKeys`, `Mfa`, `Passkeys` |
| **`vaelspire-axum`** | Opinionated Axum HTTP router with CSRF double-submit cookies, origin allow-lists, per-IP rate limiting, and optional API key / role routes. | `AuthRouter`, `DEFAULT_SESSION_COOKIE`, `DEFAULT_CSRF_COOKIE` |
| **`vaelspire-email`** | Async email delivery abstractions & SMTP/memory transports for verification, password reset, and OTP codes. | `Mailer`, `MemoryMailer`, `SmtpMailer` |
| **`vaelspire-store-sqlite`** | Embedded SQLite adapter over `neotales-dbapi-sqlite` with embedded migrations and full `conformance.rs` compliance. | `SqliteStore`, `open()` |
| **`vaelspire-store-postgres`** | Production PostgreSQL adapter over `neotales-dbapi-postgres` passing the exact same black-box `conformance.rs` suite. | `PostgresStore` |
| **`vaelspire-store-d1`** | Pure-Rust, zero-native-C, `wasm32`-clean **Cloudflare D1** `AuthStore` adapter for ultra-low-cost serverless edge deployments. | `D1Store`, `D1Client`, `D1Value`, `D1_SCHEMA_SQL` |
| **`vaelspire-verify`** | Ultra-thin, zero-database `EdDSA` (`Ed25519`) JWT & RFC 7517 JWKS verifier (`wasm32`-clean) for downstream microservices & Cloudflare Workers. | `TokenVerifier`, `Jwks`, `Jwk`, `VerifiedClaims`, `Audience`, `VerifyError` |
| **`vaelspire-oidc`** | Full OIDC 1.0 & OAuth 2.0 Identity Provider: Discovery, rotating `Ed25519` JWKS (RFC 7638 thumbprints), Auth Code + PKCE `S256`, Refresh Token Rotation + family reuse detection, NHI `client_credentials`, UserInfo, Introspect, Revoke. | `OidcProvider`, `OidcProviderConfig`, `OidcClient`, `ClientKind`, `TokenResponse` |
| **`vaelspire`** | Single-binary `clap` CLI (`serve`, `migrate`, `keygen`, `admin bootstrap`) + Axum HTTP server wiring all auth, OIDC, SCIM 2.0, SAML metadata, `/forward-auth`, `/metrics`, and optional `--features embed-ui` SvelteKit assets. | `ServerConfig`, `UiMode`, `build_router()`, `serve()` |

## Core Extension Seams (`vaelspire_core::extensions`)

Open-Core ships zero-cost default implementations (`CommunityLicenseGate`, `NoopAuditSink`, `NoopTelemetrySink`, `SingleRegionPolicy`, `NoopReplicationHook`). Enterprise modules implement these traits without changing a single line of core authentication logic:

- `LicenseGate` — Enforces the invariant `allows_login(&self) -> bool { true }`.
- `AuditSink` — External immutable audit archival hook.
- `TelemetrySink` — Synchronous, non-blocking structured telemetry hook.
- `RegionPolicy` — Lock-free tenant-to-region home pinning.
- `ReplicationHook` — Async cross-region committed mutation outbox.

## Proprietary Enterprise Crates (`neotales/vaelspire-enterprise`, Private Repo)

Maintained in a completely separate private repository (`neotales/vaelspire-enterprise`) so `neotales/vaelspire` stays 100% MIT:

| Crate | Core Trait Implemented | Capability |
| :--- | :--- | :--- |
| **`vaelspire-license`** | `LicenseGate` | Offline Ed25519 `.vlic` signing & verification with graceful expiry. |
| **`vaelspire-worm`** | `AuditSink` | SHA-256 hash-chained records + S3 Object Lock / Azure Immutable Blob / GCS Bucket Lock archive framing. |
| **`vaelspire-telemetry`** | `TelemetrySink` | Bounded backpressure queue exporting OTLP JSON, Splunk HEC NDJSON, and Datadog Logs batches. |
| **`vaelspire-georep`** | `RegionPolicy`, `ReplicationHook` | EU/US/APAC residency pinning + ordered cross-region replication envelopes. |
