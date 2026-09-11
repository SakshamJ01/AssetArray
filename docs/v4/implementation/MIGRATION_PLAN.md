# ASSETARRAY 4.0 — IDEMPOTENT DATA MIGRATION PLAN & SPECIFICATION

---

## 1. Migration Strategy: Non-Destructive Single-Firm Transition

Legacy AssetArray 3.3.x operated with standalone user accounts and sync records without an explicit multi-tenant `firmId`.

AssetArray 4.0 establishes a deterministic, non-destructive migration layer executed automatically on server database connection:

1. **Default Firm Creation**: If no default firm exists in the database, `MigrationService` provisions:
   - `id`: `"firm_default_practice"`
   - `name`: `"Primary Advisory Practice"`
   - `sebiRegistrationNo`: `"INA000000000"`
   - `status`: `"ACTIVE"`
   - `tier`: `"INSTITUTIONAL_CORE"`

2. **User Record Normalization**:
   - Assigns `firmId: "firm_default_practice"` to any user lacking a tenant partition.
   - Normalizes lowercase legacy roles (`"advisor"` → `"ADVISOR"`, `"admin"` → `"ADMIN"`).
   - Preserves all password hashes and salts without requiring user password resets.

3. **Sync Blob Partitioning**:
   - Assigns `firmId: "firm_default_practice"` to all existing encrypted backup records in `encrypted_sync_blobs`.

4. **Advisor Workflow Entities**:
   - Assigns `firmId: "firm_default_practice"` to legacy records in `advisor_tasks`, `advisor_activity`, and `advisor_decisions`.

---

## 2. Idempotency Guarantees

* **Safe Re-runs**: The migration script can be run $N$ times with zero state divergence.
* **Zero Data Loss**: No collections or fields are dropped.
* **Deterministic Rollback**: Reversing migration simply requires querying `firmId: "firm_default_practice"` records.
