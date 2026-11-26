---
title: 60-Second Quickstart
description: Boot Vaelspire Core locally with one command, sign in, and verify /forward-auth and /metrics.
---

Get a live **Vaelspire Core** server running locally with embedded SQLite in under a minute — zero external database or Docker setup required.

## Prerequisites

- **Rust 1.100+** (`rustup` or `mise`)
- `curl` (for the live smoke check)

## 1. One-Command Local Setup

From the root of the `vaelspire` repository:

```bash
./scripts/dev-setup.sh
```

What `dev-setup.sh` does for you:
1. Compiles the single `vaelspire` binary (`cargo build -p vaelspire`).
2. Generates a fresh 256-bit `VAELSPIRE_AUTH_KEY` via `vaelspire keygen` and writes a local `.env` (mode `0600`, never overwriting an existing `.env`).
3. Runs SQLite migrations via `neotales-migration-sqlite`.
4. Idempotently bootstraps the `default` tenant and initial `owner` administrator account.

## 2. Start the Server

```bash
./scripts/quickstart.sh
```

Vaelspire listens on `http://127.0.0.1:8080` with:
- Auth routes (`/sign-up`, `/sign-in`, `/sign-out`, `/session`, `/sessions`, `/api-keys`, RBAC)
- Reverse-proxy verification at `/forward-auth`
- Prometheus exposition at `/metrics`
- Probes at `/health`, `/ready`, and `/.well-known/vaelspire`

## 3. Run the Live End-to-End Smoke Test

In a second terminal:

```bash
./scripts/smoke-test.sh
```

This script verifies:
1. `GET /health` and `GET /ready` return `200 OK`
2. `GET /metrics` returns Prometheus counters
3. Anonymous `GET /forward-auth` returns `401 Unauthorized`
4. `GET /session` issues the `neotales.csrf` cookie
5. `POST /sign-in` authenticates the bootstrapped admin and sets the `HttpOnly` session cookie
6. Authenticated `GET /forward-auth` returns `200 OK` with `X-Vaelspire-User-Id`, `X-Vaelspire-Email`, `X-Vaelspire-Tenant-Id`, and `X-Vaelspire-Auth-Method: session`
7. `POST /sign-out` revokes the session so `GET /forward-auth` immediately returns `401` again

## Manual CLI Flow (No Scripts)

```bash
export VAELSPIRE_AUTH_KEY=$(cargo run -p vaelspire -- keygen)
export VAELSPIRE_ADMIN_EMAIL="admin@vaelspire.local"
export VAELSPIRE_ADMIN_PASSWORD="change-me-in-production"

cargo run -p vaelspire -- serve \
  --bind 127.0.0.1:8080 \
  --sqlite .vaelspire/vaelspire.sqlite \
  --insecure-http
```

> **Production reminder:** Omit `--insecure-http` behind TLS so session and CSRF cookies are always marked `Secure`, and set `--allowed-origins` explicitly to your production frontend origin(s).
