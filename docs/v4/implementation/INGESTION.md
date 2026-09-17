# AssetArray 4.0 — Ingestion Subsystem Documentation

## Ingestion Pipeline Flow
1. **Source Adapter Selection:** Identifies and parses source payloads (`MANUAL_GRID`, `BROKER_CSV`, `STATEMENT_TEXT`, `CAMS_CAS`, `KFINTECH_CAS`).
2. **Cryptographic Fingerprinting:** SHA-256 hash of `tenantId::sourceType::content` guarantees idempotency.
3. **Normalization & Quality Mapping:** Transforms raw fields to `CanonicalRecord` structures (`COMPLETE`, `PARTIAL`, `MISSING`, `UNVERIFIED`).
4. **Validation & Issue Harvesting:** Detects negative quantity, invalid price, NaN/Infinity, malformed dates, and duplicate positions.
5. **Provenance Attribution:** Binds `source`, `ingestionJobId`, `confidence`, and `originalValue` snapshot to every record.
