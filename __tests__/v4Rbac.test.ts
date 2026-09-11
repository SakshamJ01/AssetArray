/**
 * AssetArray 4.0 — Role-Based Access Control (RBAC) Matrix Tests
 *
 * Verifies all 5 canonical roles:
 * - ADMIN
 * - ADVISOR
 * - ANALYST
 * - OPERATIONS
 * - COMPLIANCE
 * against the formal capability matrix.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ROLES, PERMISSIONS, hasPermission, getRolePermissions, normalizeRole } = require("../backend/auth/rbac");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { requirePermission } = require("../backend/auth/middleware");

describe("V4 RBAC & CAPABILITY PERMISSIONS MATRIX", () => {
  test("ADMIN has full capabilities", () => {
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.CLIENT_WRITE)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.PORTFOLIO_WRITE)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.TAX_WRITE)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.USERS_MANAGE)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.FIRM_CONFIGURE)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.AUDIT_READ)).toBe(true);
  });

  test("ADVISOR has client & portfolio CRUD, tax write, but NO user or firm administration", () => {
    expect(hasPermission(ROLES.ADVISOR, PERMISSIONS.CLIENT_READ)).toBe(true);
    expect(hasPermission(ROLES.ADVISOR, PERMISSIONS.CLIENT_WRITE)).toBe(true);
    expect(hasPermission(ROLES.ADVISOR, PERMISSIONS.PORTFOLIO_READ)).toBe(true);
    expect(hasPermission(ROLES.ADVISOR, PERMISSIONS.PORTFOLIO_WRITE)).toBe(true);
    expect(hasPermission(ROLES.ADVISOR, PERMISSIONS.TAX_READ)).toBe(true);
    expect(hasPermission(ROLES.ADVISOR, PERMISSIONS.TAX_WRITE)).toBe(true);
    expect(hasPermission(ROLES.ADVISOR, PERMISSIONS.TASKS_WRITE)).toBe(true);
    expect(hasPermission(ROLES.ADVISOR, PERMISSIONS.DECISIONS_WRITE)).toBe(true);
    
    // Explicitly Denied
    expect(hasPermission(ROLES.ADVISOR, PERMISSIONS.USERS_MANAGE)).toBe(false);
    expect(hasPermission(ROLES.ADVISOR, PERMISSIONS.FIRM_CONFIGURE)).toBe(false);
    expect(hasPermission(ROLES.ADVISOR, PERMISSIONS.AUDIT_READ)).toBe(false);
  });

  test("ANALYST has read-only financial access, NO client write, NO tax write, NO user management", () => {
    expect(hasPermission(ROLES.ANALYST, PERMISSIONS.CLIENT_READ)).toBe(true);
    expect(hasPermission(ROLES.ANALYST, PERMISSIONS.PORTFOLIO_READ)).toBe(true);
    expect(hasPermission(ROLES.ANALYST, PERMISSIONS.FINANCIAL_READ)).toBe(true);
    expect(hasPermission(ROLES.ANALYST, PERMISSIONS.TAX_READ)).toBe(true);

    // Explicitly Denied
    expect(hasPermission(ROLES.ANALYST, PERMISSIONS.CLIENT_WRITE)).toBe(false);
    expect(hasPermission(ROLES.ANALYST, PERMISSIONS.PORTFOLIO_WRITE)).toBe(false);
    expect(hasPermission(ROLES.ANALYST, PERMISSIONS.TAX_WRITE)).toBe(false);
    expect(hasPermission(ROLES.ANALYST, PERMISSIONS.USERS_MANAGE)).toBe(false);
    expect(hasPermission(ROLES.ANALYST, PERMISSIONS.AUDIT_READ)).toBe(false);
  });

  test("OPERATIONS has client/portfolio write & CAS ingestion, but NO tax write or audit read", () => {
    expect(hasPermission(ROLES.OPERATIONS, PERMISSIONS.CLIENT_READ)).toBe(true);
    expect(hasPermission(ROLES.OPERATIONS, PERMISSIONS.CLIENT_WRITE)).toBe(true);
    expect(hasPermission(ROLES.OPERATIONS, PERMISSIONS.PORTFOLIO_READ)).toBe(true);
    expect(hasPermission(ROLES.OPERATIONS, PERMISSIONS.PORTFOLIO_WRITE)).toBe(true);

    // Explicitly Denied
    expect(hasPermission(ROLES.OPERATIONS, PERMISSIONS.TAX_WRITE)).toBe(false);
    expect(hasPermission(ROLES.OPERATIONS, PERMISSIONS.AUDIT_READ)).toBe(false);
    expect(hasPermission(ROLES.OPERATIONS, PERMISSIONS.USERS_MANAGE)).toBe(false);
  });

  test("COMPLIANCE has read-only access to clients, portfolios, and audit events, NO write capabilities", () => {
    expect(hasPermission(ROLES.COMPLIANCE, PERMISSIONS.CLIENT_READ)).toBe(true);
    expect(hasPermission(ROLES.COMPLIANCE, PERMISSIONS.PORTFOLIO_READ)).toBe(true);
    expect(hasPermission(ROLES.COMPLIANCE, PERMISSIONS.AUDIT_READ)).toBe(true);

    // Explicitly Denied
    expect(hasPermission(ROLES.COMPLIANCE, PERMISSIONS.CLIENT_WRITE)).toBe(false);
    expect(hasPermission(ROLES.COMPLIANCE, PERMISSIONS.PORTFOLIO_WRITE)).toBe(false);
    expect(hasPermission(ROLES.COMPLIANCE, PERMISSIONS.TAX_WRITE)).toBe(false);
    expect(hasPermission(ROLES.COMPLIANCE, PERMISSIONS.USERS_MANAGE)).toBe(false);
  });

  test("Legacy role normalization works seamlessly", () => {
    expect(normalizeRole("advisor")).toBe(ROLES.ADVISOR);
    expect(normalizeRole("admin")).toBe(ROLES.ADMIN);
    expect(normalizeRole("principal")).toBe(ROLES.ADMIN);
    expect(normalizeRole("rm")).toBe(ROLES.ADVISOR);
    expect(normalizeRole("ops")).toBe(ROLES.OPERATIONS);
    expect(normalizeRole("unknown_role")).toBe(ROLES.ADVISOR);
  });

  test("requirePermission middleware blocks unauthorized roles with HTTP 403", () => {
    const guard = requirePermission(PERMISSIONS.USERS_MANAGE);

    // 1. Advisor attempts user management -> Rejected 403
    const reqAdvisor: any = { user: { id: "u1", role: "ADVISOR" } };
    const resAdvisor: any = {
      statusCode: 200,
      status(code: number) { this.statusCode = code; return this; },
      json(data: any) { this.data = data; },
    };
    let nextCalledAdvisor = false;
    guard(reqAdvisor, resAdvisor, () => { nextCalledAdvisor = true; });
    expect(resAdvisor.statusCode).toBe(403);
    expect(nextCalledAdvisor).toBe(false);

    // 2. Admin attempts user management -> Allowed
    const reqAdmin: any = { user: { id: "u2", role: "ADMIN" } };
    const resAdmin: any = {};
    let nextCalledAdmin = false;
    guard(reqAdmin, resAdmin, () => { nextCalledAdmin = true; });
    expect(nextCalledAdmin).toBe(true);
  });
});
