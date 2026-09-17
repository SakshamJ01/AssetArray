/**
 * AssetArray 4.0 — Backend Reconciliation Model
 */

const memDiscrepancies = new Map();

class ReconciliationModel {
  static createDiscrepancy(params, firmId) {
    if (!firmId) throw new Error("firmId is required for ReconciliationDiscrepancy.");
    const disc = {
      discrepancyId: params.discrepancyId || `disc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      firmId,
      entity: params.entity || {},
      type: params.type || "VALUE_MISMATCH",
      expected: params.expected,
      observed: params.observed,
      difference: params.difference,
      source: params.source || "RECONCILIATION_ENGINE",
      severity: params.severity || "MEDIUM",
      status: params.status || "OPEN",
      detectedAt: params.detectedAt || new Date().toISOString(),
      resolvedAt: params.resolvedAt,
      resolvedBy: params.resolvedBy,
      resolutionNote: params.resolutionNote,
    };
    memDiscrepancies.set(disc.discrepancyId, disc);
    return disc;
  }

  static getDiscrepancyById(discrepancyId, firmId) {
    const disc = memDiscrepancies.get(discrepancyId);
    if (!disc || disc.firmId !== firmId) return null;
    return disc;
  }

  static listDiscrepancies(firmId, status = null) {
    return Array.from(memDiscrepancies.values()).filter(
      (d) => d.firmId === firmId && (!status || d.status === status)
    );
  }

  static resolve(discrepancyId, firmId, resolvedBy, note) {
    const disc = this.getDiscrepancyById(discrepancyId, firmId);
    if (!disc) return null;
    disc.status = "RESOLVED";
    disc.resolvedAt = new Date().toISOString();
    disc.resolvedBy = resolvedBy;
    disc.resolutionNote = note || "Resolved via API";
    return disc;
  }

  static clear() {
    memDiscrepancies.clear();
  }
}

module.exports = { ReconciliationModel };
