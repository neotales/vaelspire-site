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
  - SvelteKit (`adapter-static`) + Tailwind console (Overview, Login, Register, OIDC Consent, Account/Passkeys/GDPR, Admin, Org SSO, RBAC)
  - Runtime `--ui-mode embedded|external|api-only` toggle for Core vs. Enterprise CDN deployments
- **Desktop Companion Architecture (`apps/vaelspire-desktop`):**
  - Isolated **Rune** (`anomalyco/rune`) desktop companion specification cleanly separated from the headless server binary *(implementation tracks Rune's upstream pre-release stabilization)*

---

## ✅ M3.5 — Production Hardening, GDPR Auditing, Passkeys, Per-App RBAC & Full CLI *(Shipped)*

- ✅ **PII-Safe Redacted Logging:** `vaelspire_core::privacy` logs `user_id` (`UUIDv7`) + redacted email (`wf******@domain.com`) via `--pii-log-mode masked|id-only|full` with strict log-level hygiene.
- ✅ **GDPR Compliance:** Right to Erasure (`DELETE /account/erase`, `POST /admin/gdpr/erase/{id}`, `vaelspire user gdpr-erase`) anonymizing PII (`erased-<id>@deleted.invalid`) while preserving append-only `auth_audit`; Right of Access JSON export (`GET /account/export`, `vaelspire user export`); IP subnet truncation (`--audit-ip-mode full|truncated|none`).
- ✅ **Sliding & Hard Session Expirations:** Configurable `session_sliding` / `--session-fixed`, `--session-idle-secs`, and `--session-max-secs` enforced via `UUIDv7` creation timestamp in `vaelspire-auth::Policy`.
- ✅ **Trusted IP Collection & Anomaly Detection:** Explicit `--ip-source` (`direct`, `x-forwarded-for`, `cf-connecting-ip`, `forwarded`) + `--trusted-proxies` CIDR allow-list; Core `AnomalyDetector` (password spray, unseen device/subnet, OIDC refresh-token reuse) and expanded bounded-cardinality `/metrics`.
- ✅ **Reusable Multi-Sink Alerting (`vaelspire-alerts`):** Zero-Vaelspire-coupling MIT alert router supporting **Webhook (HMAC-SHA256)**, **Slack**, **Discord**, **Microsoft Teams**, **Gotify**, **ntfy**, **Twilio/Generic SMS**, and **SMTP Email**, wired into Vaelspire anomaly/GDPR events and `vaelspire alert test` *(planned for future extraction into a standalone generic `neotales-alerts` crate)*.
- ✅ **End-to-End Passkeys (WebAuthn):** Wired `--features passkey`, `--rp-id` / `--rp-origin`, and browser WebAuthn registration & sign-in flows into `/ui/account` and `/ui/login`.
- ✅ **Full RBAC (Org-Wide & Per-App Roles, Groups & Permissions):** Nullable `app_id` on `vs_app_role` & `vs_app_permission`, permission-to-role & group-to-role grants, `/admin/rbac/*` endpoints, `/ui/rbac` console, and projection into OIDC UserInfo & `/forward-auth` (`X-Vaelspire-Roles`, `X-Vaelspire-Groups`).
- ✅ **Persistent OIDC Clients & Operator CLI (`vaelspire`):** Persisted OIDC clients in `vs_oidc_client` + full CLI subcommands (`user`, `org`, `rbac`, `audit`, `admin`, `serve`, `migrate`, `keygen`).
- 🧭 *Remaining pre-`v0.1.0` polish:* Wire `--database-url postgres://...` directly into `vaelspire serve` and `vaelspire migrate` alongside SQLite.

---

## ✅ M4 — Self-Service Org IdP, Domain Policies, Directory Sync & NHI *(Core Shipped)*

- ✅ **Self-Service Organization / Client IdP Portal:** `/org/portal/{policy,domains,idps,scim-tokens}` + `/ui/org` console for upstream **OIDC** or **SAML 2.0** IdPs, dry-run validation (`POST /org/portal/idps/{id}/test`), JIT provisioning, group claim mapping, and break-glass local admin toggle.
- ✅ **Domain Verification & Email Policies:** DNS TXT verification (`_vaelspire-verify.<domain>`) + per-organization email policies (`allow_public`, `business_domains_only`, `verified_domains_only`) + Home Realm Discovery (`POST /auth/discover`).
- ✅ **Directory Sync (SCIM 2.0 Users & Groups):** `/scim/v2/ServiceProviderConfig`, `/scim/v2/Users` (with `PATCH active=false` immediate session revocation), `/scim/v2/Groups` (RFC 7644 `PatchOp` member sync), and per-org scoped `vs_scim_...` bearer tokens.
- ✅ **Non-Human Identity (NHI) & SAML Metadata:** OAuth 2.0 `client_credentials` with strict `allowed_scopes` attenuation + `/saml/metadata`.
- 🧭 *Next:* Full signed SAML 2.0 assertions, OpenID Foundation OIDC Conformance Suite in CI, and commissioning the official fantasy **Spire & Dragon** vector logo.

---

## ✅ M4.5 — Low-Cost Edge (Cloudflare Workers + D1 / Containers) & Kubernetes *(Foundations Shipped)*

- ✅ **Cloudflare D1 Store Crate (`crates/vaelspire-store-d1`):** Pure-Rust, zero-native-C, `wasm32`-clean `AuthStore` adapter (`D1Store`, `D1Client`, `D1_SCHEMA_SQL`).
- ✅ **Cloudflare Workers + Containers Templates (`deploy/cloudflare/`):** Workers + D1 template (`wrangler.toml`, `schema.sql`, edge gateway) and Cloudflare Containers (`wrangler.jsonc` running `deploy/Dockerfile` with `--ip-source cf-connecting-ip`).
- ✅ **Kubernetes Helm Chart (`deploy/helm/vaelspire/`):** Hardened non-root Deployment, Service, Ingress, HPA (`autoscaling/v2`), PodDisruptionBudget, NetworkPolicy, Secret, and Prometheus `ServiceMonitor`.

---

## ✅ M5 — Vaelspire Enterprise Foundations *(Separate Private Repo: `neotales/vaelspire-enterprise`)*

Proprietary commercial Cargo workspace maintained completely separately from the 100% MIT `neotales/vaelspire` repo, implementing `vaelspire-core::extensions`:

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
