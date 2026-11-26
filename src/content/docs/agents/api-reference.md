---
title: HTTP & CLI Contract (Agent Reference)
description: Dense specification of Vaelspire HTTP routes, headers, cookies, status codes, /forward-auth, /metrics, and CLI env vars.
---

## 1. Server Operational Routes (`crates/vaelspire`)

| Method & Path | Auth | Success | Response Contract |
| :--- | :--- | :--- | :--- |
| `GET /health` | None | `200 OK` | `{"status":"ok","service":"vaelspire","edition":"core","version":"..."}` |
| `GET /ready` | None | `200 OK` / `503` | Probes SQLite (`SELECT 1`); returns `{"status":"ready","store":"sqlite","tenant_id":"..."}` |
| `GET /metrics` | None | `200 OK` | `text/plain; version=0.0.4; charset=utf-8` Prometheus metrics |
| `GET /.well-known/vaelspire` | None | `200 OK` | JSON discovery: `service`, `edition`, `version`, `tenant_id`, `cookies`, `endpoints` |
| `ANY /forward-auth` | Cookie or API key | `200 OK` / `401` / `302` | See §2 below |

### Prometheus Metrics Emitted at `GET /metrics`

- `vaelspire_build_info{version="...",edition="core"} 1` (gauge)
- `vaelspire_uptime_seconds` (gauge)
- `vaelspire_http_requests_total` (counter)
- `vaelspire_http_responses_total{class="2xx|4xx|5xx"}` (counter)
- `vaelspire_forward_auth_total{outcome="allow|deny",method="session|api_key|none"}` (counter)

## 2. `/forward-auth` Verification Contract

**Credential precedence:**
1. Session cookie (default `neotales.session`, configurable via `VAELSPIRE_SESSION_COOKIE`)
2. `Authorization: Bearer <api-key>` (case-insensitive `Bearer` / `bearer`)
3. `X-API-Key: <api-key>`

**Headers returned on `200 OK`** (`Cache-Control: no-store` always set):
- `X-Vaelspire-User-Id`: `UUIDv7`
- `X-Vaelspire-Tenant-Id`: `UUIDv7`
- `X-Vaelspire-Email`: normalized lowercase email (omitted only if user row absent)
- `X-Vaelspire-Auth-Method`: `session` | `api_key`
- `X-Vaelspire-Session-Id`: `UUIDv7` *(when `session`)*
- `X-Vaelspire-Api-Key-Id`: `UUIDv7` *(when `api_key`)*

**Unauthenticated behavior** (`Cache-Control: no-store` always set):
- Default: `401 Unauthorized` JSON `{"error":"unauthorized"}`
- If `VAELSPIRE_FORWARD_AUTH_LOGIN_URL` is configured: `302 Found` with `Location: <configured-url>` (never accepts untrusted query redirect parameters).

## 3. Auth Router Routes (`vaelspire-axum`)

**Browser CSRF bootstrap sequence:**
1. Call `GET /session` -> sets non-`HttpOnly` `neotales.csrf=<uuidv4>` cookie (returns `401` if unauthenticated, `200` if authenticated).
2. On every `POST`/`DELETE`, send:
   - `Origin: <allowed-origin>` (default localhost only)
   - `Cookie: neotales.csrf=<token>` (+ `neotales.session=<bearer>` when signed in)
   - `x-csrf-token: <token>`

