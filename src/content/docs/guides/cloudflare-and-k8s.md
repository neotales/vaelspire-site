---
title: Cloudflare (D1 / Workers / Containers) & Kubernetes
description: Run Vaelspire at ultra-low cost on Cloudflare Workers + D1 or Cloudflare Containers, or scale across Kubernetes with the official Helm chart.
---

Vaelspire is engineered to deploy cleanly from **$0–$5/month serverless edge** all the way up to **autoscaling Kubernetes clusters**.

## 1. Cloudflare Workers + D1 (`vaelspire-store-d1`)

`vaelspire-core`, `vaelspire-verify`, and `vaelspire-store-d1` are **100% pure Rust with zero native C/OpenSSL dependencies**, ready for `wasm32-unknown-unknown` and Cloudflare D1.

### Setup (`deploy/cloudflare/worker/`)

```bash
cd deploy/cloudflare/worker
wrangler d1 create vaelspire-db
# Update database_id in wrangler.toml, then apply the append-only schema:
wrangler d1 execute vaelspire-db --file=schema.sql
wrangler deploy
```

### Understanding Worker CPU Limits & Hybrid Edge
- **Stateless JWT Verification at 300+ PoPs:** Use `vaelspire-verify` or WebCrypto Ed25519 inside your Cloudflare Worker to validate Vaelspire access tokens in **<1ms** at the edge with zero origin latency.
- **Argon2id & Passkeys:** OWASP Argon2id requires 19–64 MiB RAM and 30–100ms CPU per login — which is faster and cheaper on native SIMD CPUs than inside a Wasm isolate. For the best performance/cost ratio, route `/sign-in` and `/passkey/*` to a **Cloudflare Container** (or small VM) while keeping edge token checks & D1 session lookups in the Worker!

---

## 2. Cloudflare Containers (Full Native Static Binary)

Run our exact static Linux binary (`deploy/Dockerfile`) natively on **Cloudflare Containers** with full SIMD Argon2id, Passkeys, OIDC 1.0 IdP, SCIM 2.0, and the embedded SvelteKit UI — with `--ip-source cf-connecting-ip` preconfigured:

```bash
cd deploy/cloudflare/containers
wrangler deploy
```

---

## 3. Kubernetes (Official Helm Chart)

Production-ready Helm chart located at [`deploy/helm/vaelspire/`](https://github.com/neotales/vaelspire/tree/dev/deploy/helm/vaelspire) featuring:
- Hardened non-root, `readOnlyRootFilesystem: true`, dropped Linux capabilities
- Liveness (`/health`) & Readiness (`/ready`) probes
- HorizontalPodAutoscaler (`autoscaling/v2`), PodDisruptionBudget, NetworkPolicy, and Prometheus `ServiceMonitor`
- Pre-wired GDPR defaults (`piiLogMode: masked`, `auditIpMode: truncated`, `sessionSliding: true`)

```bash
# Generate a 256-bit key
AUTH_KEY=$(vaelspire keygen)

# Install into Kubernetes
helm upgrade --install vaelspire ./deploy/helm/vaelspire \
  --namespace identity --create-namespace \
  --set config.issuer="https://auth.example.com" \
  --set config.allowedOrigins="https://auth.example.com" \
  --set secrets.authKey="$AUTH_KEY"
```
