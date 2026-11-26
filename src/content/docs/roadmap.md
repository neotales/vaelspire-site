---
title: Vaelspire Roadmap
description: Public milestone roadmap for Vaelspire Core (MIT) and Vaelspire Enterprise — from embeddable Rust crates and /forward-auth to OIDC IdP, embedded SvelteKit UI, SCIM 2.0, Enterprise WORM/geo-replication, and FIPS 140-3.
---

Vaelspire is built in focused, shippable milestones — **dogfooding our own apps (including Vaelsgard) first**, keeping core security **100% free and MIT-licensed**, and funding formal enterprise compliance through real commercial adoption.

> **Release Policy:** Documentation in [`neotales/vaelspire-site`](https://github.com/neotales/vaelspire-site) (human guides, Roadmap, and dense AI agent pages `/agents/` + `/llms-full.txt`) is always updated and verified **before** any `vaelspire` release tag is cut.

---

## ✅ M1 — Foundation & Embeddable Rust Crates *(Complete)*

- Graduated and renamed `neotales-x-auth*` into 6 MIT Open-Core crates over `neotales-dbapi` and `neotales-migration`:
  - `vaelspire-core`, `vaelspire-auth`, `vaelspire-axum`, `vaelspire-email`, `vaelspire-store-sqlite`, `vaelspire-store-postgres`
- Argon2id + legacy bcrypt auto-upgrade, keyed BLAKE3 digests, `Zeroizing` secret hygiene, TOTP MFA (AES-256-GCM), Passkeys/WebAuthn, API keys, email sign-in, social/OIDC client, tenants/roles/groups, and transactional append-only audit rows.
- Shared black-box `conformance.rs` suite across SQLite and PostgreSQL, Rust `1.100` (edition 2024), `#![forbid(unsafe_code)]`, `clippy::pedantic`.

---

## ✅ M2 — Single-Binary CLI/Server, Setup Tooling & Docs Site *(Complete)*

- Single-binary `vaelspire` (`clap` CLI + Axum HTTP server): `serve`, `migrate`, `keygen`, `admin bootstrap`.
- Reverse-proxy `/forward-auth` verifying session cookies and API keys (`Authorization: Bearer` / `X-API-Key`) and emitting trusted `X-Vaelspire-*` identity headers.
- Built-in Prometheus `/metrics`, `/health`, `/ready`, and `/.well-known/vaelspire`.
- Zero-friction setup scripts (`scripts/dev-setup.sh`, `scripts/quickstart.sh`, `scripts/smoke-test.sh`, `scripts/demo.sh`), multi-stage Docker + Compose, and Caddy / Traefik / Nginx Forward-Auth templates.
- Dedicated Astro Starlight marketing & documentation repository (`neotales/vaelspire-site`) with human guides and dense AI agent reference (`/agents/`, `/llms.txt`, `/llms-full.txt`).

---

## ✅ M3 — OIDC 1.0 Identity Provider, Stateless Verifier & Embedded Core UI *(Core Shipped)*

- **OIDC 1.0 / OAuth 2.0 Identity Provider (`vaelspire-oidc` + server routes):**
  - `/.well-known/openid-configuration` & rotating `EdDSA` (`Ed25519`) JWKS with RFC 7638 thumbprints
  - Authorization Code + PKCE `S256` (`/oauth2/authorize`, `/oauth2/token`), Refresh Token Rotation with family reuse revocation, `/oauth2/userinfo`, `/oauth2/introspect`, `/oauth2/revoke`
  - OIDC Client Registry (`/admin/oidc/clients`) with exact-match redirect URIs and keyed BLAKE3 secrets for **Vaelsgard** and third-party SSO
  - Thin zero-DB stateless JWKS verifier crate (`vaelspire-verify`)
- **Embedded Web UI (`ui/` + `--features embed-ui`) & External UI Mode:**
  - SvelteKit (`adapter-static`) + Tailwind console (Overview, Login, Register, OIDC Consent, Account/Sessions/API Keys, Core Admin Console)
  - Runtime `--ui-mode embedded|external|api-only` toggle for Core vs. Enterprise CDN deployments
- **Desktop Companion Architecture (`apps/vaelspire-desktop`):**
  - Isolated **Rune** (`anomalyco/rune`) desktop companion specification cleanly separated from the headless server binary *(implementation tracks Rune's upstream pre-release stabilization)*
- **Next polish before `v0.1.0`:** Wire `--database-url postgres://...` directly into `vaelspire serve` / `migrate` alongside SQLite.

---

## 🔨 M4 — SCIM 2.0, Non-Human Identity (NHI), SAML & Standards Conformance *(Core Shipped, Hardening In Progress)*

- ✅ **SCIM 2.0 Directory Sync (RFC 7644):** `/scim/v2/ServiceProviderConfig` and `/scim/v2/Users` (list, create, fetch, soft-delete)
- ✅ **Non-Human Identity (NHI) / AI Agent Scoped Delegation:** OAuth 2.0 `client_credentials` with strict `allowed_scopes` attenuation and short-lived `EdDSA` tokens
- ✅ **SAML 2.0 IdP Metadata:** `/saml/metadata` (`EntityDescriptor` XML)
- 🧭 **Next:** Full SAML 2.0 assertion signing, OpenID Foundation OIDC Conformance Suite in CI with badge, delegated multi-org admin portals, and commissioning the official fantasy **Spire & Dragon** vector logo.

---

## ✅ M5 — Vaelspire Enterprise Foundations (`enterprise/`) *(Core Modules Implemented)*

Isolated proprietary Cargo workspace (`enterprise/Cargo.toml`, governed by `LICENSE-ENTERPRISE`) implementing `vaelspire-core::extensions`:

- ✅ **`vaelspire-license`:** Offline Ed25519 `.vlic` signing & verification (`LicenseGate`) with guaranteed **never-brick-logins** graceful expiry (`allows_login() == true` always)
- ✅ **`vaelspire-worm`:** Tamper-evident SHA-256 hash-chained `AuditSink` + chain verifier + cloud Object Lock payload builders (**AWS S3 Object Lock**, **Azure Immutable Blob**, **GCS Bucket Lock**)
- ✅ **`vaelspire-telemetry`:** Bounded, non-blocking `TelemetrySink` with **OpenTelemetry OTLP JSON**, **Splunk HEC NDJSON**, and **Datadog Logs** batch formatters
- ✅ **`vaelspire-georep`:** Lock-free EU/US/APAC tenant data-residency pinning (`RegionPolicy`) + ordered cross-region replication outbox envelopes (`ReplicationHook`)
- 🧭 **Next:** Wire live HTTP/mTLS transport daemons for cloud bucket uploaders, SIEM push workers, and peer-region active-active sync.

---

## ☁️ M6 — Managed Cloud, Formal Audits & FIPS 140-3 *(Revenue-Funded)*

- **Vaelspire Cloud (Managed SaaS):** Multi-region managed hosting with free developer tier, predictable CIAM/MAU and B2B org pricing, automated backups, and DDoS/bot protection
- **Revenue-Funded Security Audits:** Independent third-party penetration tests and formal security audits (reports available under NDA for Enterprise customers)
- **Regulated Compliance Packaging:** **FIPS 140-3** validated builds (`aws-lc-rs` FIPS module), SOC 2 Type II, ISO 27001, signed SBOMs, and dedicated enterprise CVE SLAs
