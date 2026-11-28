---
title: OIDC, SCIM, Embedded UI & Enterprise Contract (Dense)
description: Dense machine-readable reference for Vaelspire OIDC 1.0 IdP, vaelspire-verify, SCIM 2.0, SAML metadata, embedded SvelteKit UI modes, and vaelspire-core::extensions.
---

Dense contract for AI coding agents integrating with Vaelspire's OIDC IdP, SCIM 2.0 directory, SAML metadata, Web UI modes, and Enterprise extension traits.

## 1. New Server CLI Flags & Env Vars

- `--issuer <URL>` / `VAELSPIRE_ISSUER` (default `http://127.0.0.1:8080`): OIDC `issuer` and SAML `entityID`.
- `--ui-mode <embedded|external|api-only>` / `VAELSPIRE_UI_MODE` (default `embedded` when built with `--features embed-ui`, otherwise `api-only`).

## 2. OIDC 1.0 / OAuth 2.0 HTTP Endpoints

| Method | Path | Auth | Notes |
| :--- | :--- | :--- | :--- |
| `GET` | `/.well-known/openid-configuration` | Public | OIDC Discovery 1.0 JSON |
| `GET` | `/.well-known/jwks.json` | Public | RFC 7517 `EdDSA` (`OKP`, `Ed25519`) JWKS with RFC 7638 `kid` |
| `GET` | `/oauth2/authorize` | Session cookie | Query: `response_type=code`, `client_id`, `redirect_uri` (exact match), `scope`, `state?`, `nonce?`, `code_challenge?`, `code_challenge_method=S256` -> `302` with `code` + `state` |
| `POST` | `/oauth2/token` | Client Basic or form/JSON `client_id`+`client_secret` | Supports `grant_type=authorization_code` (PKCE `S256`), `refresh_token` (rotation + reuse revokes family), `client_credentials` (NHI, strict `allowed_scopes` subset) |
| `GET` | `/oauth2/userinfo` | `Authorization: Bearer <access_token>` | Returns `sub`, `email` |
| `POST` | `/oauth2/introspect` | Form or JSON `token` | RFC 7662 `{ active, sub?, scope?, exp?, client_id? }` |
| `POST` | `/oauth2/revoke` | Form or JSON `token` | RFC 7009 revokes access/refresh token family (`200 OK`) |
| `GET` | `/admin/oidc/clients` | Session cookie OR API key | Returns `{ "clients": [...] }` |
| `POST` | `/admin/oidc/clients` | Session cookie OR API key | JSON `{ client_id, name, confidential: bool, redirect_uris, allowed_scopes }` -> `201 { client_id, name, confidential, redirect_uris, allowed_scopes, client_secret? }` |
| `GET` | `/saml/metadata` | Public | `application/samlmetadata+xml` `EntityDescriptor` |

## 3. SCIM 2.0 Endpoints (RFC 7644)

| Method | Path | Auth | Behavior |
| :--- | :--- | :--- | :--- |
| `GET` | `/scim/v2/ServiceProviderConfig` | Public | SCIM capability metadata |
| `GET` | `/scim/v2/Users` | Session cookie OR API key | Returns SCIM `ListResponse` of active tenant users |
| `POST` | `/scim/v2/Users` | Session cookie OR API key | JSON `{ userName, password, active? }` -> `201` SCIM `User` |
| `GET` | `/scim/v2/Users/{id}` | Session cookie OR API key | Fetch SCIM `User` by UUIDv7 (`404` if missing/deleted) |
| `DELETE` | `/scim/v2/Users/{id}` | Session cookie OR API key | Soft-delete user (`204 No Content`) |

## 4. Stateless JWT Verification (`vaelspire-verify`)

```rust
use vaelspire_verify::{Audience, Jwks, TokenVerifier};
let jwks: Jwks = serde_json::from_str(jwks_json)?;
let verifier = TokenVerifier::new("https://auth.example.com", Audience::Single("vaelsgard".into()))
    .with_jwks(jwks);
let claims = verifier.verify(jwt, now_unix)?;
```

- Pure `EdDSA` (`Ed25519`), zero DB access, rejects `alg != EdDSA`, validates `iss`, `aud`, `exp`, `nbf`, `iat`, and `kid` lookup.

## 5. Embedded UI (`--features embed-ui`)

- Built from `ui/` (`SvelteKit` + `@sveltejs/adapter-static`, `paths.base = "/ui"`, `fallback = "index.html"`) into `ui/build/`.
- `UiMode::Embedded` + `--features embed-ui`: `/` -> `307 /ui/`, `/ui/` and `/ui/{*path}` serve static assets or SPA fallback `index.html`.
- `UiMode::External` or `UiMode::ApiOnly`: `/ui/*` returns `404`.
- Note: `cargo test --workspace` (without `--features embed-ui`) requires NO Node/UI build artifacts.

## 6. Extension Trait Seams (`vaelspire_core::extensions`)

- `LicenseGate`: `status(&self, now) -> LicenseStatus`, `allows_feature(&self, feature, now) -> bool`, `allows_login(&self) -> bool { true }` (invariant: NEVER override to false).
- `AuditSink`: `async fn emit(&self, event: &AuditEvent, now: Timestamp) -> Result<(), AuthError>`.
- `TelemetrySink`: `fn record(&self, signal: TelemetrySignal)` (sync, non-blocking).
- `RegionPolicy`: `local_region(&self) -> &str`, `home_region(&self, tenant_id: Id) -> &str`.
- `ReplicationHook`: `async fn on_mutation(&self, event: ReplicationEvent) -> Result<(), AuthError>`.
- Enterprise implementations live in a separate private repository (`neotales/vaelspire-enterprise`): `vaelspire-license`, `vaelspire-worm`, `vaelspire-telemetry`, `vaelspire-georep`.
