/**
 * AssetArray backend auth crypto (extracted pure module — no server state).
 * PBKDF2 password hashing (per-user salt, legacy secret fallback),
 * constant-time comparison, minimal HS256 JWT sign/verify,
 * and refresh-session usability checks. Same behavior as the former
 * inline implementations in backend/server.js.
 */
const crypto = require("crypto");

function safeEqual(a, b) {
  const aBuf = Buffer.from(a || "", "utf8");
  const bBuf = Buffer.from(b || "", "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function newPasswordSalt() {
  return crypto.randomBytes(16).toString("hex");
}

function hashPassword(password, salt, legacySecret) {
  // New accounts use a per-user random salt. Legacy accounts created before
  // per-user salts fall back to the provided legacy secret for verification.
  const effectiveSalt = salt || legacySecret;
  if (!effectiveSalt) {
    throw new Error("hashPassword requires a salt or legacy secret.");
  }
  return crypto.pbkdf2Sync(String(password), effectiveSalt, 100_000, 64, "sha512").toString("hex");
}

function verifyPasswordHash(password, user, legacySecret) {
  if (!user || !user.passwordHash || password === undefined || password === null) return false;
  if (user.passwordSalt) {
    return safeEqual(user.passwordHash, hashPassword(password, user.passwordSalt));
  }
  return safeEqual(user.passwordHash, hashPassword(password, undefined, legacySecret));
}

function signToken(payload, secret, ttlSeconds) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = { ...payload, exp };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedBody = Buffer.from(JSON.stringify(body)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64url");
  return `${encodedHeader}.${encodedBody}.${signature}`;
}

function verifyToken(token, secret) {
  try {
    if (typeof token !== "string" || !secret) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedBody, signature] = parts;
    if (!encodedHeader || !encodedBody || !signature) return null;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${encodedHeader}.${encodedBody}`)
      .digest("base64url");
    if (!safeEqual(signature, expectedSignature)) return null;
    const payload = JSON.parse(Buffer.from(encodedBody, "base64url").toString("utf8"));
    if (!payload || typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Single authority for "may this refresh session mint new tokens".
 * False when the record is missing, revoked, has no usable expiry,
 * or is expired. Callers map false → 401.
 */
function isRefreshSessionUsable(session, nowMs) {
  const now = typeof nowMs === "number" ? nowMs : Date.now();
  if (!session || session.revoked) return false;
  if (!session.expiresAt) return false;
  const expiryMs = new Date(session.expiresAt).getTime();
  return Number.isFinite(expiryMs) && expiryMs > now;
}

module.exports = {
  safeEqual,
  newPasswordSalt,
  hashPassword,
  verifyPasswordHash,
  signToken,
  verifyToken,
  isRefreshSessionUsable,
};
