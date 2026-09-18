/**
 * Runtime environment helpers for the AI gateway.
 *
 * Deterministic unit tests must never block on live network round-trips to a
 * cloud model proxy. Two distinct needs exist:
 *
 *  - Tests that assert the deterministic fallback (v4AiRouting) need providers
 *    to be unreachable instantly, without any real socket being opened.
 *  - Tests that mock `global.fetch` (aiStream, freeFirstAi) need providers to
 *    remain "configured" so the mocked streaming proxy path is exercised.
 *
 * The shared, non-behavior-changing compromise: in the automated test
 * environment every provider attempt is given a near-zero timeout budget, so a
 * mocked fetch resolves instantly and an unmocked one fails fast. Production
 * and development keep the full institutional timeout policy.
 */

export function isAutomatedTestEnvironment(): boolean {
  return (
    (typeof process !== "undefined" &&
      typeof process.env !== "undefined" &&
      process.env.NODE_ENV === "test") ||
    typeof jest !== "undefined"
  );
}

/**
 * Timeout budget for a single provider attempt. In the automated test
 * environment this is intentionally tiny: mocked fetches resolve well within
 * it, while any accidental live network call fails fast instead of stalling
 * the suite. Production/dev always use the real institutional policy.
 */
export const TEST_ENVIRONMENT_PROVIDER_TIMEOUT_MS = 50;

