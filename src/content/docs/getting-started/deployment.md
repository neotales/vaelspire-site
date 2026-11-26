---
title: Deployment & Reverse Proxies
description: Deploy Vaelspire Core with Docker Compose and wire Caddy, Traefik, or Nginx to /forward-auth.
---

Vaelspire Core ships as a single static-friendly Rust binary that runs comfortably on a $5 VPS or inside a minimal container.

## Docker Compose

Ready-to-run files live in `deploy/Dockerfile` and `deploy/docker-compose.yml`:

```bash
export VAELSPIRE_AUTH_KEY=$(cargo run -p vaelspire -- keygen)
export VAELSPIRE_ADMIN_EMAIL="admin@example.com"
export VAELSPIRE_ADMIN_PASSWORD="replace-with-strong-passphrase"

docker compose -f deploy/docker-compose.yml up -d --build
```

The container runs as non-root user `vaelspire` (`uid 10001`), stores SQLite in `/data/vaelspire.sqlite`, logs structured JSON, and exposes a built-in `/health` `HEALTHCHECK`.

## Caddy (`deploy/caddy/Caddyfile`)

```txt title="Caddyfile"
auth.example.com {
    reverse_proxy 127.0.0.1:8080
}

app.example.com {
    forward_auth 127.0.0.1:8080 {
        uri /forward-auth
        copy_headers X-Vaelspire-User-Id X-Vaelspire-Email X-Vaelspire-Tenant-Id X-Vaelspire-Auth-Method X-Vaelspire-Session-Id X-Vaelspire-Api-Key-Id
    }
    reverse_proxy 127.0.0.1:3000
}
```

## Traefik (`deploy/traefik/dynamic.yml`)

```yaml
http:
  middlewares:
    vaelspire-auth:
      forwardAuth:
        address: "http://vaelspire:8080/forward-auth"
        trustForwardHeader: true
        authResponseHeaders:
          - "X-Vaelspire-User-Id"
          - "X-Vaelspire-Email"
          - "X-Vaelspire-Tenant-Id"
          - "X-Vaelspire-Auth-Method"
          - "X-Vaelspire-Session-Id"
          - "X-Vaelspire-Api-Key-Id"
```

## Nginx (`deploy/nginx/vaelspire.conf`)

```nginx
location = /_vaelspire_verify {
    internal;
    proxy_pass http://127.0.0.1:8080/forward-auth;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header Cookie $http_cookie;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header X-API-Key $http_x_api_key;
}

location / {
    auth_request /_vaelspire_verify;
    auth_request_set $vs_user_id $upstream_http_x_vaelspire_user_id;
    auth_request_set $vs_email   $upstream_http_x_vaelspire_email;
    auth_request_set $vs_tenant  $upstream_http_x_vaelspire_tenant_id;
    auth_request_set $vs_method  $upstream_http_x_vaelspire_auth_method;

    proxy_set_header X-Vaelspire-User-Id     $vs_user_id;
    proxy_set_header X-Vaelspire-Email       $vs_email;
    proxy_set_header X-Vaelspire-Tenant-Id   $vs_tenant;
    proxy_set_header X-Vaelspire-Auth-Method $vs_method;

    proxy_pass http://127.0.0.1:3000;
}
```

## Production Checklist

1. Terminate TLS at your proxy and run Vaelspire **without** `--insecure-http`.
2. Pass `--trust-proxy` **only** when the proxy strips/overwrites client-supplied `X-Forwarded-For` headers.
3. Set `--allowed-origins` explicitly (exact lowercase `scheme://host[:port]`, no trailing slash).
4. Scrape `GET /metrics` from Prometheus or Grafana Alloy (restrict `/metrics` to internal networks).
