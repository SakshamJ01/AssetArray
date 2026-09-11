# ASSETARRAY 4.0 — MULTI-TENANCY & RBAC IMPLEMENTATION

---

## 1. Multi-Tenancy Architecture

AssetArray 4.0 utilizes logical database partitioning with strict query guardrails. Every data mutation and query is strictly bounded by `firmId`.

```
+----------------------------------------------------------------------------------------------------+
| TENANT SCOPING LIFECYCLE                                                                           |
+----------------------------------------------------------------------------------------------------+
| 1. Client sends HTTP Request with Authorization: Bearer <accessToken>                             |
| 2. `requireAuth` verifies JWT signature via HMAC-SHA256 and extracts { sub, username, role, firmId }|
| 3. `resolveTenant` sets req.tenant = { firmId: payload.firmId }                                   |
| 4. `requirePermission` verifies if normalizeRole(req.user.role) grants the target capability       |
| 5. `enforceTenantScope(req, query)` injects { firmId: req.tenant.firmId } into MongoDB query      |
| 6. Result: Firm A user can NEVER query or mutate Firm B records                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Granular Role-Based Access Control (RBAC) Matrix

| Permission Capability | ADMIN | ADVISOR | ANALYST | OPERATIONS | COMPLIANCE |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `client:read` | YES | YES | YES | YES | YES |
| `client:write` | YES | YES | NO | YES | NO |
| `household:read` | YES | YES | YES | YES | YES |
| `household:write` | YES | YES | NO | YES | NO |
| `portfolio:read` | YES | YES | YES | YES | YES |
| `portfolio:write` | YES | YES | NO | YES | NO |
| `financial:read` | YES | YES | YES | YES | YES |
| `tax:read` | YES | YES | YES | NO | YES |
| `tax:write` | YES | YES | NO | NO | NO |
| `reports:read` | YES | YES | YES | YES | YES |
| `reports:generate` | YES | YES | NO | YES | NO |
| `documents:read` | YES | YES | YES | YES | YES |
| `documents:write` | YES | YES | NO | YES | NO |
| `tasks:read` | YES | YES | YES | YES | YES |
| `tasks:write` | YES | YES | NO | YES | NO |
| `decisions:read` | YES | YES | YES | NO | YES |
| `decisions:write` | YES | YES | NO | NO | NO |
| `audit:read` | YES | NO | NO | NO | YES |
| `users:manage` | YES | NO | NO | NO | NO |
| `firm:configure` | YES | NO | NO | NO | NO |
| `sync:manage` | YES | YES | NO | YES | NO |
