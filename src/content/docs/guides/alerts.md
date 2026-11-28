---
title: Multi-Sink Security Alerting
description: Configure non-blocking security and audit alerts to Webhook (HMAC-SHA256), Slack, Discord, Microsoft Teams, Gotify, ntfy, Twilio/Generic SMS, and SMTP Email using vaelspire-alerts.
---

Vaelspire ships with [`vaelspire-alerts`](https://github.com/neotales/vaelspire/tree/dev/crates/vaelspire-alerts) — a reusable, zero-Vaelspire-dependency MIT alerting router built so it can also be extracted into a generic **`neotales-alerts`** crate shared across Neotales services.

All alerts are dispatched asynchronously on a bounded background queue with burst deduplication and exponential-backoff retries, so outbound notification latency never stalls `/sign-in`, `/oauth2/token`, or `/forward-auth`.

## Supported Sinks

| Sink | Feature Flag | Protocol & Auth |
| :--- | :--- | :--- |
| **Webhook** | `webhook` *(default)* | Raw JSON `POST` + optional HMAC-SHA256 (`X-Signature-256: sha256=<hex>`) + custom headers |
| **Slack** | `slack` *(default)* | Incoming Webhook (Block Kit payload) |
| **Discord** | `discord` *(default)* | Discord Webhook (severity-colored Embeds) |
| **Microsoft Teams** | `teams` *(default)* | Workflows / Power Automate Adaptive Card 1.4 JSON |
| **Gotify** | `gotify` *(default)* | Self-hosted Gotify `POST /message` with `X-Gotify-Key` and priority mapping (`3`/`6`/`9`) |
| **ntfy** | `ntfy` *(default)* | Self-hosted or `ntfy.sh` `POST /{topic}` with `Priority`, `Tags`, Bearer/Basic auth |
| **SMS** | `sms` *(default)* | Twilio REST Messages API + generic HTTP JSON SMS gateway |
| **Email** | `email` (`vaelspire --features alerts-email`) | Async SMTP via `lettre` (`STARTTLS`, `SMTPS`, or plain local relay) |

## Quick CLI / Environment Setup

Enable one or more sinks directly on `vaelspire serve`:

```bash
vaelspire serve \
  --bind 127.0.0.1:8080 \
  --sqlite ./vaelspire.sqlite \
  --alert-min-severity warn \
  --alert-dedupe-secs 60 \
  --alert-gotify-url https://gotify.example.com \
  --alert-gotify-token "$GOTIFY_APP_TOKEN" \
  --alert-slack-url "$SLACK_WEBHOOK_URL" \
  --alert-webhook-url https://ops.example.com/hooks/vaelspire \
  --alert-webhook-secret "$WEBHOOK_HMAC_SECRET"
```

Verify your sink credentials immediately without waiting for a real incident:

```bash
vaelspire alert test \
  --severity warn \
  --alert-gotify-url https://gotify.example.com \
  --alert-gotify-token "$GOTIFY_APP_TOKEN"
```

## Declarative Multi-Sink Config (`--alerts-config`)

For per-sink severity routing, category filtering, Twilio SMS, or SMTP email, pass `--alerts-config /etc/vaelspire/alerts.json`:

```json
{
  "dedupe_window_secs": 60,
  "sinks": [
    {
      "min_severity": "info",
      "categories": ["gdpr."],
      "sink": {
        "type": "slack",
        "webhook_url": "https://hooks.slack.com/services/T000/B000/XXX"
      }
    },
    {
      "min_severity": "warn",
      "sink": {
        "type": "gotify",
        "base_url": "https://gotify.example.com",
        "app_token": "A1B2C3D4"
      }
    },
    {
      "min_severity": "critical",
      "sink": {
        "type": "teams",
        "webhook_url": "https://prod-00.westus.logic.azure.com/workflows/..."
      }
    },
    {
      "min_severity": "critical",
      "sink": {
        "type": "twilio-sms",
        "account_sid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "auth_token": "your-auth-token",
        "from": "+15550001111",
        "to": ["+15550002222"]
      }
    }
  ]
}
```

## PII-Safe Payloads

Vaelspire automatically applies your configured `--pii-log-mode` (default `masked` → `wf******@domain.com`) and `--audit-ip-mode` (`truncated` → `/24` IPv4, `/48` IPv6) before enqueueing alerts, so external chat and push channels never receive unredacted personal data.
