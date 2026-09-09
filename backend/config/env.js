/**
 * AssetArray backend configuration module (3.3.x core-integrity).
 * Single place that validates required production environment.
 *
 * Required in production:
 *   NODE_ENV=production, TOKEN_SECRET, REFRESH_SECRET, MONGODB/MONGO_URI, CORS_ORIGIN
 * Production rejects: wildcard CORS, dev secrets, default admin password.
 */

const DEFAULT_DEV_TOKEN_SECRET = "asset-array-dev-secret-change-in-production";
const DEFAULT_DEV_REFRESH_SECRET = "asset-array-dev-refresh-secret-change-in-production";
const DEFAULT_ADMIN_PASSWORD = "ChangeMeNow123!";

function get(name, fallback = "") {
  const v = process.env[name];
  return v === undefined || v === null ? fallback : String(v);
}

function validateEnv({ strict = process.env.NODE_ENV === "production" } = {}) {
  const errors = [];
  const warnings = [];
  const NODE_ENV = get("NODE_ENV", "development");
  const IS_PRODUCTION = NODE_ENV === "production";
  const AUTH_REQUIRED = get("AUTH_REQUIRED", "true") !== "false";
  const TOKEN_SECRET = get("TOKEN_SECRET", "");
  const REFRESH_SECRET = get("REFRESH_SECRET", "");
  const MONGO_URI = get("MONGO_URI", "") || get("MONGODB_URI", "");
  const CORS_ORIGIN = get("CORS_ORIGIN", "");
  const ADMIN_PASSWORD = get("ADMIN_PASSWORD", DEFAULT_ADMIN_PASSWORD);
  const ADMIN_USERNAME = (get("ADMIN_USERNAME", "admin").trim() || "admin");

  if (IS_PRODUCTION && AUTH_REQUIRED) {
    if (!TOKEN_SECRET || TOKEN_SECRET === DEFAULT_DEV_TOKEN_SECRET || TOKEN_SECRET.length < 32) {
      errors.push("TOKEN_SECRET must be set to a strong random value in production.");
    }
    if (!REFRESH_SECRET || REFRESH_SECRET === DEFAULT_DEV_REFRESH_SECRET || REFRESH_SECRET.length < 32) {
      errors.push("REFRESH_SECRET must be set to a strong random value in production.");
    }
    if (!MONGO_URI) {
      errors.push("MONGO_URI (or MONGODB_URI) is required in production.");
    }
    if (!CORS_ORIGIN || CORS_ORIGIN.trim() === "" || CORS_ORIGIN.trim() === "*") {
      errors.push("CORS_ORIGIN must be an explicit allow-list in production (no '*').");
    }
    if (!ADMIN_PASSWORD || ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD) {
      errors.push("ADMIN_PASSWORD must not be the default in production.");
    }
  } else {
    if (!TOKEN_SECRET) warnings.push("TOKEN_SECRET using development default.");
    if (CORS_ORIGIN === "*") warnings.push("CORS wildcard allowed only outside production.");
  }

  return {
    NODE_ENV,
    IS_PRODUCTION,
    AUTH_REQUIRED,
    errors,
    warnings,
    isValid: strict ? errors.length === 0 : true,
  };
}

module.exports = { validateEnv, DEFAULT_DEV_TOKEN_SECRET, DEFAULT_DEV_REFRESH_SECRET, DEFAULT_ADMIN_PASSWORD };
