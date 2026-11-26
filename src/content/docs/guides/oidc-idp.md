---
title: OIDC 1.0 Identity Provider & SSO
description: Configure Vaelspire as an OpenID Connect 1.0 / OAuth 2.0 Identity Provider with Ed25519 JWKS, PKCE S256, Refresh Token Rotation, and stateless vaelspire-verify verification.
---

Vaelspire Core ships a complete, MIT-licensed **OpenID Connect 1.0 and OAuth 2.0 Identity Provider (IdP)** built on `vaelspire-oidc` and verified statelessly with `vaelspire-verify`.

Use it to power single sign-on (SSO) for **Vaelsgard**, Grafana, internal dashboards, mobile/desktop apps, and third-party SaaS tools — with **zero SSO tax**.

## Discovery & Protocol Endpoints

Every running `vaelspire serve --issuer https://auth.example.com` exposes:

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/.well-known/openid-configuration` | `GET` | OIDC Discovery 1.0 JSON metadata |
| `/.well-known/jwks.json` | `GET` | Rotating `EdDSA` (`Ed25519`, `OKP`) public JSON Web Key Set with RFC 7638 `kid` thumbprints |
| `/oauth2/authorize` | `GET` | Authorization Code + PKCE (`S256`) endpoint |
| `/oauth2/token` | `POST` | Token exchange (`authorization_code`, `refresh_token`, `client_credentials`) |
| `/oauth2/userinfo` | `GET` | OIDC UserInfo claims for Bearer access tokens |
| `/oauth2/introspect` | `POST` | RFC 7662 token introspection |
| `/oauth2/revoke` | `POST` | RFC 7009 token & refresh family revocation |
| `/admin/oidc/clients` | `GET` / `POST` | List and register OIDC applications |

## Register an OIDC Application (e.g., Vaelsgard)

Authenticate with an admin session cookie or `Authorization: Bearer vs_...` API key, then register a client via `/admin/oidc/clients` (or use the **Embedded Admin Console** at `/ui/admin`):

```bash
curl -sS -X POST http://127.0.0.1:8080/admin/oidc/clients \
  -H "Authorization: Bearer $VAELSPIRE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "vaelsgard",
    "name": "Vaelsgard Platform",
    "confidential": true,
    "redirect_uris": ["https://vaelsgard.example.com/auth/callback"],
    "allowed_scopes": ["openid", "email", "profile", "offline_access"]
  }'
```

Confidential clients return a one-time `client_secret` hashed at rest with keyed BLAKE3. Redirect URIs are matched **byte-for-byte** (exact match only — wildcard open-redirects are rejected).

## Security Guarantees Built In

- **PKCE `S256` Enforced:** Authorization codes are single-use, short-lived, and verified against SHA-256 `code_challenge`.
- **Refresh Token Rotation + Reuse Detection:** Presenting an already-rotated refresh token automatically revokes the **entire token family**, stopping stolen-token replay cold.
- **Rotating Ed25519 JWKS:** Access tokens and ID tokens are signed with `EdDSA` (`Ed25519`), letting resource servers verify tokens locally in microseconds with zero database queries.

## Stateless Verification in Downstream Rust Apps (`vaelspire-verify`)

Downstream services do not need to call Vaelspire on every HTTP request. Fetch `/.well-known/jwks.json` once, cache it, and verify JWTs locally with `vaelspire-verify`:

```rust
use vaelspire_verify::{Jwks, TokenVerifier};

let jwks: Jwks = serde_json::from_str(&jwks_json)?;
let verifier = TokenVerifier::new("https://auth.example.com", "vaelsgard")
    .with_jwks(jwks);

let claims = verifier.verify(&bearer_token, now_unix)?;
println!("Authenticated subject={} scopes={:?}", claims.sub, claims.scope);
```

## OIDC Consent UI

When built with `--features embed-ui`, Vaelspire serves a dedicated consent screen at `/ui/consent` that displays the client name, exact callback URI, PKCE status, and requested scopes before forwarding approval to `/oauth2/authorize`.
