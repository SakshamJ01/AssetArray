/**
 * AssetArray 4.0 — Household Domain Model
 * Represents multi-member family units (e.g., Sharma Family Office: Self, Spouse, HUF).
 * Aggregates client members for consolidated net worth, tax harvesting, and reporting.
 */

class HouseholdModel {
  /**
   * Sanitizes and bounds a Household entity within a Firm tenant.
   */
  static sanitize(household, firmId) {
    if (!household) return null;
    return {
      id: String(household.id || `hh_${Date.now()}`),
      firmId: String(firmId || household.firmId || "firm_default_practice"),
      name: String(household.name || "Family Household").trim(),
      primaryClientId: household.primaryClientId ? String(household.primaryClientId) : null,
      memberClientIds: Array.isArray(household.memberClientIds) ? household.memberClientIds : [],
      consolidatedAum: typeof household.consolidatedAum === "number" ? household.consolidatedAum : 0,
      currency: household.currency || "INR",
      notes: household.notes ? String(household.notes).trim() : "",
      createdAt: household.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  static toPublic(household) {
    return this.sanitize(household);
  }
}

module.exports = { HouseholdModel };
