---
title: Configuration & CLI Reference
description: All vaelspire CLI subcommands, flags, and VAELSPIRE_* environment variables.
---

The `vaelspire` binary combines administration commands and the HTTP server into a single executable powered by `clap`. Every flag can also be supplied through a `VAELSPIRE_*` environment variable.

## CLI Subcommands

| Command | Purpose |
| :--- | :--- |
| `vaelspire serve` | Start the HTTP server (Auth API, `/forward-auth`, `/metrics`, `/health`, `/ready`) |
| `vaelspire migrate` | Open SQLite, apply/verify migrations, and exit `0` |
| `vaelspire admin bootstrap` | Idempotently create the default tenant and initial `owner` administrator |
| `vaelspire keygen` | Output a cryptographically random 64-character hex digest key (256-bit) |

## Global Options

| Flag | Environment Variable | Default | Notes |
| :--- | :--- | :--- | :--- |
| `--log-format` | `VAELSPIRE_LOG_FORMAT` | `pretty` | `pretty` for local dev, `json` for production log shippers |

## `vaelspire serve` Options

| Flag | Environment Variable | Default | Notes |
| :--- | :--- | :--- | :--- |
| `--bind` | `VAELSPIRE_BIND` | `127.0.0.1:8080` | Socket address to listen on |
| `--sqlite` | `VAELSPIRE_SQLITE_PATH` | `./vaelspire.sqlite` | SQLite database file path |
| `--tenant-name` | `VAELSPIRE_TENANT_NAME` | `default` | Tenant name reused across restarts or created on first run |
| `--auth-key` | `VAELSPIRE_AUTH_KEY` | `<sqlite>.key` | 64 hex chars (32 bytes); auto-generated at mode `0600` beside SQLite when omitted |
| `--insecure-http` | `VAELSPIRE_INSECURE_HTTP` | `false` | Allow non-`Secure` cookies on plain HTTP (local dev only) |
| `--allowed-origins` | `VAELSPIRE_ALLOWED_ORIGINS` | localhost only | Comma-separated exact `Origin` values (scheme + host + port) |
| `--trust-proxy` | `VAELSPIRE_TRUST_PROXY` | `false` | Use first `X-Forwarded-For` entry for audit IP and rate-limit keys |
| `--session-cookie` | `VAELSPIRE_SESSION_COOKIE` | `neotales.session` | Session cookie name |
| `--csrf-cookie` | `VAELSPIRE_CSRF_COOKIE` | `neotales.csrf` | Double-submit CSRF cookie name |
| `--api-key-prefix` | `VAELSPIRE_API_KEY_PREFIX` | `vsp` | 1–16 ASCII alphanumeric or `-` characters |
| `--no-auditing` | `VAELSPIRE_NO_AUDITING` | `false` | Disable transactional append-only `auth_audit` rows |
| `--no-roles` | `VAELSPIRE_NO_ROLES` | `false` | Disable role/permission/group write routes |
| `--rate-limit-max` | `VAELSPIRE_RATE_LIMIT_MAX` | `30` | Max state-changing requests per client IP per window |
| `--rate-limit-window-secs` | `VAELSPIRE_RATE_LIMIT_WINDOW_SECS` | `60` | Fixed rate-limit window duration in seconds |
| `--forward-auth-login-url` | `VAELSPIRE_FORWARD_AUTH_LOGIN_URL` | *(none)* | If set, `/forward-auth` responds `302 Found` to this exact URL instead of `401` |
| `--admin-email` | `VAELSPIRE_ADMIN_EMAIL` | *(none)* | Idempotently bootstrap initial admin on startup (requires password) |
| `--admin-password` | `VAELSPIRE_ADMIN_PASSWORD` | *(none)* | Password for initial admin bootstrap; never logged |

## Digest Key Persistence

Vaelspire derives session, one-time proof, and API-key digests using keyed **BLAKE3** with a 32-byte key (`VAELSPIRE_AUTH_KEY`).

- **Production:** Inject `VAELSPIRE_AUTH_KEY` from your secrets vault (such as **Vaelsgard**). Rotating this key invalidates active sessions and API keys.
- **Local dev / single-node:** If `VAELSPIRE_AUTH_KEY` is unset, Vaelspire automatically creates `<sqlite>.key` with `0600` permissions on first boot and reloads it on restarts so sessions stay valid.