| Route | Feature / Precondition | Auth Required | Status / Behavior |
| :--- | :--- | :--- | :--- |
| `POST /sign-up` | `password` | CSRF + Origin | Body `{"email","password"}` -> `201` / `409` duplicate |
| `POST /sign-in` | `password` + `session` | CSRF + Origin | Body `{"email","password"}` -> `200`, sets `HttpOnly` `neotales.session` cookie (never in JSON body) |
| `POST /sign-out` | `session` | CSRF + Origin | Revokes session cookie -> `204 No Content`, clears cookie |
| `GET /session` | `session` | None | Sets `neotales.csrf` cookie; returns `200` session info or `401` |
| `GET /sessions` | `session` | Session cookie | Lists caller's live sessions (`id`, `expires_at`, `current`) |
| `DELETE /sessions/{session_id}` | `session` | Session + CSRF | Revokes one owned session |
| `DELETE /sessions` | `session` | Session + CSRF | Revokes all sessions except current |
| `DELETE /sessions/all` | `session` | Session + CSRF | Revokes all sessions including current |
| `POST /password/change` | `password` + `session` | Session + CSRF | Changes password for signed-in user |
| `POST /email/change` | `session` | Session + CSRF | Changes email for signed-in user |
| `DELETE /user` | `session` | Session + CSRF | Soft-deletes signed-in user |
| `POST /email/verify/request` | `.on_proof(...)` | CSRF + Origin | Always `202 Accepted` (no email enumeration) |
| `POST /email/verify` | always | CSRF + Origin | Consumes one-time verify token |
| `POST /password/reset/request` | `.on_proof(...)` | CSRF + Origin | Always `202 Accepted` (no email enumeration) |
| `POST /password/reset` | `password` | CSRF + Origin | Consumes reset proof, writes Argon2id, revokes sessions atomically |
| `POST /email/sign-in/request` | `email-signin` + `.on_proof` | CSRF + Origin | Always `202 Accepted` |
| `POST /email/sign-in` | `email-signin` | CSRF + Origin | Consumes proof and issues session cookie |
| `POST /api-keys` | `apikeys` + `.api_keys(...)` | CSRF + Origin | Issues key shown once; `503` if unconfigured |
| `GET /api-keys/verify` | `apikeys` | Key header | Verifies key and updates `last_used_at` |
| `DELETE /api-keys/{id}` | `apikeys` + `session` | Session + CSRF | Revokes owned key |
| `POST /roles`, `/permissions`, `/groups`, `/groups/{id}/members` | `.roles(true)` | CSRF + Origin | Catalogue/group writes (`404` when `.roles(false)`) |
| `POST /passkey/{register,login}/{begin,finish}` | `passkey` | CSRF + Origin | WebAuthn ceremonies |
| `GET /social/{provider}/{start,callback}` | `social` | None | `provider` in `{github, google, microsoft}` |
| `GET /oidc/{provider}/{start,callback}` | `oidc` | None | `provider` in `{authentik, zitadel, keycloak}` |

## 4. CLI & Environment Variables

```text
vaelspire [--log-format pretty|json] <COMMAND>
  serve   [--bind 127.0.0.1:8080] [--sqlite ./vaelspire.sqlite] [--tenant-name default]
          [--auth-key <64-hex>] [--insecure-http] [--allowed-origins <csv>] [--trust-proxy]
          [--session-cookie neotales.session] [--csrf-cookie neotales.csrf]
          [--api-key-prefix vsp] [--no-auditing] [--no-roles]
          [--rate-limit-max 30] [--rate-limit-window-secs 60]
          [--forward-auth-login-url <url>] [--admin-email <email>] [--admin-password <pw>]
  migrate [--sqlite ./vaelspire.sqlite]
  keygen
  admin bootstrap --email <email> --password <pw> [--sqlite ...] [--tenant-name ...] [--auth-key ...]
```

Env vars: `VAELSPIRE_LOG_FORMAT`, `VAELSPIRE_BIND`, `VAELSPIRE_SQLITE_PATH`, `VAELSPIRE_TENANT_NAME`, `VAELSPIRE_AUTH_KEY`, `VAELSPIRE_INSECURE_HTTP`, `VAELSPIRE_ALLOWED_ORIGINS`, `VAELSPIRE_TRUST_PROXY`, `VAELSPIRE_SESSION_COOKIE`, `VAELSPIRE_CSRF_COOKIE`, `VAELSPIRE_API_KEY_PREFIX`, `VAELSPIRE_NO_AUDITING`, `VAELSPIRE_NO_ROLES`, `VAELSPIRE_RATE_LIMIT_MAX`, `VAELSPIRE_RATE_LIMIT_WINDOW_SECS`, `VAELSPIRE_FORWARD_AUTH_LOGIN_URL`, `VAELSPIRE_ADMIN_EMAIL`, `VAELSPIRE_ADMIN_PASSWORD`.
