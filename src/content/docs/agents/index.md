---
title: AI Agent Orientation & Invariants
description: Dense, zero-fluff reference for coding agents integrating, extending, or auditing Vaelspire.
---

> **Audience:** AI coding agents and automated tooling. Prefer this section (or [`/llms-full.txt`](/llms-full.txt)) over narrative guides when writing integrations or patches.

## 1. Repository & Toolchain Facts

- **Repo:** `github.com/neotales/vaelspire` | **Default branch:** `dev` (`main`/`master` do not exist).
- **Rust:** `1.100.0`, edition `2024`, workspace resolver `3`.
- **Workspace lints:** `unsafe_code = "forbid"`, `missing_docs = "warn"`, `clippy::all = "warn"`, `clippy::pedantic = "warn"`.
- **License:** Entire `neotales/vaelspire` repository is 100% MIT (`LICENSE`). Proprietary Enterprise modules live separately in private repo `neotales/vaelspire-enterprise`.
- **Database abstraction:** `neotales-dbapi = "=0.0.0-alpha.0"` and `neotales-migration = "=0.0.0-alpha.0"` (crates.io). Do **not** expose `sqlx` in public APIs.

## 2. Crate Dependency Graph

```text
vaelspire (bin + lib: clap CLI, Axum server, /forward-auth, /metrics, /health, /ready)
 ├── vaelspire-axum (Axum 0.8 router, cookies, CSRF, origin allow-list, spawn_blocking Argon2)
 │    ├── vaelspire-auth (workflows: password, session, mfa, passkey, apikeys, email-signin, social, oidc)
 │    └── vaelspire-core (zero-I/O models, AuthError, AuthStore trait)
 └── vaelspire-store-sqlite (neotales-dbapi-sqlite + neotales-migration-sqlite)

vaelspire-store-postgres (neotales-dbapi-postgres + neotales-migration-postgres, PG 17+)
vaelspire-email (Sender trait + optional lettre SMTP feature)
```

## 3. Feature Flags Matrix

| Crate | Default Features | Optional Features |
| :--- | :--- | :--- |
| `vaelspire-core` | *(none)* | `password`, `session`, `social`, `oidc` |
| `vaelspire-auth` | `password`, `session` | `apikeys`, `email-signin`, `mfa`, `passkey`, `social`, `oidc` |
| `vaelspire-axum` | `password`, `session` | `apikeys`, `email-signin`, `mfa`, `passkey`, `social`, `oidc` |
| `vaelspire-email` | *(none)* | `smtp` (`lettre` + rustls) |
| `vaelspire-store-sqlite` | `sqlx-compat` | `password`, `session`, `mfa`, `passkey`, `social`, `oidc` |
| `vaelspire-store-postgres` | *(none)* | `password`, `session`, `mfa`, `social`, `oidc` |

## 4. Non-Negotiable Invariants (Do Not Violate)

1. **No logging in library crates:** `vaelspire-core`, `vaelspire-auth`, `vaelspire-axum`, `vaelspire-email`, and store crates must **never** log. Return `AuthError` (`Unauthorized | NotFound | Invalid | Conflict | Store | Unsupported`). Only `vaelspire` binary initializes `tracing`.
2. **Never run Argon2 on an async Tokio worker:** `vaelspire-auth` intentionally splits `hash_password`/`verify_password` from `begin_sign_in`/`finish_sign_in`. Always run hashing inside `tokio::task::spawn_blocking`.
3. **Fail-closed HTTP mount:** `AuthRouter::new(store, tenant, digest_key, cookie_secure)` requires an explicit `cookie_secure: bool`. Token-issuing routes return `404` unless `.on_proof(...)` is set.
4. **Origin + CSRF order:** State-changing routes check `Origin` first (`403`), then double-submit CSRF cookie vs. `x-csrf-token` header (`403`). Absent `allowed_origins` allows only `http://localhost`, `http://127.0.0.1`, and `http://[::1]` (any port). Empty `allowed_origins([])` refuses all state-changing requests.
5. **Digest wire contract (cross-language seam):**
   - BLAKE3 keyed with 32-byte `VAELSPIRE_AUTH_KEY`; input = `domain || 0x00 || token`.
   - Domains: `session`, `verify_email`, `reset_password`, `email_otp`, `api_key`, `invitation`, `mfa-recovery`.
   - DB column stores version byte `0x01` + 32-byte digest; `digest_hex()` returns 64 lowercase hex chars without the version byte.
   - Tokens: 32 CSPRNG bytes, base64url unpadded. API keys: `{prefix}_{first_12_uuid_simple}_{secret}`.
6. **Transactional audit:** Mutations pass `Option<AuditEvent>` into the store transaction so mutation + audit row commit or roll back atomically. Never add secret/password/token fields to `AuditEvent`.
7. **Secret memory hygiene:** Wrap passwords, tokens, and keys in `zeroize::Zeroizing` or `vaelspire_auth::Secret`. Redact `Debug` impls.
8. **No DDD / clean-architecture bloat:** Direct functions, flat modules, trait seams only at genuine I/O or Enterprise boundaries.

## 5. Verification Gates

```bash
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --offline -- -D warnings
cargo test --workspace --exclude vaelspire-store-postgres --exclude vaelspire-email --offline
# Full all-features gate (requires OpenSSL headers for webauthn-rs and dbapi-postgres-tls):
cargo clippy --workspace --all-targets --all-features --offline -- -D warnings
```

See also: [HTTP & CLI Contract](/agents/api-reference/) · [Rust Crate Recipes](/agents/crate-recipes/) · [`/llms-full.txt`](/llms-full.txt)
