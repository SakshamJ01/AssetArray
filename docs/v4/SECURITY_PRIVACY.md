# ASSETARRAY 4.0 — SECURITY, MULTI-TENANCY & PRIVACY
**Institutional Advisor Platform Product Blueprint**

---

## 1. Multi-Tenancy Architecture & Strict Tenant Isolation

AssetArray 4.0 is architected as an institutional multi-tenant platform. No data from one advisory firm can ever leak to another advisory firm.

```
+-------------------------------------------------------------------------------+
| MULTI-TENANT ISOLATION MODEL                                                  |
+-------------------------------------------------------------------------------+
| FIRM TENANT (e.g., Apex Wealth Partners - Tenant ID: TEN-0812)                |
|  ├── RBAC Users: Principal, RMs, Analysts, Ops, Compliance                   |
|  ├── Households: 120 Client Families                                          |
|  ├── Portfolios: 380 Demat & Mutual Fund Accounts                            |
|  ├── Documents: Encrypted S3/GCS Blobs with Tenant Prefix                    |
|  ├── AI Interaction Logs & Cache (Strictly scoped by Tenant ID)               |
|  └── Audit Trail: Cryptographic SHA-256 Ledger partitioned by Tenant ID       |
+-------------------------------------------------------------------------------+
```

### Logical Partitioning & Query Guardrails
Every database query in the backend data access layer is strictly bound to `tenantId`. A database middleware layer automatically injects `{ tenantId: req.user.tenantId }` on all Mongoose/MongoDB find, update, and delete queries, preventing accidental cross-tenant data access.

---

## 2. Role-Based Access Control (RBAC) Matrix

```
+----------------------------------------------------------------------------------------------------+
| RBAC PERMISSIONS MATRIX                                                                            |
+----------------------+-----------+---------+---------+------------+------------+---------------+
| Resource / Action    | Principal | RM / Adv| Analyst | Operations | Compliance | Client Portal |
+----------------------+-----------+---------+---------+------------+------------+---------------+
| View All Clients     | YES       | OWN ONLY| NO      | YES        | YES        | OWN HH ONLY   |
| Edit Portfolio Data  | YES       | OWN ONLY| NO      | YES        | NO         | NO            |
| Approve Rebalance    | YES       | DRAFT   | NO      | EXECUTE    | VIEW       | APPROVE SIGN  |
| Manage Model Pots    | YES       | VIEW    | FULL    | VIEW       | VIEW       | NO            |
| Sec 70 Tax Engine    | FULL      | FULL    | NO      | FULL       | VIEW       | REPORT ONLY   |
| View Audit Trail Log | FULL      | NO      | NO      | NO         | FULL       | NO            |
| Manage Firm Billing  | FULL      | NO      | NO      | FULL       | NO         | NO            |
+----------------------+-----------+---------+---------+------------+------------+---------------+
```

---

## 3. Privacy, Data Protection & India DPDP Act Alignment

1. **Digital Personal Data Protection (DPDP) Act 2023 Principles**:
   - **Purpose Limitation**: Client PII (PAN, Aadhaar, Bank Details) is collected solely for advisory mandate execution and KYC compliance.
   - **Data Minimization**: AI prompts are stripped of raw PII (PAN and account numbers are tokenized or masked before LLM context generation).
   - **Right to Erasure & Export**: One-click complete export of client portfolio history in standardized JSON/CSV formats; compliant data deletion workflows for closed accounts.
2. **Cryptographic Integrity & Encryption**:
   - Data in Transit: Enforced TLS 1.3 encryption across all API and WebSocket endpoints.
   - Data at Rest: AES-256 database-level encryption for MongoDB collections and cloud document vaults.
3. **AI Prompt Injection Safeguards**:
   - Strict delimiter framing and schema-constrained output parsing prevent prompt injection attacks from adversarial client notes or research documents.
