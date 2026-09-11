/**
 * AssetArray 4.0 — User & Membership Domain Model
 * Represents a human user (Advisor, Admin, Analyst, Ops, Compliance)
 * bound strictly to a Firm tenant.
 */

const { normalizeRole } = require("../auth/rbac");

class UserModel {
  /**
   * Sanitizes a user entity for storage.
   */
  static sanitize(user, firmId) {
    if (!user) return null;
    return {
      id: String(user.id || `user_${Date.now()}`),
      firmId: String(firmId || user.firmId || "firm_default_practice"),
      username: String(user.username || "").trim().toLowerCase(),
      email: user.email ? String(user.email).trim().toLowerCase() : null,
      fullName: user.fullName ? String(user.fullName).trim() : user.username,
      role: normalizeRole(user.role),
      status: ["ACTIVE", "SUSPENDED", "INVITED"].includes(user.status) ? user.status : "ACTIVE",
      assignedClientIds: Array.isArray(user.assignedClientIds) ? user.assignedClientIds : [],
      passwordHash: user.passwordHash || null,
      passwordSalt: user.passwordSalt || null,
      active: user.active !== false,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: user.lastLoginAt || null,
    };
  }

  /**
   * Returns a safe public presentation of the User.
   */
  static toPublic(user) {
    if (!user) return null;
    return {
      id: user.id,
      firmId: user.firmId,
      username: user.username,
      email: user.email,
      fullName: user.fullName || user.username,
      role: normalizeRole(user.role),
      status: user.status || (user.active !== false ? "ACTIVE" : "SUSPENDED"),
      active: user.active !== false,
      assignedClientIds: user.assignedClientIds || [],
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}

module.exports = { UserModel };
