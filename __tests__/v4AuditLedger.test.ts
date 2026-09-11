/**
 * AssetArray 4.0 — Immutable Audit Ledger Tests
 *
 * Verifies:
 * 1. Event creation with actor, tenant, timestamps, and before/after states.
 * 2. Cryptographic SHA-256 hash calculation and chaining.
 * 3. Tamper detection if record payload is modified.
 * 4. Tenant isolation of audit logs.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AuditModel } = require("../backend/audit/auditModel");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AuditLogger } = require("../backend/audit/auditLogger");

describe("V4 IMMUTABLE AUDIT LEDGER & EVENT MODEL", () => {
  test("AuditModel creates structured event with SHA-256 hash", () => {
    const event = AuditModel.createEvent({
      firmId: "firm-101",
      actorId: "usr-42",
      actorUsername: "vikram.advisor",
      actorRole: "ADVISOR",
      action: "CLIENT_CREATED",
      entityType: "CLIENT",
      entityId: "client-88",
      afterSnapshot: { name: "Aditi Rao", pan: "ABCDE5678G" },
      reason: "Onboarding new NRI mandate",
    });

    expect(event.id).toBeDefined();
    expect(event.firmId).toBe("firm-101");
    expect(event.actorId).toBe("usr-42");
    expect(event.action).toBe("CLIENT_CREATED");
    expect(event.entityType).toBe("CLIENT");
    expect(event.sha256Hash).toBeDefined();
    expect(event.sha256Hash.length).toBe(64); // SHA-256 hex length
    expect(event.prevHash).toBeNull(); // First record in chain
  });

  test("Hash chaining: second event chains previous event's sha256Hash", () => {
    const event1 = AuditModel.createEvent({
      firmId: "firm-101",
      actorId: "usr-42",
      action: "CLIENT_CREATED",
      entityType: "CLIENT",
      entityId: "c1",
      prevHash: null,
    });

    const event2 = AuditModel.createEvent({
      firmId: "firm-101",
      actorId: "usr-42",
      action: "HOLDINGS_MUTATED",
      entityType: "PORTFOLIO",
      entityId: "p1",
      prevHash: event1.sha256Hash,
    });

    expect(event2.prevHash).toBe(event1.sha256Hash);
    expect(event2.sha256Hash).not.toBe(event1.sha256Hash);
  });

  test("Tamper detection: modifying snapshot or actor alters calculated hash", () => {
    const originalParams = {
      prevHash: "GENESIS",
      timestamp: "2026-09-11T12:00:00.000Z",
      firmId: "firm-101",
      actorId: "usr-42",
      action: "PORTFOLIO_CREATED",
      entityType: "PORTFOLIO",
      entityId: "port-99",
      beforeSnapshot: null,
      afterSnapshot: { totalValue: 1000000 },
    };

    const legitimateHash = AuditModel.computeHash(originalParams);

    // Attacker tampers with the value
    const tamperedParams = {
      ...originalParams,
      afterSnapshot: { totalValue: 5000000 }, // Fabricated 5x AUM
    };
    const tamperedHash = AuditModel.computeHash(tamperedParams);

    expect(tamperedHash).not.toBe(legitimateHash);
  });

  test("AuditLogger in-memory store isolates logs by firmId", async () => {
    const logger = new AuditLogger(null);

    await logger.log({
      firmId: "firm-alpha",
      actorId: "u1",
      action: "TASK_CREATED",
      entityType: "TASK",
    });

    await logger.log({
      firmId: "firm-beta",
      actorId: "u2",
      action: "TASK_CREATED",
      entityType: "TASK",
    });

    const alphaEvents = await logger.getEvents("firm-alpha");
    const betaEvents = await logger.getEvents("firm-beta");

    expect(alphaEvents.length).toBe(1);
    expect(alphaEvents[0].firmId).toBe("firm-alpha");

    expect(betaEvents.length).toBe(1);
    expect(betaEvents[0].firmId).toBe("firm-beta");
  });
});
