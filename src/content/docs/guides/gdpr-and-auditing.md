---
title: GDPR, Redacted Auditing, Sessions & Anomaly Detection
description: Configure PII-safe email redaction (wf******@domain.com), GDPR data export & erasure, sliding + hard session timeouts, CIDR-guarded IP extraction, anomaly detection, and Prometheus metrics.
---

Vaelspire Core treats privacy, auditability, and operational safety as first-class primitives — not paid add-ons.

## 1. GDPR-Safe Redacted Logging (`--pii-log-mode`)

Operational logs should give SREs enough context to diagnose login issues **without leaking raw email addresses or credentials** into log aggregators.

Vaelspire pairs every identity log line with the account's pseudonymous `user_id` (`UUIDv7`) and a redacted email via `vaelspire_core::privacy::format_email_for_log`:

| Mode | Flag / Env | Example (`wfischer@domain.com`) | Intended Use |
| :--- | :--- | :--- | :--- |
| **`masked`** *(default)* | `--pii-log-mode masked` | `wf******@domain.com` | Production default — preserves leading chars & domain for org triage while hiding PII |
| **`id-only`** | `--pii-log-mode id-only` | `[redacted]` | Strictest GDPR minimization — rely solely on `user_id` |
| **`full`** | `--pii-log-mode full` | `wfischer@domain.com` | Local development debugging only |

### Log-Level Hygiene
- **`ERROR`:** Database outage, invalid digest key, fatal startup or sink failure.
- **`WARN`:** Auth denials, lockouts, anomaly triggers (`password_spray`, `new_device_or_ip`, `refresh_token_reuse`), invalid origins, or insecure HTTP flags on non-loopback addresses.
- **`INFO`:** Lifecycle events, admin/SCIM/GDPR mutations (carrying `user_id` + masked email).
- **`DEBUG` / `TRACE`:** Protocol negotiation details — passwords, cookies, bearer tokens, and OTPs are **never logged at any level**.

---

## 2. GDPR Right of Access & Right to Erasure

- **Right of Access (`GET /account/export` or `vaelspire user export --id <uuid>`):** Returns a portable `vaelspire.gdpr.export.v1` JSON bundle containing the user's profile, RBAC groups/roles/permissions, session history, and audit trail.
- **Right to Erasure (`DELETE /account/erase`, `POST /admin/gdpr/erase/{id}`, or `vaelspire user gdpr-erase --id <uuid>`):**
  - Overwrites `auth_user.email` with an RFC 2606 non-routable pseudonym (`erased-<uuid>@deleted.invalid`) and clears `username`/`display_name`.
  - Immediately revokes all active browser sessions, API keys, Passkeys, and group/role links.
  - Appends a pseudonymous `auth.user.gdpr_erased` event — **preserving append-only `auth_audit` SQLite/Postgres triggers and WORM hash chains intact**.
- **IP Address Minimization (`--audit-ip-mode`):**
  - `full` (default): store full trusted client IP.
  - `truncated`: store only `/24` (IPv4, e.g. `203.0.113.0/24`) or `/48` (IPv6, e.g. `2001:db8:abcd::/48`) from birth.
  - `none`: omit IPs from audit rows completely.

---

## 3. Sliding & Hard (Absolute) Session Expirations

Configure both **sliding idle windows** and **hard absolute maximum lifetimes** via CLI flags or environment variables:

```bash
vaelspire serve \
  --session-idle-secs 3600 \      # 1h sliding idle window (extends when past half-TTL)
  --session-max-secs 604800       # 7d hard absolute ceiling from session creation (UUIDv7)
```

- Pass `--session-fixed` (`VAELSPIRE_SESSION_FIXED=true`) to disable sliding extensions and enforce strict fixed session expiry.
- Sliding extensions are strictly clamped to `min(now + idle_ttl, created_at + max_lifetime)` and rejected with `401 Unauthorized` once the hard ceiling is crossed.

---

## 4. Trusted IP Collection & Anomaly Detection

Prevent attackers from spoofing `X-Forwarded-For` or `CF-Connecting-IP` by restricting proxy header trust to explicit CIDR blocks:

```bash
vaelspire serve \
  --ip-source cf-connecting-ip \
  --trusted-proxies 173.245.48.0/20,103.21.244.0/22,10.0.0.0/8
```

Built-in Core `AnomalyDetector` tracks:
- **`password_spray`:** Multiple distinct accounts failing from one source IP within a sliding window.
- **`new_device_or_ip`:** Authenticated session appearing from an unseen `/24` (`/48`) subnet + User-Agent pair.
- **`refresh_token_reuse`:** Replayed rotated OIDC refresh token (automatically revoking the entire token family).

All anomalies, OIDC grants, GDPR operations, SCIM operations, HTTP status classes, and `/forward-auth` decisions are exported as **strictly bounded-cardinality Prometheus counters** at `GET /metrics` (never using `user_id`, `email`, or `ip` as labels).
