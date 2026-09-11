/**
 * AssetArray 4.0 — Role-Based Access Control (RBAC) Core Module
 * Defines the canonical 5 institutional roles, capability permissions,
 * and deterministic permission evaluation matrix.
 */

// 1. Canonical V4 Roles
const ROLES = {
  ADMIN: "ADMIN",
  ADVISOR: "ADVISOR",
  ANALYST: "ANALYST",
  OPERATIONS: "OPERATIONS",
  COMPLIANCE: "COMPLIANCE",
};

// 2. Canonical V4 Capability Permissions
const PERMISSIONS = {
  // Client Management
  CLIENT_READ: "client:read",
  CLIENT_WRITE: "client:write",
  
  // Household Management
  HOUSEHOLD_READ: "household:read",
  HOUSEHOLD_WRITE: "household:write",

  // Portfolio & Account Operations
  PORTFOLIO_READ: "portfolio:read",
  PORTFOLIO_WRITE: "portfolio:write",

  // Financial Analytics & Attribution
  FINANCIAL_READ: "financial:read",

  // Tax Intelligence & Harvesting
  TAX_READ: "tax:read",
  TAX_WRITE: "tax:write",

  // Reports & Publishing
  REPORTS_READ: "reports:read",
  REPORTS_GENERATE: "reports:generate",

  // Documents & Storage
  DOCUMENTS_READ: "documents:read",
  DOCUMENTS_WRITE: "documents:write",

  // Tasks & Decisions
  TASKS_READ: "tasks:read",
  TASKS_WRITE: "tasks:write",
  DECISIONS_READ: "decisions:read",
  DECISIONS_WRITE: "decisions:write",

  // Compliance & Immutable Audit
  AUDIT_READ: "audit:read",

  // Firm & User Administration
  USERS_MANAGE: "users:manage",
  FIRM_CONFIGURE: "firm:configure",
  
  // Encrypted Sync & Backup
  SYNC_MANAGE: "sync:manage",
};

// 3. Deterministic Role-to-Permissions Mapping Matrix
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Full capability set for firm tenant

  [ROLES.ADVISOR]: [
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.CLIENT_WRITE,
    PERMISSIONS.HOUSEHOLD_READ,
    PERMISSIONS.HOUSEHOLD_WRITE,
    PERMISSIONS.PORTFOLIO_READ,
    PERMISSIONS.PORTFOLIO_WRITE,
    PERMISSIONS.FINANCIAL_READ,
    PERMISSIONS.TAX_READ,
    PERMISSIONS.TAX_WRITE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.DOCUMENTS_WRITE,
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.TASKS_WRITE,
    PERMISSIONS.DECISIONS_READ,
    PERMISSIONS.DECISIONS_WRITE,
    PERMISSIONS.SYNC_MANAGE,
  ],

  [ROLES.ANALYST]: [
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.HOUSEHOLD_READ,
    PERMISSIONS.PORTFOLIO_READ,
    PERMISSIONS.FINANCIAL_READ,
    PERMISSIONS.TAX_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.DECISIONS_READ,
  ],

  [ROLES.OPERATIONS]: [
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.CLIENT_WRITE,
    PERMISSIONS.HOUSEHOLD_READ,
    PERMISSIONS.HOUSEHOLD_WRITE,
    PERMISSIONS.PORTFOLIO_READ,
    PERMISSIONS.PORTFOLIO_WRITE,
    PERMISSIONS.FINANCIAL_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.DOCUMENTS_WRITE,
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.TASKS_WRITE,
    PERMISSIONS.SYNC_MANAGE,
  ],

  [ROLES.COMPLIANCE]: [
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.HOUSEHOLD_READ,
    PERMISSIONS.PORTFOLIO_READ,
    PERMISSIONS.FINANCIAL_READ,
    PERMISSIONS.TAX_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.DECISIONS_READ,
    PERMISSIONS.AUDIT_READ,
  ],
};

/**
 * Normalizes legacy role names (e.g. "advisor" -> "ADVISOR", "admin" -> "ADMIN")
 */
function normalizeRole(role) {
  if (!role || typeof role !== "string") return ROLES.ADVISOR;
  const upper = role.trim().toUpperCase();
  if (ROLES[upper]) return ROLES[upper];
  // Backward compatibility aliases
  if (upper === "PRINCIPAL" || upper === "OWNER") return ROLES.ADMIN;
  if (upper === "RM" || upper === "WEALTH_ADVISOR") return ROLES.ADVISOR;
  if (upper === "OPS") return ROLES.OPERATIONS;
  return ROLES.ADVISOR;
}

/**
 * Evaluates whether a role possesses a specific permission capability.
 */
function hasPermission(role, permission) {
  const normRole = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[normRole] || [];
  return permissions.includes(permission);
}

/**
 * Returns the list of all granted permissions for a given role.
 */
function getRolePermissions(role) {
  const normRole = normalizeRole(role);
  return [...(ROLE_PERMISSIONS[normRole] || [])];
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  normalizeRole,
  hasPermission,
  getRolePermissions,
};
