---
title: Vaelspire Roadmap
description: Public milestone roadmap for Vaelspire Core (MIT) and Vaelspire Enterprise — from embeddable Rust crates and /forward-auth to OIDC IdP, Rune desktop, geo-replication, WORM storage, and FIPS 140-3.
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
- Zero-friction setup scripts (`scripts/dev-setup.sh`, `scripts/quickstart.sh`, `scripts/smoke-test.sh`), multi-stage Docker + Compose, and Caddy / Traefik / Nginx Forward-Auth templates.
- Dedicated Astro Starlight marketing & documentation repository (`neotales/vaelspire-site`) with human guides and dense AI agent reference (`/agents/`, `/llms.txt`, `/llms-full.txt`).

---

## 🔨 M3 — OIDC Identity Provider, Embedded Core UI & Rune Desktop *(Next)*

- **OIDC / OAuth 2.0 Identity Provider (IdP):**
  - `/.well-known/openid-configuration` & rotating Ed25519 / ES256 JWKS endpoint
  - Authorization Code + PKCE (`/oauth2/authorize`, `/oauth2/token`), `/oauth2/userinfo`, `/oauth2/introspect`, `/oauth2/revoke`
  - OAuth client registry & consent screen for first-class **Vaelsgard** and third-party app SSO
  - Thin stateless JWKS verifier crate (`vaelspire-verify`) for zero-hop local token validation
- **Embedded Web UI (Core) & External UI Mode (Enterprise):**
  - SvelteKit (`adapter-static`) + `shadcn-svelte` + Tailwind login, registration, MFA, Passkey, consent, and Core Admin UI
  - Embedded into the `vaelspire` Core binary behind `--features embed-ui`, with `--ui=external` mode for Enterprise CDN / white-label deployments
- **Native Desktop Companion App (`Rune`):**
  - Isolated workspace crate (`apps/vaelspire-desktop`) built with **Rune** (`anomalyco/rune`) for local operator management without pulling GPU dependencies into the headless `vaelspire` server binary
- **PostgreSQL CLI Flag Parity:**
  - Wire `--database-url postgres://...` directly into `vaelspire serve` and `vaelspire migrate` alongside SQLite

---

## 🧭 M4 — Standards Conformance, SAML 2.0, SCIM 2.0 & Organizations

- **OpenID Foundation OIDC Conformance Suite** automated in CI with published conformance badge
- **SAML 2.0 IdP** for legacy enterprise applications
- **SCIM 2.0 Directory Sync** (automated user/group provisioning & deprovisioning)
- **Multi-Tenant Organizations & Delegated Org Admin Portals** (WorkOS-style B2B SaaS ergonomics — free core security, org governance at scale)
- **Non-Human Identity (NHI) / Service Account & AI Agent Scoped Delegation** (short-lived tokens, explicit scope attenuation, audit attribution)
- **Brand Identity:** Official fantasy **Spire & Dragon** vector logo and wordmark lockups

---

## 🏢 M5 — Vaelspire Enterprise (`enterprise/`)

Commercial capabilities gated cleanly behind `vaelspire-core` trait seams and `LICENSE-ENTERPRISE`:

- **Multi-Region Active-Active Geo-Replication:** Unlimited regions, global low-latency session/revocation sync, and per-tenant **data-residency pinning** (EU / US / APAC)
- **WORM Immutable Audit Storage:** Write-Once-Read-Many archival to **AWS S3 Object Lock**, **Azure Immutable Blob**, and **GCS Bucket Lock** (SEC 17a-4 / FINRA / HIPAA), plus multi-year hash-chained retention & auditor export portal
- **Enterprise Telemetry & Real-Time SIEM Streaming:** Native OpenTelemetry distributed tracing + streaming connectors for Splunk, Datadog, Microsoft Sentinel, CrowdStrike, and Kafka
- **Offline Ed25519 Licensing:** Air-gapped signed license files covering region limits, workforce seat packs, and separate high-volume CIAM MAU packs — with a strict **never-brick-logins** graceful enforcement guarantee

---

## ☁️ M6 — Managed Cloud, Formal Audits & FIPS 140-3 *(Revenue-Funded)*

- **Vaelspire Cloud (Managed SaaS):** Multi-region managed hosting with free developer tier, predictable CIAM/MAU and B2B org pricing, automated backups, and DDoS/bot protection
- **Revenue-Funded Security Audits:** Independent third-party penetration tests and formal security audits (reports available under NDA for Enterprise customers)
- **Regulated Compliance Packaging:** **FIPS 140-3** validated builds (`aws-lc-rs` FIPS module), SOC 2 Type II, ISO 27001, signed SBOMs, and dedicated enterprise CVE SLAs
