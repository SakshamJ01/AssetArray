# ASSETARRAY 4.0 — FOUNDATION IMPLEMENTATION
**Institutional Advisor Platform — Phase 1 Delivery Specification**

---

## 1. Overview & Architectural Verdict

AssetArray 4.0 Phase 1 delivers the enterprise multi-tenant and governance foundation without modifying or replacing any of the frozen, production-stable V3.3.x mathematical calculation engines.

```
+-------------------------------------------------------------------------------+
| ASSETARRAY 4.0 DOMAIN HIERARCHY & BOUNDARIES                                  |
+-------------------------------------------------------------------------------+
|  [Firm / Tenant] (Root Institutional Partition)                              |
|       │                                                                       |
|       ├── [Users / Members] ─── (ADMIN, ADVISOR, ANALYST, OPS, COMPLIANCE)   |
|       ├── [Households] ──────── (Multi-Member Family Aggregation Groups)      |
|       ├── [Clients] ─────────── (Legal Entities / PAN / KYC / Tax Status)     |
|       ├── [Portfolios] ──────── (Accounts, Demat, Holdings, Tax Lots)         |
|       └── [Audit Ledger] ────── (Cryptographic SHA-256 Hash Chained)          |
+-------------------------------------------------------------------------------+
```

---

## 2. Implemented Backend Modules

The backend architecture is organized as a clean **Domain Modular Monolith** located in `backend/`:

1. **`backend/auth/`**:
   - `rbac.js`: Canonical role hierarchy (`ADMIN`, `ADVISOR`, `ANALYST`, `OPERATIONS`, `COMPLIANCE`) and granular capability permissions.
   - `middleware.js`: `requireAuth`, `resolveTenant`, `requirePermission`, and `enforceTenantScope`.
   - `crypto.js`: PBKDF2 password hashing (per-user salt) and HS256 JWT sign/verify.

2. **`backend/firms/`**:
   - `firmModel.js`: Canonical Firm domain entity definition and public sanitization.
   - `firmRoutes.js`: Tenant-isolated endpoints for retrieving and configuring firm profiles.

3. **`backend/users/`**:
   - `userModel.js`: User membership model bound to `firmId`.
   - `userRoutes.js`: User provisioning and RBAC assignment endpoints guarded by `users:manage` permission.

4. **`backend/clients/`**:
   - `clientModel.js`: Client legal identity and suitability profile model.
   - `clientRoutes.js`: Tenant-scoped client CRUD endpoints guarded by `client:read` and `client:write` permissions.

5. **`backend/households/`**:
   - `householdModel.js`: Multi-member family aggregation model.
   - `householdRoutes.js`: Household aggregation endpoints guarded by `household:read` and `household:write`.

6. **`backend/portfolios/`**:
   - `portfolioModel.js`: Portfolio, holdings, and tax lot domain model.
   - `portfolioRoutes.js`: Isolated portfolio management and holdings mutation endpoints.

7. **`backend/audit/`**:
   - `auditModel.js`: Immutable SHA-256 hash-chained `AuditEvent` schema.
   - `auditLogger.js`: Asynchronous, tamper-evident audit recording service.
   - `auditRoutes.js`: Compliance audit log query endpoint guarded by `audit:read` permission.

8. **`backend/db/`**:
   - `mongo.js`: DatabaseManager with multi-tenant compound indexes.
   - `migration.js`: Idempotent V3.3 -> V4 legacy data migrator.

---

## 3. Server Invariants & Security Guarantees

* **Zero Trust of Client-Supplied Tenant IDs:** `req.tenant.firmId` is derived solely from the server-verified JWT token payload.
* **Closed-Fail Tenant Resolution:** Any request to tenant-scoped routes lacking valid authentication or tenant context is rejected with HTTP 401 or 403.
* **Preservation of 3.3.x Calculation Core:** All financial analytics (TWR, XIRR, Section 70/74 Tax Harvesting, Brinson Attribution, Monte Carlo Goals) remain canonical and untouched.
