---
title: Rust Crate Recipes (Agent Reference)
description: Copy-pasteable, API-exact Rust integration patterns for vaelspire-core, vaelspire-auth, vaelspire-axum, vaelspire-email, and stores.
---

## Recipe 1: Mount `AuthRouter` on SQLite (Fail-Closed)

```rust
use std::sync::Arc;
use axum::Router;
use vaelspire_axum::AuthRouter;
use vaelspire_core::{AuthStore, Id, Timestamp};
use vaelspire_store_sqlite::open;

pub async fn mount_auth(
    db_path: &str,
    digest_key: [u8; 32],
    cookie_secure: bool,
) -> Result<Router, Box<dyn std::error::Error>> {
    let store = Arc::new(open(db_path).await?);
    let tenant = Id::now_v7();
    store.create_tenant(tenant, "default", Timestamp::now_utc()).await?;

    let router = AuthRouter::new(Arc::clone(&store), tenant, digest_key, cookie_secure)
        .allowed_origins(["https://app.example.com"])
        .auditing(true)
        .roles(true)
        .api_keys(Some("vsp"))?
        .on_proof(|email, kind, token| {
            // Deliver via vaelspire_email::Sender; never log `token.expose()`.
            let _ = (email, kind, token);
        })
        .into_router();

    Ok(router)
}
```

## Recipe 2: Off-Worker Password Sign-Up & Sign-In (`vaelspire-auth`)

```rust
use vaelspire_auth::{Auth, Policy, SignInOutcome, hash_password, verify_password};
use vaelspire_core::{AuthError, AuthStore, Id, Timestamp};

pub async fn sign_in_off_worker<S: AuthStore>(
    store: &S,
    digest_key: [u8; 32],
    tenant: Id,
    email: &str,
    password: Vec<u8>,
) -> Result<vaelspire_auth::IssuedSession, AuthError> {
    let now = Timestamp::now_utc();
    let auth = Auth::new(store, digest_key, Policy::default()).auditing(true);

    let attempt = auth.begin_sign_in(tenant, email, now).await?;
    let stored_hash = attempt.password_hash().to_owned();
    let needs_rehash = attempt.needs_rehash();

    let outcome = tokio::task::spawn_blocking(move || -> Result<SignInOutcome, AuthError> {
        if !verify_password(&password, &stored_hash)? {
            return Ok(SignInOutcome::WrongPassword);
        }
        let rehash = if needs_rehash {
            Some(hash_password(&password)?)
        } else {
            None
        };
        Ok(SignInOutcome::Verified { rehash })
    })
    .await
    .map_err(|_| AuthError::Store)??;

    auth.finish_sign_in(attempt, outcome, now).await
}
```

## Recipe 3: Issue & Lookup API Keys (`feature = "apikeys"`)

```rust
use time::Duration;
use vaelspire_auth::ApiKeys;
use vaelspire_core::{AuthError, AuthStore, Timestamp, User};

pub async fn issue_and_verify_key<S: AuthStore>(
    store: &S,
    digest_key: [u8; 32],
    user: &User,
) -> Result<(), AuthError> {
    let now = Timestamp::now_utc();
    let keys = ApiKeys::new(store, digest_key, Some("vsp"))?.auditing(true);
    let raw = keys
        .issue(user, vec!["vault:read".to_owned()], now + Duration::days(30), now)
        .await?;

    let verified = keys.lookup(raw.expose(), now).await?;
    assert_eq!(verified.user_id, user.id);
    assert!(verified.last_used_at.is_some());
    Ok(())
}
```

## Recipe 4: Pure Token Digest (Without Opening a Store)

```rust
use vaelspire_auth::token_digest;

pub fn compute_session_digest(key: &[u8; 32], bearer: &str) -> ([u8; 32], String) {
    // Returns (raw_32_bytes, 64_char_lowercase_hex_without_version_byte)
    token_digest(key, "session", bearer)
}
```

## Recipe 5: PostgreSQL Store Initialization (`vaelspire-store-postgres`)

```rust
use neotales_dbapi_postgres::PostgresPool;
use vaelspire_store_postgres::{OpenError, PostgresStore, open};

pub async fn open_postgres(pool: PostgresPool) -> Result<PostgresStore, OpenError> {
    // Runs advisory-locked neotales-migration-postgres schema check/install
    open(pool).await
}
```
