# AssetArray V4.0 — Report Versioning & Immutability Architecture

## 1. Lifecycle State Machine
Reports in AssetArray V4.0 progress through an immutable, strictly-ordered state machine:

```text
[DRAFT]
   │
   ▼
[GENERATED]
   │
   ▼
[REVIEWED]
   │
   ▼
[APPROVED] ──► (Locked / Marked isImmutable: true)
   │
   ▼
[PUBLISHED] ──► (Available on Investor Portal & Client Shares)
   │
   ▼
[ARCHIVED]
```

## 2. Immutability Guarantees
- **Approved Reports are Read-Only**: Once a report reaches `APPROVED` or `PUBLISHED` status, its sections, financial metrics, currency, and data snapshot versions are locked.
- **In-Place Mutation Rejection**: Any attempt to update protected fields in an approved report throws a validation error.
- **New Version Snapshots**: If portfolio numbers change or an advisor wishes to produce an updated version, a new version snapshot is generated (`version = v(N+1)`), pointing to an updated `dataSnapshotVersion`. Historical versions (`v1`, `v2`) remain indefinitely accessible and reproducible.

## 3. Provenance & Snapshot Tracing
Every generated report embeds:
- `dataSnapshotVersion`: The precise timestamp/hash of the underlying portfolio ledger state.
- `methodologyVersion`: The version of calculation engines used (e.g. `v4.0.0-gips-aligned`).
- `templateVersion`: The version of the presentation template structure.
- `asOf`: The exact business date of valuations and allocations.
