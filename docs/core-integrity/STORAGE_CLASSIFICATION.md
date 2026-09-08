# Storage Classification (3.3.x core-integrity)

| Data | Location | Form | Notes |
|---|---|---|---|
| PIN | `SecureStore` (native) / web storage + memory | Plaintext secret (unlock gate only, never as crypto key alone) | Web is NOT hardware-backed — explicit warning in `storage.web.ts`. Native fallback is explicit `__insecure_fallback_` namespace, never silent. |
| Clients / Goals / Messages / Vault | `AsyncStorage` (`asset_array_clients`, `asset_array_goals`, `asset_array_advisor_messages`, `asset_array_vault_documents`) | Plaintext JSON (local-only) | Cloud copy is PBKDF2-encrypted (`pinCrypto.ts` `AA1.` envelope). Local-at-rest encryption is future work — do not store real PII on shared devices without PIN. |
| Cloud backup ciphertext | Backend `encrypted_sync_blobs` (Mongo) | Opaque ciphertext (`AA1.` PBKDF2 envelope or legacy AES) | Server never sees PIN. Ownership enforced server-side (`ownerId` vs `req.user`). |
| Auth session (access+refresh) | `SecureStore`/web storage (`asset_array_auth_session`) | Bearer tokens | Short-lived access (15m) + rotating refresh (30d, expiry+revocation checked). Web keeps in same-origin storage — XSS would expose; mitigate with short TTL + logout. |
| Market snapshots | `AsyncStorage` (`@assetarray_historical_snapshots_v1`) | Plain numbers, capped 2000 | Bulk-read via `getSnapshotCountsByEntity`. Demo seeds only with explicit `isDemo`. |
| `DEMO_PRO` / billing cache | `AsyncStorage` | Local flag | NEVER authoritative for entitlement. Server-side RevenueCat/entitlement is authoritative. |
| Cloud settings / PIN salt metadata | Secure storage | Non-secret config | Endpoint allow-list validated (`http/https` only). |

Web downgrade is explicit and logged in dev. Native downgrade is namespaced and warned.
