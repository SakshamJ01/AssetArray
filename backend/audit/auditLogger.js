/**
 * AssetArray 4.0 — Audit Logger Service
 * Emits and persists immutable, tenant-partitioned audit events.
 */

const { AuditModel } = require("./auditModel");

// In-memory fallback if MongoDB collection is offline
const memAuditLogs = [];
const firmLastHash = new Map();

class AuditLogger {
  constructor(auditCollection = null) {
    this.auditCollection = auditCollection;
  }

  setCollection(col) {
    this.auditCollection = col;
  }

  /**
   * Logs an action with actor, tenant, snapshot state, and hash chaining.
   */
  async log(eventParams) {
    try {
      const firmId = eventParams.firmId || "firm_default_practice";
      let prevHash = firmLastHash.get(firmId) || null;

      // If DB connected and no in-memory hash, look up the last hash for this firm
      if (!prevHash && this.auditCollection) {
        const lastEvent = await this.auditCollection
          .find({ firmId })
          .sort({ timestamp: -1 })
          .limit(1)
          .project({ sha256Hash: 1 })
          .next();
        if (lastEvent?.sha256Hash) {
          prevHash = lastEvent.sha256Hash;
        }
      }

      const event = AuditModel.createEvent({
        ...eventParams,
        prevHash,
      });

      firmLastHash.set(firmId, event.sha256Hash);

      if (this.auditCollection) {
        await this.auditCollection.insertOne(event);
      } else {
        memAuditLogs.unshift(event);
        if (memAuditLogs.length > 500) memAuditLogs.pop();
      }

      return event;
    } catch (err) {
      console.warn(`[AuditLogger] Failed to write audit event: ${err.message}`);
      return null;
    }
  }

  /**
   * Reads tenant-scoped audit records.
   */
  async getEvents(firmId, { limit = 100, entityType, entityId } = {}) {
    const filter = { firmId: String(firmId) };
    if (entityType) filter.entityType = String(entityType).toUpperCase();
    if (entityId) filter.entityId = String(entityId);

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

    if (this.auditCollection) {
      return await this.auditCollection
        .find(filter)
        .sort({ timestamp: -1 })
        .limit(safeLimit)
        .toArray();
    }

    return memAuditLogs
      .filter((e) => {
        if (e.firmId !== firmId) return false;
        if (entityType && e.entityType !== entityType.toUpperCase()) return false;
        if (entityId && e.entityId !== entityId) return false;
        return true;
      })
      .slice(0, safeLimit);
  }
}

const defaultAuditLogger = new AuditLogger();

module.exports = {
  AuditLogger,
  auditLogger: defaultAuditLogger,
};
