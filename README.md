# 🐉 Vaelspire Site (`neotales/vaelspire-site`)

Official **marketing and documentation site** for [**Vaelspire**](https://github.com/neotales/vaelspire) by **Neotales**, built with **Astro 7 + Starlight**.

- **For humans:** Product landing page, 60-second quickstart, reverse-proxy `/forward-auth` guides, embeddable Rust crate guides, public Roadmap, and Vaelspire Enterprise commercial overview.
- **For AI coding agents:** Dedicated high-density reference pages (`/agents/`, `/agents/api-reference/`, `/agents/crate-recipes/`) plus standard `/llms.txt` and `/llms-full.txt` endpoints.

---

## 🚨 Release Policy: Docs Before Tag

> **Every `vaelspire` release must update documentation in `neotales/vaelspire-site` *before* the release tag is cut.**

Before tagging `vX.Y.Z` in `neotales/vaelspire`:
1. Update affected human guides, CLI/configuration tables, and [`roadmap.md`](src/content/docs/roadmap.md).
2. Update the dense AI agent reference ([`agents/`](src/content/docs/agents/), [`public/llms.txt`](public/llms.txt), and [`public/llms-full.txt`](public/llms-full.txt)).
3. Run `pnpm build` here and verify zero build errors.
4. Commit and push `vaelspire-site` on `dev`, then tag the release in `neotales/vaelspire`.

---

## 🎨 Theme & Brand Rules

- **Vaelspire palette:** Warm obsidian (`#0c0a09` / `#1c1917`), dragon-ember crimson (`#dc2626` / `#ea580c`), molten brass/amber-gold (`#d97706` / `#f59e0b` / `#fde68a`), and emerald (`#10b981`).
- **Neotales parent accent:** Purple (`#a855f7` / `#c084fc`) reserved strictly for the `by Neotales` parent brand badge.
- **Hard ban:** **Never use cyan** (or sky/aqua blue-cyan hues) anywhere in CSS, SVGs, badges, or theme tokens.

---

## 🛠️ Local Development

```bash
pnpm install
pnpm dev
```

Production static build:

```bash
pnpm build
pnpm preview
```
