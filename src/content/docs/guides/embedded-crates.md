---
title: Embeddable Rust Crates
description: Embed Vaelspire directly inside your Rust application (Better-Auth style) without running a separate auth service.
---

If you are building a Rust service (like **Vaelsgard** or an internal API) and do not want to operate a separate auth process, embed Vaelspire's MIT crates directly.

## Crate Map

| Crate | Role |
| :--- | :--- |
| `vaelspire-core` | Zero-I/O domain types (`Id`, `Timestamp`, `User`, `Session`, `AuthError`) and `AuthStore` trait |
| `vaelspire-auth` | Workflows: Argon2id + bcrypt upgrade, BLAKE3 keyed digests, sessions, TOTP MFA, Passkeys, API keys, email sign-in, social/OIDC client |
| `vaelspire-axum` | Fail-closed Axum 0.8 router, cookies, CSRF, origin allow-list, `spawn_blocking` Argon2 |
| `vaelspire-email` | Async `Sender` hook (accepts closures) + optional `lettre` SMTP (`feature = "smtp"`) |
| `vaelspire-store-sqlite` | Embedded SQLite over `neotales-dbapi` + `neotales-migration-sqlite` |
| `vaelspire-store-postgres` | PostgreSQL 17+ over `neotales-dbapi-postgres` + `neotales-migration-postgres` |

## Minimal Axum Mount (SQLite)

```rust
use std::sync::Arc;
use axum::Router;
use vaelspire_axum::AuthRouter;
use vaelspire_core::{AuthStore, Id, Timestamp};
use vaelspire_store_sqlite::open;

pub async fn build_router(digest_key: [u8; 32]) -> Result<Router, Box<dyn std::error::Error>> {
    let store = Arc::new(open("app.sqlite").await?);
    let tenant = Id::now_v7();
    store.create_tenant(tenant, "my-app", Timestamp::now_utc()).await?;

    let auth = AuthRouter::new(Arc::clone(&store), tenant, digest_key, true)
        .allowed_origins(["https://app.example.com"])
        .auditing(true)
        .roles(true)
        .api_keys(Some("vsp"))?
        .on_proof(|email, kind, token| {
            // Hand to vaelspire-email::Sender. Never log `token`.
            let _ = (email, kind, token);
        })
        .into_router();

    Ok(Router::new().nest("/auth", auth))
}
```

## Switching to PostgreSQL

Replace `vaelspire_store_sqlite::open` with `vaelspire_store_postgres::open(pool)`. Both adapters pass the identical black-box conformance suite (`crates/conformance.rs`) over `neotales-dbapi`.

## Feature-Gated Binary Size

`vaelspire-auth` and `vaelspire-axum` compile out unused routes and crypto completely:
- Default features: `password`, `session`
- Opt-in features: `apikeys`, `email-signin`, `mfa`, `passkey`, `social`, `oidc`
- Example API-key-only build: `--no-default-features --features apikeys` links zero Argon2 or bcrypt code.
