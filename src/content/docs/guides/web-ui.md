---
title: Embedded Web UI & Desktop Companion
description: Serve Vaelspire's built-in SvelteKit web console directly from the single binary (--features embed-ui), switch to external CDN hosting (--ui-mode external), or manage via the Rune desktop companion.
---

Vaelspire separates **headless server reliability** from **operator ergonomics** using a compile-time + runtime UI boundary.

## Three UI Modes (`--ui-mode`)

| Mode | Flag / Env | Behavior | Best For |
| :--- | :--- | :--- | :--- |
| **Embedded** | `--ui-mode embedded` *(default when built with `--features embed-ui`)* | Serves the compiled SvelteKit static SPA directly from inside the `vaelspire` binary under `/ui/*` (with `/` redirecting to `/ui/`). | Homelabs, single-binary deployments, fast local dev, Core self-hosting. |
| **External** | `--ui-mode external` | Disables `/ui/*` routes in the Rust server so you can host a custom white-label frontend on Cloudflare Pages, S3/CloudFront, or Nginx. | Enterprise branding & CDN edge hosting. |
| **API-Only** | `--ui-mode api-only` | Pure JSON/OIDC/SCIM/Forward-Auth headless daemon with zero HTML routes. | Microservice meshes, embedded gateways, headless automation. |

## Building the Single Binary with Embedded UI

```bash
# 1. Build the static SvelteKit bundle into ui/build/
cd ui
pnpm install
pnpm build

# 2. Compile vaelspire with embedded assets
cd ..
cargo build --release -p vaelspire --features embed-ui

# 3. Launch and open http://127.0.0.1:8080/ui/
./target/release/vaelspire serve --ui-mode embedded
```

### Included Core UI Views

- **`/ui/` (Overview):** Live `/health`, `/ready`, OIDC issuer, storage backend, and active session status.
- **`/ui/login` & `/ui/register`:** Argon2id password authentication with automatic CSRF cookie echoing (`neotales.csrf` -> `x-csrf-token`) and safe `?next=` redirect support.
- **`/ui/consent`:** OpenID Connect authorization consent screen displaying client ID, callback URI, PKCE status, and requested scopes.
- **`/ui/account`:** Active browser session management (instant revocation) and one-time `vs_...` API key issuance.
- **`/ui/admin`:** Live Prometheus `/metrics` summary cards, OIDC application registry (`/admin/oidc/clients`), and SCIM 2.0 user directory (`/scim/v2/Users`).

## Isolated Native Desktop Companion (`Rune`)

For operators who prefer a native desktop client over a browser tab, Vaelspire plans an isolated companion app in `apps/vaelspire-desktop/` built with **[Rune](https://github.com/anomalyco/rune)** (`anomalyco/rune`).

Keeping the desktop companion completely isolated from `crates/vaelspire` ensures:
1. The headless `vaelspire` server binary **never** pulls in GPU, windowing, or WebView dependencies.
2. Every desktop action uses the exact same HTTP APIs (`/session`, `/api-keys`, `/admin/oidc/clients`, `/scim/v2/Users`, `/metrics`).
