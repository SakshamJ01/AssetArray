# Production Sanitization — Data Migration Notes (3.3.x)

Scope: whether any persisted data must move or be cleaned when shipping the
sanitized build. Nothing in this pass changes the real-user record schema.

## 1. Demo identity documents in MongoDB (optional cleanup)
Prior 3.2.x builds ran a server-side demo identity (`backend/server.js`
`demo-login` + boot seeding). Deployments that ever accepted a demo login may
carry orphan records in MongoDB Atlas:

- A `users` document for the demo admin (`username: "demo"` / demo role).
- Associated per-identity `synccollections` blobs (clients/settings) owned by
  that demo user.

**Recommendation:** delete these documents. They are orphaned — the authentic
admin record is re-derived every boot from `ADMIN_USERNAME`/`ADMIN_PASSWORD`,
and real advisor data is separate. Removal is safe; retention is harmless
(orphan blobs are never surfaced because no client can authenticate as them).

Suggested (run in `mongosh` against your collection):
```js
db.users.deleteMany({ username: "demo" })
// delete sync collections blobs owned by the deleted demo user id(s)
```

Rotation already handled: the admin record's password is re-hashed on boot when
the configured `ADMIN_PASSWORD` no longer matches — nothing else is touched.

## 2. Local storage: demo-hydrated client data (informative)
On 3.2.x, a real user who used "1-Click Demo Sign In" or "Continue in Offline
Mode" could have demo clients/activities/decisions written to their device
(AsyncStorage / SecureStore). This pass removes the ability to *create* that
state and the demo fixtures that populated it.

**No migration required.** Real client, holding, goal, and subscription data is
untouched. Installations that contain legacy demo-hydrated records can clear
them manually (Settings → clear app data) or leave them — nothing in the
sanitized build re-seeds or re-labels them.

## 3. Web pro entitlement storage key (legacy name, keep)
`billing.web.ts`/`billing.native.ts` persist the Pro entitlement under the
legacy key `asset_array_demo_is_pro` (web) with native RC entitlements on
mobile. This is **real** entitlement persistence: keep the key so existing
subscribers keep their status across the upgrade. A future release may rename
the key with a one-time read-and-write migration; not worth the downgrade risk
in 3.3.x.

## 4. Seeds that were never persisted (no migration)
- Demo client roster (`DEMO_CLIENTS`) — in-memory fixture; deleted.
- Initial activity timeline / decision journal entries — in-memory; now empty start.
- Mock custodial accounts — created in-memory at construction; now empty start.

## 5. Doc/registry regeneration (no runtime effect)
`feature-inventory.json` regenerated 82 → 79 features. Pure documentation.

## Migration test matrix
| Item | Test | Result |
| --- | --- | --- |
| Real clients/holdings survive deploy | Load web app, login, roster intact | Pending post-deploy |
| No re-seed on fresh install | New browser profile → login → honest empty state | Pending post-deploy |
| Existing Pro keeps entitlement | Web login on account with stored pro | Pending post-deploy |
| Demo login endpoint dead in prod | `POST /api/auth/demo-login` → 404/not found | Pending post-deploy |