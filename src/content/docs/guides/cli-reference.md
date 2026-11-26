---
title: Operator CLI Reference
description: Complete reference for the single-binary vaelspire CLI — server, migrations, keygen, users, GDPR, organizations, per-app RBAC, and audit log inspection.
---

The `vaelspire` binary bundles the HTTP server and a full air-gap-friendly operator management CLI built with `clap`.

## Server & Setup Commands

```bash
# Generate a 256-bit hex key for VAELSPIRE_AUTH_KEY
vaelspire keygen

# Apply core + extended schema migrations idempotently
vaelspire migrate --sqlite ./vaelspire.sqlite

# Bootstrap initial tenant & owner account (logs redacted email)
vaelspire admin bootstrap --sqlite ./vaelspire.sqlite --email admin@acme.com --password "..."

# Run the server with GDPR masked logging, truncated audit IPs, sliding+hard sessions, and embedded UI
vaelspire serve \
  --bind 127.0.0.1:8080 \
  --sqlite ./vaelspire.sqlite \
  --issuer https://auth.acme.com \
  --ui-mode embedded \
  --pii-log-mode masked \
  --audit-ip-mode truncated \
  --ip-source cf-connecting-ip \
  --trusted-proxies 10.0.0.0/8 \
  --session-idle-secs 3600 \
  --session-max-secs 604800
```

## User & GDPR Management (`vaelspire user`)

```bash
vaelspire user list --sqlite ./vaelspire.sqlite
vaelspire user create --sqlite ./vaelspire.sqlite --email alice@acme.com --password "..."
vaelspire user disable --sqlite ./vaelspire.sqlite --id <USER_UUID>
vaelspire user export --sqlite ./vaelspire.sqlite --id <USER_UUID>
vaelspire user gdpr-erase --sqlite ./vaelspire.sqlite --id <USER_UUID>
```

## Organization Policy & Domains (`vaelspire org`)

```bash
vaelspire org policy-set \
  --sqlite ./vaelspire.sqlite \
  --email-policy business_domains_only \
  --sliding true \
  --idle-secs 3600 \
  --absolute-secs 604800

vaelspire org domain-add --sqlite ./vaelspire.sqlite --domain acme.com
```

## Org-Wide & Per-App RBAC (`vaelspire rbac`)

```bash
# Create a per-app role and permission for Vaelsgard
vaelspire rbac role-create --sqlite ./vaelspire.sqlite --app-id vaelsgard --name vault-editor
vaelspire rbac perm-create --sqlite ./vaelspire.sqlite --app-id vaelsgard --name secrets:rotate

# Grant permission to role, assign role to user, inspect effective access
vaelspire rbac grant-perm --sqlite ./vaelspire.sqlite --role-id <ROLE_ID> --perm-id <PERM_ID>
vaelspire rbac assign-user --sqlite ./vaelspire.sqlite --user-id <USER_ID> --role-id <ROLE_ID>
vaelspire rbac effective --sqlite ./vaelspire.sqlite --user-id <USER_ID> --app-id vaelsgard
```

## Append-Only Audit Inspection (`vaelspire audit`)

```bash
vaelspire audit tail --sqlite ./vaelspire.sqlite --limit 50
```
