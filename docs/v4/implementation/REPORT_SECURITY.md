# AssetArray V4.0 — Report & Portal Security Architecture

## 1. Multi-Tenant & Client Boundary Protection
All report generation, retrieval, publication, and portal viewing strictly enforce tenant scoping and client identity authorization:

```text
Incoming Request
      ↓
[JWT / Session Verification]
      ↓
[Tenant Scope Enforcement: req.tenantId]
      ↓
[Client / Household Authorization: req.clientId / req.householdId]
      ↓
[ClientSafeFilter: Strip internal diagnostics, notes, audit IDs]
      ↓
Authorized Client-Safe Payload
```

## 2. Red-Team Threat Vectors & Defenses
| Threat Scenario | Defense Mechanism | Test Verification |
| :--- | :--- | :--- |
| **Cross-Tenant Data Exposure** | Server-side query scoping requires strict `tenantId` match. Querying reports across tenants throws `404 / Access Denied`. | `__tests__/v4ReportingAdversarial.test.ts` (Test 1) |
| **Client A accessing Client B Reports** | `ClientSafeFilter` enforces matching `clientId`. Cross-client access throws unauthorized exception. | `__tests__/v4ReportingAdversarial.test.ts` (Test 1, 2) |
| **Internal Report Leakage** | `INTERNAL_ADVISOR_REPORT` and `INVESTMENT_COMMITTEE_REPORT` are rejected from client-safe exposure. | `__tests__/v4ReportingAdversarial.test.ts` (Test 2) |
| **Unapproved Publication** | Direct transition from `DRAFT` or `REVIEWED` to `PUBLISHED` without `APPROVED` state throws invalid transition error. | `__tests__/v4ReportingAdversarial.test.ts` (Test 3, 11) |
| **Privilege Escalation** | Only `ADVISOR`, `ADMIN`, or `COMPLIANCE` roles may approve reports. `VIEWER` and `CLIENT` roles are rejected. | `__tests__/v4ReportingAdversarial.test.ts` (Test 4) |
| **Expired Ephemeral Share Token** | Share links contain explicit timestamp `expiresAt`. Expired tokens fail validation. | `__tests__/v4ReportingAdversarial.test.ts` (Test 5) |
| **Revoked Ephemeral Share Token** | Token revocation instantly sets `isRevoked: true` and `revokedAt`. Future access fails immediately. | `__tests__/v4ReportingAdversarial.test.ts` (Test 6) |
| **Forged Share Token** | Tokens use cryptographically secure random identifiers. Non-existent tokens return `404 / Invalid`. | `__tests__/v4ReportingAdversarial.test.ts` (Test 7) |
| **Historical Snapshot Tampering** | Reports in `APPROVED` or `PUBLISHED` states are marked `isImmutable: true`. Protected keys cannot be altered in-place. | `__tests__/v4ReportingAdversarial.test.ts` (Test 7) |

## 3. Audited Security Events
The following security-critical events are logged to the V4 audit trail:
- `REPORT_GENERATED`
- `REPORT_REVIEWED`
- `REPORT_APPROVED`
- `REPORT_PUBLISHED`
- `REPORT_DOWNLOADED`
- `REPORT_SHARE_CREATED`
- `REPORT_SHARE_REVOKED`
- `PORTAL_LOGIN`
- `PORTAL_ACTION_COMPLETED`
