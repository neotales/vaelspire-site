---
title: How Vaelspire Compares
description: Technical comparison of Vaelspire against Authentik, Keycloak, Auth0, WorkOS, and Better Auth — footprint, licensing, embeddability, and Enterprise compliance.
---

Choosing an identity platform usually forces a painful trade-off: **heavy JVM/Python monoliths** you have to babysit, **proprietary SaaS with per-MAU and SSO taxes**, or **library-only auth** that cannot act as a standalone OIDC IdP or reverse-proxy gateway.

Vaelspire bridges both worlds in a single `#![forbid(unsafe_code)]` Rust codebase: **embeddable MIT crates** when you want zero extra services, and a **single-binary OIDC IdP + `/forward-auth` server** when you want centralized SSO across your apps.

## Side-by-Side Comparison

| Dimension | **Vaelspire** | **Authentik** | **Keycloak** | **Auth0** | **WorkOS** | **Better Auth** |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Runtime & Memory** | **Single Rust binary** (~15–30 MB RAM) | Python + Go + PostgreSQL + Redis (~1.5+ GB RAM) | JVM / Quarkus + DB (~512 MB–2 GB RAM) | Closed SaaS | Closed SaaS | TypeScript / Node library |
| **Embeddable in App?** | **Yes** (`vaelspire-auth`, `vaelspire-axum`, SQLite/Postgres crates) | No | No | No | No | Yes (TS/JS only) |
| **Standalone OIDC IdP + `/forward-auth`** | **Yes** (single binary + optional embedded SvelteKit UI) | Yes | OIDC/SAML only (needs OAuth2 Proxy for forward-auth) | OIDC/SAML SaaS | B2B SSO/SCIM SaaS | Plugin-based, app-bound |
| **Core Security Pricing** | **100% Free MIT** (Zero SSO Tax — MFA, Passkeys, OIDC, SCIM, NHI, RBAC) | Open-core (MIT/Commercial) | Apache 2.0 | Paid SSO / Enterprise tiers | Per-connection SSO/SCIM pricing | MIT |
| **Stateless JWT Verification** | **`vaelspire-verify`** (Ed25519 JWKS, zero DB hops) | External JWKS | External JWKS | External JWKS | External JWKS | Session/JWT |
| **AI Agent / Non-Human Identity** | First-class OAuth 2.0 `client_credentials` + strict scope attenuation | M2M tokens | Service accounts | M2M (extra metered pricing) | API keys | API keys plugin |
| **Air-Gapped Offline Enterprise** | **Yes** (Ed25519 `.vlic` — **never bricks logins** on expiry) | Enterprise license | Community / RHSSO | SaaS only | SaaS only | N/A |
| **WORM Immutable Audit Storage** | Enterprise (`S3 Object Lock`, `Azure Immutable Blob`, `GCS Bucket Lock`, hash-chained) | Event export | Event listeners | Log streams (paid) | Audit Logs (paid) | DIY |

## When Vaelspire Is the Right Fit

- **Rust & Polyglot Builders:** Embed `vaelspire-auth` directly in a Rust/Axum app *or* run one `vaelspire` binary in front of Go, Python, Node, and Rust apps via `/forward-auth` and OIDC 1.0.
- **Homelabs, Self-Hosters & Lean Teams:** Start with zero external dependencies (embedded SQLite + optional embedded Web UI) and graduate to PostgreSQL HA without rewriting your auth layer.
- **B2B SaaS & Regulated Enterprises:** Avoid the "SSO Tax" for core security while getting cleanly isolated Enterprise modules for **multi-region data residency (EU/US/APAC)**, **WORM immutable compliance archives**, and **SIEM/OpenTelemetry pipelines**.
