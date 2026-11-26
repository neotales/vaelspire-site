---
title: Vaelspire Roadmap
description: Public milestone roadmap for Vaelspire Core (MIT) and Vaelspire Enterprise — from embeddable Rust crates and OIDC/SCIM to GDPR auditing, Passkeys, per-app RBAC, self-service org IdP, Cloudflare D1/Containers, Kubernetes, and FIPS 140-3.
---

Vaelspire is built in focused, shippable milestones — **dogfooding our own apps (including Vaelsgard) first**, keeping core security **100% free and MIT-licensed**, enabling **ultra-low-cost edge & container deployments**, and funding formal enterprise compliance through real commercial adoption.

> **Release Policy:** Documentation in [`neotales/vaelspire-site`](https://github.com/neotales/vaelspire-site) (human guides, Roadmap, and dense AI agent pages `/agents/` + `/llms-full.txt`) is always updated and verified **before** any `vaelspire` release tag is cut.

---

## ✅ M1 — Foundation & Embeddable Rust Crates *(Complete)*

- Graduated and renamed `neotales-x-auth*` into 6 MIT Open-Core crates over `neotales-dbapi` and `neotales-migration`:
  - `vaelspire-core`, `vaelspire-auth`, `vaelspire-axum`, `vaelspire-email`, `vaelspire-store-sqlite`, `vaelspire-store-postgres`
- Argon2id + legacy bcrypt auto-upgrade, keyed BLAKE3 digests, `Zeroizing` secret hygiene, TOTP MFA (AES-256-GCM), Passkeys/WebAuthn library workflows, API keys, email sign-in, social/OIDC client, tenants/roles/groups schema foundations, and transactional append-only audit rows.
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
  - Thin zero-DB stateless JWKS verifier crate (`vaelspire-verify`, `wasm32`-clean)
- **Embedded Web UI (`ui/` + `--features embed-ui`) & External UI Mode:**
  - SvelteKit (`adapter-static`) + Tailwind console (Overview, Login, Register, OIDC Consent, Account/Sessions/API Keys, Core Admin Console)
  - Runtime `--ui-mode embedded|external|api-only` toggle for Core vs. Enterprise CDN deployments
- **Desktop Companion Architecture (`apps/vaelspire-desktop`):**
  - Isolated **Rune** (`anomalyco/rune`) desktop companion specification cleanly separated from the headless server binary *(implementation tracks Rune's upstream pre-release stabilization)*

---

## 🔨 M3.5 — Production Hardening, GDPR Auditing, Passkeys, Per-App RBAC & Full CLI *(Next — Pre-`v0.1.0`)*

Everything required so `v0.1.0` is production-grade with zero large rewrites later:

### Auditing, Log Levels, GDPR, Anomaly Detection & Metrics
- **PII-Safe Redacted Logging:** Always log `user_id` (`UUIDv7`) + redacted email (`wf******@domain.com`, showing only leading characters + domain) via configurable log policy (`masked`, `id-only`, or `full` for local dev). Strict log-level hygiene (`ERROR`, `WARN`, `INFO`, `DEBUG`/`TRACE`) with zero secrets/tokens ever logged.
- **GDPR Compliance:** Right to Erasure (`DELETE /user` + `vaelspire user gdpr-erase`) anonymizing `auth_user` PII while preserving append-only `auth_audit` integrity via pseudonymous `actor_id`; Right of Access data export (`GET /account/export`); configurable IP address retention & subnet truncation (`/24` IPv4, `/48` IPv6).
- **Sliding & Hard Session Expirations:** Configurable `session_idle_timeout` (sliding extension with throttled `session_refresh_window` DB writes) + `session_absolute_timeout` (hard cap from `created_at`) + toggleable `fixed` vs. `sliding` policy.
- **Trusted IP Collection & Anomaly Detection:** Explicit `--ip-source` (`direct`, `x-forwarded-for`, `cf-connecting-ip`, `forwarded`) + `--trusted-proxies` CIDR allow-list; per-IP password-spray/credential-stuffing detection, unseen device/IP alerts, refresh-token reuse alerts, and optional local GeoLite2 impossible-travel checks.
- **Expanded Prometheus `/metrics`:** Bounded-cardinality counters & histograms for auth outcomes, OIDC grants, lockouts, anomalies, Argon2 duration, and active sessions (zero high-cardinality PII labels).

### End-to-End Passkeys, Per-App RBAC & Operator CLI
- **End-to-End Passkeys (WebAuthn):** Wire `passkey` feature + `--rp-id` / `--rp-origin` into `crates/vaelspire` and add WebAuthn registration & sign-in ceremonies to `/ui/account` and `/ui/login`.
- **Full RBAC (Org-Wide & Per-App Roles, Groups & Permissions):**
  - Nullable `app_id` on `auth_role` & `auth_permission` (organization-wide + per-OIDC-application roles/permissions)
  - Permission-to-role assignment (`auth_role_permission`) and group-to-role assignment (`auth_group_role`)
  - Effective role/group/permission resolution projected cleanly into OIDC JWT claims and `/forward-auth` headers
- **Persistence & Postgres Parity:** Persist OIDC clients in `AuthStore` and wire `--database-url postgres://...` into `vaelspire serve` and `vaelspire migrate` alongside SQLite.
- **Full Operator Management CLI (`vaelspire`):** Local direct-DB mode AND remote HTTP API profile mode covering `user`, `org`, `client`, `role`, `perm`, `group`, `api-key`, `audit`, and `status`.

---

## 🧭 M4 — Self-Service Org IdP, Domain Policies, Directory Sync & Standards Conformance

- **Self-Service Organization / Client IdP Portal:** Delegated org admin portal (`/ui/org/sso`) letting customer organizations self-configure upstream **OIDC** or **SAML 2.0** IdPs, test connections in dry-run mode, map IdP claims to Vaelspire groups/roles, enable JIT provisioning, and maintain a break-glass local admin bypass.
- **Domain Verification & Email Policies:** DNS TXT verification (`_vaelspire-verify.<domain>`) + per-organization signup policies:
  - `allow_public` (allow consumer providers like Gmail/Outlook/iCloud)
  - `business_domains_only` (block free/disposable consumer email domains)
  - `verified_domains_only` (restrict strictly to verified org domains + automatic **Home Realm Discovery**)
- **Directory Sync (SCIM 2.0):**
  - ✅ Shipped: `/scim/v2/ServiceProviderConfig` and `/scim/v2/Users` (list, create, fetch, soft-delete)
  - 🧭 Next: `/scim/v2/Groups` sync, per-org scoped SCIM bearer tokens (Okta, Entra ID, Google Workspace, JumpCloud), and instant session/token revocation on offboarding
- **Non-Human Identity (NHI) / AI Agents:**
  - ✅ Shipped: OAuth 2.0 `client_credentials` with strict `allowed_scopes` attenuation
  - 🧭 Next: Delegated agent chains and per-workload policy budgets
- **SAML 2.0 & OpenID Conformance:**
  - ✅ Shipped: `/saml/metadata` (`EntityDescriptor` XML)
  - 🧭 Next: Full signed SAML 2.0 assertions + automated OpenID Foundation OIDC Conformance Suite in CI with published badge
- **Brand Identity:** Official fantasy **Spire & Dragon** vector logo and wordmark lockups

---

## 🌐 M4.5 — Low-Cost Edge (Cloudflare Workers + D1 / Containers) & Kubernetes

- **Cloudflare Workers + D1 (`vaelspire-store-d1`):**
  - Keep `vaelspire-core` and `vaelspire-verify` strictly pure-Rust & `wasm32`-clean
  - Implement a **Cloudflare D1** `AuthStore` adapter and edge Worker entrypoint (with WebCrypto/configurable KDF or hybrid hashing offload to respect Worker CPU/128 MB isolate limits) for ultra-low-cost serverless hosting
- **Cloudflare Containers & Hybrid Edge:**
  - Official deployment config running the native Linux static `vaelspire` binary on **Cloudflare Containers** (full SIMD Argon2id, Passkeys, OIDC, embedded UI) paired with an optional `vaelspire-verify` Wasm Worker for sub-millisecond edge JWT validation across Cloudflare's global PoPs
- **Containers & Kubernetes (K8s):**
  - Hardened minimal OCI container images (distroless/scratch)
  - Official **Helm chart** (PostgreSQL HA, HPA autoscaling, PodDisruptionBudgets, NetworkPolicies, Prometheus `ServiceMonitor`) and future Kubernetes operator CRDs for declarative org/client management

---

## ✅ M5 — Vaelspire Enterprise Foundations (`enterprise/`) *(Core Modules Implemented)*

Isolated proprietary Cargo workspace (`enterprise/Cargo.toml`, governed by `LICENSE-ENTERPRISE`) implementing `vaelspire-core::extensions`:

- ✅ **`vaelspire-license`:** Offline Ed25519 `.vlic` signing & verification (`LicenseGate`) with guaranteed **never-brick-logins** graceful expiry (`allows_login() == true` always)
- ✅ **`vaelspire-worm`:** Tamper-evident SHA-256 hash-chained `AuditSink` + chain verifier + cloud Object Lock payload builders (**AWS S3 Object Lock**, **Azure Immutable Blob**, **GCS Bucket Lock**)
- ✅ **`vaelspire-telemetry`:** Bounded, non-blocking `TelemetrySink` with **OpenTelemetry OTLP JSON**, **Splunk HEC NDJSON**, and **Datadog Logs** batch formatters
- ✅ **`vaelspire-georep`:** Lock-free EU/US/APAC tenant data-residency pinning (`RegionPolicy`) + ordered cross-region replication outbox envelopes (`ReplicationHook`)
- 🧭 **Next:** Wire live HTTP/mTLS transport daemons for cloud bucket uploaders, SIEM push workers, cross-region anomaly correlation, and peer-region active-active sync.

---

## ☁️ M6 — Managed Cloud, Formal Audits & FIPS 140-3 *(Revenue-Funded)*

- **Vaelspire Cloud (Managed SaaS):** Multi-region managed hosting with free/low-cost developer tier, predictable CIAM/MAU and B2B org pricing, automated backups, and DDoS/bot protection
- **Revenue-Funded Security Audits:** Independent third-party penetration tests and formal security audits (reports available under NDA for Enterprise customers)
- **Regulated Compliance Packaging:** **FIPS 140-3** validated builds (`aws-lc-rs` FIPS module), SOC 2 Type II, ISO 27001, signed SBOMs, and dedicated enterprise CVE SLAs
