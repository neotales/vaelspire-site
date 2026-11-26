---
title: SCIM 2.0, SAML Metadata & AI Agents (NHI)
description: Automate user lifecycle with SCIM 2.0 (RFC 7644), expose SAML 2.0 IdP metadata, and issue strictly scoped Non-Human Identity (NHI) tokens for services and AI agents.
---

Modern identity platforms must govern more than human browser logins. Vaelspire Core includes **SCIM 2.0 user provisioning**, **SAML 2.0 IdP metadata**, and **Non-Human Identity (NHI)** workload credentials out of the box.

## SCIM 2.0 User Provisioning (RFC 7644)

Provision, inspect, and deactivate accounts programmatically from HR systems, Terraform, or directory sync pipelines:

| Endpoint | Method | Behavior |
| :--- | :--- | :--- |
| `/scim/v2/ServiceProviderConfig` | `GET` | RFC 7643 capability discovery document |
| `/scim/v2/Users` | `GET` | List active tenant users in SCIM `ListResponse` schema |
| `/scim/v2/Users` | `POST` | Create a user with Argon2id password hashing and return SCIM `User` resource (`201 Created`) |
| `/scim/v2/Users/{id}` | `GET` | Fetch one user by UUIDv7 |
| `/scim/v2/Users/{id}` | `DELETE` | Soft-delete the account and immediately invalidate active sessions (`204 No Content`) |

All `/scim/v2/Users*` endpoints require either a valid authenticated session cookie or an active `vs_...` API key (`Authorization: Bearer` or `X-API-Key`).

```bash
curl -sS -X POST http://127.0.0.1:8080/scim/v2/Users \
  -H "Authorization: Bearer $VAELSPIRE_API_KEY" \
  -H "Content-Type: application/scim+json" \
  -d '{
    "userName": "alice@example.com",
    "password": "correct-horse-battery-staple",
    "active": true
  }'
```

## Non-Human Identity (NHI) & AI Agent Scoped Delegation

AI agents, CI runners, and background services should never share long-lived admin cookies or overly broad keys.

Register a confidential OAuth 2.0 client with an explicit allow-list of scopes (for example `agent:read` and `deploy:preview`) and mint short-lived, `EdDSA`-signed access tokens using `grant_type=client_credentials`:

```bash
curl -sS -X POST http://127.0.0.1:8080/oauth2/token \
  -u "build-agent:$CLIENT_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&scope=agent:read"
```

### Strict Scope Attenuation

If an agent requests a scope outside its registered `allowed_scopes` (e.g., `admin:delete`), Vaelspire rejects the grant with `invalid_scope`. Issued tokens carry:
- `sub = client_id` (attributed cleanly to the non-human workload)
- `scope` attenuated strictly to the requested subset
- Short expiry (`exp`), verifiable offline by any downstream service using `vaelspire-verify`.

## SAML 2.0 Metadata Endpoint

For enterprise SPs inspecting IdP metadata, Vaelspire serves valid SAML 2.0 `EntityDescriptor` XML at:

```bash
curl -sS http://127.0.0.1:8080/saml/metadata
```

The descriptor advertises the configured `--issuer` as `entityID` and binds the server's SSO endpoints cleanly.
