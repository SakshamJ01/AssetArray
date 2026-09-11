/**
 * AssetArray 4.0 — Immutable Audit Ledger & Event Model
 * Cryptographic SHA-256 hash-chained immutable audit log for compliance & fiduciary tracking.
 */

const crypto = require("crypto");

class AuditModel {
  /**
   * Generates a cryptographic SHA-256 hash for an audit record.
   */
  static computeHash({ prevHash, timestamp, firmId, actorId, action, entityType, entityId, beforeSnapshot, afterSnapshot }) {
    const payload = [
      prevHash || "GENESIS",
      timestamp,
      firmId,
      actorId,
      action,
      entityType || "SYSTEM",
      entityId || "N/A",
      JSON.stringify(beforeSnapshot || null),
      JSON.stringify(afterSnapshot || null),
    ].join("|");

    return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
  }

  /**
   * Sanitizes and seals an AuditEvent record with cryptographic hash integrity.
   */
  static createEvent({
    id,
    firmId,
    actorId,
    actorUsername,
    actorRole,
    action,
    entityType,
    entityId,
    beforeSnapshot,
    afterSnapshot,
    reason,
    metadata,
    prevHash,
    ipAddress,
  }) {
    const timestamp = new Date().toISOString();
    const eventId = id || `aud_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    const effectiveFirmId = String(firmId || "firm_default_practice");
    const effectiveActorId = String(actorId || "system");

    const sha256Hash = this.computeHash({
      prevHash,
      timestamp,
      firmId: effectiveFirmId,
      actorId: effectiveActorId,
      action,
      entityType,
      entityId,
      beforeSnapshot,
      afterSnapshot,
    });

    return {
      id: eventId,
      firmId: effectiveFirmId,
      actorId: effectiveActorId,
      actorUsername: actorUsername || "system",
      actorRole: actorRole || "SYSTEM",
      action: String(action).trim(),
      entityType: entityType ? String(entityType).trim().toUpperCase() : "SYSTEM",
      entityId: entityId ? String(entityId) : null,
      timestamp,
      beforeSnapshot: beforeSnapshot || null,
      afterSnapshot: afterSnapshot || null,
      reason: reason ? String(reason).trim() : null,
      metadata: metadata || {},
      prevHash: prevHash || null,
      sha256Hash,
      ipAddress: ipAddress || "internal",
    };
  }
}

module.exports = { AuditModel };
