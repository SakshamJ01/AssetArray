# E2E Test Isolation & Local Storage Hygiene

1. **Storage Sandboxing**: All automated browser E2E test scripts must either operate in isolated browser contexts (e.g. Incognito / clean temporary profiles) or explicitly clean up test keys from `localStorage` (`asset_array_clients`, auth tokens, etc.) upon test suite completion.
2. **Identification & Clean Tear-down**: Any synthetic test records generated during UAT or validation runs must use clear, filterable identifiers (e.g. `TEST_` prefix) and be systematically purged post-test to avoid contaminating live production views.
3. **No Automatic Seeding in Production**: Ensure production bundle artifacts and backend databases contain zero default test fixtures or automatic client seeds.
