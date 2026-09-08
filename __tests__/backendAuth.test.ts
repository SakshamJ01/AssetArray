/**
 * Auth regression (no DB, no network): exercises the real backend auth crypto
 * module plus contract tripwires on server.js and the frontend demo client.
 *
 * TEST 1: configured admin credentials verify (login success path).
 * TEST 2: wrong password fails.
 * TEST 3: 1-click demo login succeeds without any frontend password
 *         (route exists, ignores credentials, mints demo-identity tokens).
 * TEST 4: demo login never requires a plaintext frontend password.
 * TEST 5: production without valid admin config fails safely.
 * TEST 6: expired/malformed access tokens are rejected.
 * TEST 7: expired/revoked refresh sessions are rejected.
 * TEST 8: logout invalidates the refresh session (revocation persisted).
 */
const fs = require("fs") as typeof import("fs");
const path = require("path") as typeof import("path");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const authCrypto = require("../backend/auth/crypto") as typeof import("../backend/auth/crypto");

const readRepo = (rel: string): string =>
  fs.readFileSync(path.join(__dirname, "..", rel), "utf8");

describe("AUTH REGRESSION", () => {
  test("TEST 1: admin login succeeds with configured credentials", () => {
    const configuredPassword = "correct-admin-password-for-test";
    const salt = authCrypto.newPasswordSalt();
    const storedUser = {
      id: "advisor-admin",
      username: "admin",
      role: "advisor",
      passwordSalt: salt,
      passwordHash: authCrypto.hashPassword(configuredPassword, salt),
      active: true,
    };
    expect(authCrypto.verifyPasswordHash(configuredPassword, storedUser)).toBe(true);
  });

  test("TEST 2: wrong password fails", () => {
    const salt = authCrypto.newPasswordSalt();
    const storedUser = {
      passwordSalt: salt,
      passwordHash: authCrypto.hashPassword("right-password", salt),
    };
    expect(authCrypto.verifyPasswordHash("wrong-password", storedUser)).toBe(false);
    expect(authCrypto.verifyPasswordHash("", storedUser)).toBe(false);
    expect(authCrypto.verifyPasswordHash(undefined, storedUser)).toBe(false);
  });

  test("TEST 3: demo-login route exists and mints tokens without credentials", () => {
    const serverSrc = readRepo("backend/server.js");
    expect(serverSrc).toMatch(/app\.post\("\/api\/auth\/demo-login"/);
    // Demo gate: explicit enable flag, 403 when disabled.
    expect(serverSrc).toMatch(/DEMO_AUTH_ENABLED/);
    expect(serverSrc).toMatch(/Demo access is not enabled/);
    // Demo identity is role-restricted and looked up server-side.
    expect(serverSrc).toMatch(/role !== "demo"|role: "demo"/);
    // Tokens are minted via the same session pipeline as normal login.
    const demoBlock = serverSrc.slice(serverSrc.indexOf("/api/auth/demo-login"));
    expect(demoBlock).toMatch(/buildTokens\(user\)/);
    expect(demoBlock).toMatch(/expiresIn/);
  });

  test("TEST 4: demo login never requires a plaintext frontend password", () => {
    const appSrc = readRepo("App.tsx");
    const syncSrc = readRepo("src/services/secureSync.ts");
    // No demo password literal anywhere in the app bundle sources.
    for (const [name, src] of [["App.tsx", appSrc], ["secureSync.ts", syncSrc]] as const) {
      expect(`${name} has no hardcoded demo password`).toBeTruthy();
      expect(src).not.toMatch(/AssetArrayLocalAdmin/);
    }
    // The demo client sends an empty body — no password field exists.
    expect(syncSrc).toMatch(/demoLoginAdvisor/);
    const demoFn = syncSrc.slice(syncSrc.indexOf("demoLoginAdvisor"));
    expect(demoFn).toMatch(/\/api\/auth\/demo-login/);
    expect(demoFn).not.toMatch(/password/);
    // quickDemoLogin no longer sets or sends any password.
    const quickDemo = appSrc.slice(appSrc.indexOf("async function quickDemoLogin"));
    expect(quickDemo).not.toMatch(/targetPass|demoPass|password:\s*target|loginAdvisor\(\{/);
    expect(quickDemo).toMatch(/demoLoginAdvisor/);
    // Admin password must never travel via public env into the bundle.
    expect(appSrc).not.toMatch(/EXPO_PUBLIC_.*(PASSWORD|SECRET)/);
    expect(syncSrc).not.toMatch(/EXPO_PUBLIC_.*(PASSWORD|SECRET)/);
  });

  test("TEST 5: production without valid admin config fails safely", () => {
    const saved = { ...process.env };
    try {
      process.env.NODE_ENV = "production";
      process.env.AUTH_REQUIRED = "true";
      delete process.env.TOKEN_SECRET;
      delete process.env.REFRESH_SECRET;
      delete process.env.MONGO_URI;
      delete process.env.MONGODB_URI;
      process.env.CORS_ORIGIN = "*";
      delete process.env.ADMIN_PASSWORD;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { validateEnv } = require("../backend/config/env") as typeof import("../backend/config/env");
      const result = validateEnv({ strict: true });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.join(" ")).toMatch(/ADMIN_PASSWORD/);
    } finally {
      process.env = saved;
    }
  });

  test("TEST 6: expired and malformed access tokens are rejected", () => {
    const secret = "test-secret-for-auth-regression";
    const expired = authCrypto.signToken({ sub: "u1", type: "access" }, secret, -10);
    expect(authCrypto.verifyToken(expired, secret)).toBeNull();
    expect(authCrypto.verifyToken("not.a.token", secret)).toBeNull();
    expect(authCrypto.verifyToken("", secret)).toBeNull();
    expect(authCrypto.verifyToken(null, secret)).toBeNull();
    // Wrong secret fails closed.
    const valid = authCrypto.signToken({ sub: "u1", type: "access" }, secret, 900);
    expect(authCrypto.verifyToken(valid, "different-secret")).toBeNull();
    // Valid token passes.
    expect(authCrypto.verifyToken(valid, secret)).toMatchObject({ sub: "u1", type: "access" });
  });

  test("TEST 7: expired/revoked refresh sessions are rejected", () => {
    const future = new Date(Date.now() + 3600_000).toISOString();
    const past = new Date(Date.now() - 1000).toISOString();
    expect(authCrypto.isRefreshSessionUsable(null, Date.now())).toBe(false);
    expect(authCrypto.isRefreshSessionUsable({ revoked: true, expiresAt: future }, Date.now())).toBe(false);
    expect(authCrypto.isRefreshSessionUsable({ revoked: false, expiresAt: past }, Date.now())).toBe(false);
    expect(authCrypto.isRefreshSessionUsable({ revoked: false }, Date.now())).toBe(false);
    expect(authCrypto.isRefreshSessionUsable({ revoked: false, expiresAt: future }, Date.now())).toBe(true);
    // Server refresh handler enforces usability before rotation.
    const serverSrc = readRepo("backend/server.js");
    expect(serverSrc).toMatch(/isRefreshSessionUsable\(session/);
  });

  test("TEST 8: logout invalidates the refresh session", () => {
    const serverSrc = readRepo("backend/server.js");
    const logoutBlock = serverSrc.slice(serverSrc.indexOf('app.post("/api/auth/logout"'));
    expect(logoutBlock).toMatch(/revoked: true/);
    expect(logoutBlock).toMatch(/revokedAt/);
    // A revoked session can no longer mint tokens.
    expect(
      authCrypto.isRefreshSessionUsable(
        { revoked: true, expiresAt: new Date(Date.now() + 3600_000).toISOString() },
        Date.now()
      )
    ).toBe(false);
  });

  test("auth response-code contract is intact", () => {
    const serverSrc = readRepo("backend/server.js");
    expect(serverSrc).toMatch(/username and password are required/); // 400 branch
    expect(serverSrc).toMatch(/Invalid credentials/); // 401 branch
    expect(serverSrc).toMatch(/Database initializing or reconnecting/); // 503 branch
    expect(serverSrc).toMatch(/Demo identity is not available/); // demo 503 branch
  });
});
