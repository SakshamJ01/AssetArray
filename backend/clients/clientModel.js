/**
 * AssetArray 4.0 — Client Domain Model
 * Represents the individual legal/tax entity (PAN holder, KYC profile).
 * Reuses and is 100% backward-compatible with 3.3.x client attributes.
 */

class ClientModel {
  /**
   * Sanitizes and bounds a Client entity within a Firm tenant.
   */
  static sanitize(client, firmId) {
    if (!client) return null;
    return {
      id: String(client.id || `client_${Date.now()}`),
      firmId: String(firmId || client.firmId || "firm_default_practice"),
      householdId: client.householdId ? String(client.householdId) : null,
      name: String(client.name || "Unnamed Client").trim(),
      email: client.email ? String(client.email).trim() : null,
      phone: client.phone ? String(client.phone).trim() : null,
      category: client.category || "HNI",
      riskProfile: client.riskProfile || "Moderate",
      riskProfileScore: typeof client.riskProfileScore === "number" ? client.riskProfileScore : 60,
      pan: client.pan ? String(client.pan).trim().toUpperCase() : null,
      taxStatus: ["Resident", "NRI", "HUF", "Corporate"].includes(client.taxStatus) ? client.taxStatus : "Resident",
      kycStatus: ["VERIFIED", "PENDING", "EXPIRED"].includes(client.kycStatus) ? client.kycStatus : "VERIFIED",
      status: ["Active", "Lead", "Inactive"].includes(client.status) ? client.status : "Active",
      relationshipRole: client.relationshipRole || "PRIMARY", // PRIMARY, SPOUSE, CHILD, HUF_KARTA
      preferredChannel: client.preferredChannel || "Preferred",
      notes: client.notes ? String(client.notes).trim() : "",
      createdAt: client.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  static toPublic(client) {
    return this.sanitize(client);
  }
}

module.exports = { ClientModel };
