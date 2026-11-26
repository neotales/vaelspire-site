---
title: Release & Documentation Policy
description: Vaelspire's docs-before-release policy ensuring human guides, roadmap, and dense AI agent references stay in lockstep with every release.
---

Vaelspire treats documentation as a **release blocker**, never an afterthought.

## Mandatory Docs-Before-Tag Rule

Before any `vX.Y.Z` tag is cut in [`neotales/vaelspire`](https://github.com/neotales/vaelspire) or crates are published to crates.io:

1. **Human Guides Updated:** Every new CLI flag, HTTP endpoint, crate API, or Enterprise module is documented in [`neotales/vaelspire-site`](https://github.com/neotales/vaelspire-site).
2. **Dense AI Agent Reference Updated:** `/agents/*`, `/llms.txt`, and `/llms-full.txt` reflect exact endpoint paths, payloads, and crate signatures.
3. **Roadmap Synced:** Both `vaelspire/ROADMAP.md` and `vaelspire-site` `/roadmap/` reflect the exact milestone state.
4. **Theme & Accessibility Verified:** Zero forbidden palette drift (warm obsidian, dragon-ember crimson, molten amber-gold; Neotales purple reserved for parent brand attribution).
5. **All Verification Gates Green:**
   - `cargo fmt --all -- --check`
   - `cargo clippy --workspace --all-targets -- -D warnings` (and `--features embed-ui`)
   - `cargo test --workspace` (and `--features embed-ui` + `enterprise/` workspace tests)
   - `pnpm --dir ui run check && pnpm --dir ui run build`
   - `pnpm --dir ../vaelspire-site run build`
   - Live smoke verification (`scripts/smoke-test.sh` and `scripts/demo.sh`)

## Pre-1.0 Stability Philosophy

Vaelspire intentionally remains `0.0.0-alpha.0` until the core APIs, embedded UI, OIDC/SCIM surface, and documentation are mature enough that adopting teams will not face large rewrites.
