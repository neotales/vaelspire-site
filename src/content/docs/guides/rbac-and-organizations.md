---
title: Per-App RBAC, Self-Service Org SSO & SCIM Groups
description: Configure org-wide and per-application roles, permissions, groups, self-service upstream OIDC/SAML IdPs, email domain policies, Home Realm Discovery, and SCIM 2.0 Groups sync.
---

Vaelspire ships complete B2B multi-tenant access control and self-service organization SSO in Core — with zero per-connection SSO tax.

## 1. Org-Wide & Per-Application RBAC

Roles and permissions can be scoped either **organization-wide** (`app_id: null`) or to a specific registered OIDC application (for example `app_id: "vaelsgard"`):

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/admin/rbac/roles` | `GET` / `POST` | List or create org-wide or per-app roles (`vaelsgard:vault-editor`) |
| `/admin/rbac/permissions` | `GET` / `POST` | List or create org-wide or per-app permissions (`vaelsgard:secrets:rotate`) |
| `/admin/rbac/roles/{role_id}/permissions/{perm_id}` | `POST` / `DELETE` | Grant or revoke a permission on a role |
| `/admin/rbac/groups` | `GET` / `POST` | List or create groups (shared live with SCIM 2.0 `/scim/v2/Groups`) |
| `/admin/rbac/groups/{group_id}/members/{user_id}` | `POST` / `DELETE` | Add or remove group members |
| `/admin/rbac/groups/{group_id}/roles/{role_id}` | `POST` | Assign a role to a group (inherited by all group members!) |
| `/admin/rbac/users/{user_id}/roles/{role_id}` | `POST` | Assign a role directly to a user |
| `/admin/rbac/users/{user_id}/effective?app_id=...` | `GET` | Resolve union of groups, direct + group-inherited roles, and permissions |

### Automatic Projection into `/forward-auth` & OIDC UserInfo
- Pass `X-Vaelspire-App-Id: vaelsgard` to `/forward-auth` and Vaelspire injects `X-Vaelspire-Roles` and `X-Vaelspire-Groups` headers for the authenticated user.
- `GET /oauth2/userinfo` automatically includes the user's resolved `roles`, `groups`, and `permissions`.

---

## 2. Organization Domain Policies & Home Realm Discovery

Organizations choose exactly which email accounts may enroll or authenticate via `GET/PUT /org/portal/policy` (or the Embedded UI at `/ui/org`):

| `email_policy` | Behavior |
| :--- | :--- |
| **`allow_public`** *(default)* | Any valid email is allowed, including consumer accounts (`gmail.com`, `outlook.com`, `icloud.com`). |
| **`business_domains_only`** | Automatically rejects free/consumer/disposable email domains (`gmail.com`, `yahoo.com`, `proton.me`, `mailinator.com`, etc.). |
| **`verified_domains_only`** | Restricts accounts strictly to domains verified via DNS TXT (`_vaelspire-verify.<domain>`). |

### DNS Domain Verification & Home Realm Discovery (`POST /auth/discover`)
1. Register a domain via `POST /org/portal/domains` (`{"domain":"acme.com"}`) to obtain a `vaelspire-site-verification=...` DNS TXT token.
2. Verify ownership via `POST /org/portal/domains/{id}/verify`.
3. When a user enters `alice@acme.com` on `/ui/login`, `POST /auth/discover` checks verified domains and enabled upstream IdPs — routing straight to SSO when configured, without revealing whether individual accounts exist.

---

## 3. Self-Service Upstream IdP Configuration (OIDC / SAML 2.0)

Organization admins manage their own SSO connections under `/org/portal/idps` (or `/ui/org`):
- Register upstream **OIDC** (Issuer URL + Client ID/Secret) or **SAML 2.0** (`EntityDescriptor` metadata XML) providers with JIT provisioning and `group_claim` mapping.
- Run a dry-run validation (`POST /org/portal/idps/{id}/test`) before enabling.
- Keep `break_glass_enabled: true` so local admin recovery stays available if an upstream IdP certificate expires.

---

## 4. Directory Sync (SCIM 2.0 Users & Groups)

Mint a scoped per-org SCIM bearer token (`vs_scim_...`) via `POST /org/portal/scim-tokens` (stored as a keyed BLAKE3 digest) and connect Okta, Entra ID, or Google Workspace to:
- `GET/POST /scim/v2/Users` and `GET/PATCH/DELETE /scim/v2/Users/{id}` (`active: false` or `DELETE` immediately soft-deletes and revokes all active browser sessions!)
- `GET/POST /scim/v2/Groups` and `GET/PATCH/DELETE /scim/v2/Groups/{id}` (RFC 7644 `PatchOp` member sync, automatically granting any RBAC roles attached to those groups!).
