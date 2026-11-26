---
title: Security Architecture
description: Cryptographic primitives, fail-closed HTTP defaults, secret zeroization, and transactional audit guarantees in Vaelspire.
---

Vaelspire treats security as a **free, non-negotiable baseline** enforced at compile time and runtime.

## Compile-Time & Memory Guarantees

- **`#![forbid(unsafe_code)]`** workspace-wide on Rust `1.100` (edition 2024).
- **Secret zeroization:** Issued tokens (`Secret`), digest keys, MFA secrets, email proof messages, and HTTP password request bodies use `Zeroizing` and redacted `Debug` implementations (`Secret([REDACTED])`).
- **Library crates never log:** `vaelspire-core`, `vaelspire-auth`, `vaelspire-axum`, and store crates return opaque `AuthError` codes (`Unauthorized`, `NotFound`, `Invalid`, `Conflict`, `Store`, `Unsupported`) and never emit submitted credentials to logs.

## Cryptography & Storage at Rest

| Secret | Storage Format | Notes |
| :--- | :--- | :--- |
| **Passwords** | Argon2id PHC (`argon2` 0.6 defaults: 19 MiB, t=2, p=1) | Legacy bcrypt (`$2`) verifies and transparently rewrites to Argon2id on login |
| **Sessions, Proofs, Invitations, API Keys** | Versioned keyed **BLAKE3** digest (version byte `0x01` + 32-byte digest) | Domain-separated (`domain || 0x00 || token`). Raw bearer values are never stored |
| **TOTP MFA Secrets** | **AES-256-GCM** ciphertext bound to `user_id` AAD | Key ID persisted alongside ciphertext; constant-time code verify via `subtle` |

## Fail-Closed HTTP Mount

- **`cookie_secure` is mandatory** in `AuthRouter::new` — no silent cleartext cookie default.
- **`Origin` allow-list** runs on every state-changing route before reading the body. Default accepts only `http://localhost`, `http://127.0.0.1`, and `http://[::1]`; an empty list refuses all state-changing requests.
- **Double-submit CSRF** compares `neotales.csrf` cookie with `x-csrf-token` header on every state-changing route.
- **Argon2 off the async worker:** `vaelspire-auth` splits CPU hashing from async store calls; `vaelspire-axum` runs Argon2 inside `tokio::task::spawn_blocking` so concurrent logins never stall the runtime.
- **Proof routes fail closed:** Token-minting routes return `404` unless `.on_proof(...)` is explicitly wired.
- **No open redirects on `/forward-auth`:** Redirects are permitted only to a static server-configured `--forward-auth-login-url`, never an arbitrary query parameter.

## Transactional Append-Only Audit Log

When auditing is enabled (on by default in `vaelspire serve`), every identity mutation commits its `auth_audit` row **inside the same database transaction** as the mutation. SQLite triggers (`auth_audit_no_update`, `auth_audit_no_delete`) enforce immutability at the database layer.
