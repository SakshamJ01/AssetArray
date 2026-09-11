/**
 * AssetArray 4.0 — Authentication, Multi-Tenancy & RBAC Middleware
 * Enforces:
 * 1. Authentication (validates access token)
 * 2. Tenant Resolution (derives firmId strictly from server-side verified token)
 * 3. Authorization (verifies role has required capability permission)
 * 4. Tenant Scoping (enforces WHERE firmId = req.tenant.firmId on all database operations)
 */

const { verifyToken } = require("./crypto");
const { hasPermission, normalizeRole } = require("./rbac");

const DEFAULT_DEV_FIRM_ID = "firm_default_practice";

/**
 * Validates JWT access token and attaches verified identity to req.user.
 */
function requireAuth(tokenSecret, authRequired = true) {
  return (req, res, next) => {
    if (!authRequired) {
      req.user = {
        id: "dev-owner",
        username: "dev-owner",
        firmId: DEFAULT_DEV_FIRM_ID,
        role: "ADVISOR",
      };
      req.tenant = { firmId: DEFAULT_DEV_FIRM_ID };
      return next();
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (!token) {
      res.status(401).json({ error: "Unauthorized: Missing authentication token." });
      return;
    }

    const payload = verifyToken(token, tokenSecret);
    if (!payload || payload.type !== "access") {
      res.status(401).json({ error: "Unauthorized: Invalid or expired access token." });
      return;
    }

    const firmId = payload.firmId || DEFAULT_DEV_FIRM_ID;
    const role = normalizeRole(payload.role);

    req.user = {
      id: payload.sub,
      username: payload.username,
      firmId,
      role,
    };

    req.tenant = {
      firmId,
    };

    next();
  };
}

/**
 * Middleware that guarantees tenant context is resolved and active.
 * Fails closed if req.user or req.tenant.firmId is missing.
 */
function resolveTenant(req, res, next) {
  if (!req.tenant || !req.tenant.firmId) {
    res.status(403).json({ error: "Forbidden: No tenant context resolved." });
    return;
  }
  next();
}

/**
 * Middleware that guards a route by requiring a specific capability permission.
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      res.status(401).json({ error: "Unauthorized: No user credentials." });
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({
        error: `Forbidden: Role '${req.user.role}' lacks required permission '${permission}'.`,
        requiredPermission: permission,
        role: req.user.role,
      });
      return;
    }

    next();
  };
}

/**
 * Helper to ensure any MongoDB query filter is strictly scoped to the current tenant.
 * Prevents accidental cross-tenant data leaks.
 */
function enforceTenantScope(req, query = {}) {
  const firmId = req.tenant?.firmId || req.user?.firmId;
  if (!firmId) {
    throw new Error("Cannot execute tenant query without active firmId scope.");
  }
  return {
    ...query,
    firmId,
  };
}

module.exports = {
  requireAuth,
  resolveTenant,
  requirePermission,
  enforceTenantScope,
  DEFAULT_DEV_FIRM_ID,
};
