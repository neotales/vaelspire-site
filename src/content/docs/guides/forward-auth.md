---
title: Forward-Auth Integration
description: Protect Vaelsgard or any web/API service behind Vaelspire using Caddy, Traefik, or Nginx /forward-auth.
---

Vaelspire's `/forward-auth` endpoint lets you place **any** HTTP service — Rust, Go, Node, Python, or static dashboards — behind Vaelspire authentication with zero code changes in the upstream app.

## How `/forward-auth` Works

1. Your reverse proxy forwards each incoming request's headers (`Cookie`, `Authorization`, `X-API-Key`) to `GET /forward-auth` on Vaelspire.
2. Vaelspire checks:
   - First, the session cookie (`neotales.session` by default) via `Auth::resolve_session`.
   - Next, `Authorization: Bearer <key>` or `X-API-Key: <key>` via `ApiKeys::lookup`.
3. **If valid (`200 OK`):** Vaelspire returns `Cache-Control: no-store` plus verified identity headers that your proxy copies to the upstream service.
4. **If invalid or missing:** Vaelspire returns `401 Unauthorized` (or `302 Found` to `--forward-auth-login-url` when explicitly configured on the server).

## Identity Headers Emitted on `200 OK`

| Header | Description |
| :--- | :--- |
| `X-Vaelspire-User-Id` | `UUIDv7` of the authenticated account |
| `X-Vaelspire-Tenant-Id` | `UUIDv7` of the owning tenant |
| `X-Vaelspire-Email` | Normalized lowercase email address |
| `X-Vaelspire-Auth-Method` | `session` or `api_key` |
| `X-Vaelspire-Session-Id` | `UUIDv7` of the live session *(present when `session`)* |
| `X-Vaelspire-Api-Key-Id` | `UUIDv7` of the verified API key *(present when `api_key`)* |

> **Security invariant:** Your reverse proxy **must** strip any client-supplied `X-Vaelspire-*` headers before forwarding to upstream services so clients cannot spoof identity headers if an unprotected route exists.

## Metrics Visibility

Every `/forward-auth` decision increments Prometheus counters at `GET /metrics`:

```text
vaelspire_forward_auth_total{outcome="allow",method="session"} 42
vaelspire_forward_auth_total{outcome="allow",method="api_key"} 19
vaelspire_forward_auth_total{outcome="deny",method="none"} 3
```
