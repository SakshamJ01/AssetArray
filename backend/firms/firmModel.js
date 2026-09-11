/**
 * AssetArray 4.0 — Firm / Tenant Domain Model
 * Represents the top-level institutional entity (e.g. RIA or Multi-Family Office).
 */

class FirmModel {
  /**
   * Sanitizes and normalizes a Firm entity for persistence.
   */
  static sanitize(firm) {
    if (!firm) return null;
    return {
      id: String(firm.id || `firm_${Date.now()}`),
      name: String(firm.name || "Advisory Practice").trim(),
      sebiRegistrationNo: firm.sebiRegistrationNo ? String(firm.sebiRegistrationNo).trim() : null,
      riaLicense: firm.riaLicense ? String(firm.riaLicense).trim() : null,
      status: ["ACTIVE", "SUSPENDED", "INACTIVE"].includes(firm.status) ? firm.status : "ACTIVE",
      tier: firm.tier || "INSTITUTIONAL_CORE",
      branding: {
        logoUrl: firm.branding?.logoUrl || null,
        primaryColor: firm.branding?.primaryColor || "#0f172a",
        accentColor: firm.branding?.accentColor || "#2563eb",
        firmDisplayName: firm.branding?.firmDisplayName || firm.name || "AssetArray Wealth",
      },
      settings: {
        baseCurrency: firm.settings?.baseCurrency || "INR",
        defaultBenchmark: firm.settings?.defaultBenchmark || "BALANCED_65_35",
        taxYear: firm.settings?.taxYear || "AY 2026-27",
        complianceEnforcement: firm.settings?.complianceEnforcement !== false,
      },
      createdAt: firm.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Returns a safe public presentation of the Firm (omits internal secrets).
   */
  static toPublic(firm) {
    if (!firm) return null;
    const sanitized = this.sanitize(firm);
    return {
      id: sanitized.id,
      name: sanitized.name,
      sebiRegistrationNo: sanitized.sebiRegistrationNo,
      riaLicense: sanitized.riaLicense,
      status: sanitized.status,
      tier: sanitized.tier,
      branding: sanitized.branding,
      settings: sanitized.settings,
      createdAt: sanitized.createdAt,
    };
  }
}

module.exports = { FirmModel };
