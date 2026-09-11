# ASSETARRAY 4.0 — IMMUTABLE AUDIT LEDGER SPECIFICATION

---

## 1. Audit Ledger Architecture

AssetArray 4.0 introduces an immutable, cryptographically chained `AuditEvent` model to meet fiduciary compliance and SEBI auditability requirements.

```
+-------------------------------------------------------------------------------+
| AUDIT EVENT RECORD STRUCTURE                                                  |
+-------------------------------------------------------------------------------+
| id:             Unique UUID / string ID (e.g. aud_1726053892_a8b9)           |
| firmId:         Tenant ID (Partition key)                                     |
| actorId:        User ID who performed the action                              |
| actorUsername:  Username of the actor                                         |
| actorRole:      Role of the actor at execution time (e.g. ADVISOR)            |
| action:         Action identifier (e.g. CLIENT_CREATED, HOLDINGS_MUTATED)     |
| entityType:     Target entity category (CLIENT, PORTFOLIO, HOUSEHOLD, USER)   |
| entityId:       Target entity ID                                              |
| timestamp:      ISO 8601 UTC timestamp                                        |
| beforeSnapshot: JSON snapshot of entity state prior to mutation               |
| afterSnapshot:  JSON snapshot of entity state after mutation                  |
| reason:         Advisor rationale or operational justification                |
| metadata:       Contextual telemetry (IP address, client headers)             |
| prevHash:       SHA-256 hash of the preceding audit record in tenant chain    |
| sha256Hash:     Cryptographic SHA-256 hash of this record                      |
+-------------------------------------------------------------------------------+
```

---

## 2. Cryptographic Hash Calculation Formula

$$\text{sha256Hash} = \text{SHA256}(\text{prevHash} \parallel \text{timestamp} \parallel \text{firmId} \parallel \text{actorId} \parallel \text{action} \parallel \text{entityType} \parallel \text{entityId} \parallel \text{beforeJson} \parallel \text{afterJson})$$

This chaining ensures that any post-hoc modification, deletion, or insertion within the audit log invalidates the cryptographic integrity chain for that firm tenant.
