/**
 * AssetArray 4.0 — Idempotent Migration Verification Suite
 *
 * Verifies:
 * 1. Legacy users without firmId are migrated to DEFAULT_FIRM_ID.
 * 2. Legacy lowercase roles are normalized to uppercase.
 * 3. Default firm record is provisioned if absent.
 * 4. Migration is idempotent (subsequent runs produce 0 updates, zero data corruption).
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MigrationService, DEFAULT_FIRM_ID, DEFAULT_FIRM_NAME } = require("../backend/db/migration");

// Mock in-memory database representation
class MockCollection {
  data: any[];

  constructor(initialData: any[] = []) {
    this.data = initialData.map((d) => ({ ...d }));
  }

  find(query: any = {}) {
    const results = this.data.filter((doc: any) => {
      if (query.$or) {
        return query.$or.some((clause: any) => {
          for (const key of Object.keys(clause)) {
            if (clause[key]?.$exists === false) {
              if (doc[key] !== undefined && doc[key] !== null) return false;
            } else if (doc[key] !== clause[key]) {
              return false;
            }
          }
          return true;
        });
      }
      for (const key of Object.keys(query)) {
        if (doc[key] !== query[key]) return false;
      }
      return true;
    });

    return {
      toArray: async () => results.map((d) => ({ ...d })),
    };
  }

  async findOne(query: any = {}) {
    const cursor = this.find(query);
    const results = await cursor.toArray();
    return results[0] || null;
  }

  async insertOne(doc: any) {
    this.data.push({ ...doc, _id: doc._id || `id_${this.data.length + 1}` });
    return { insertedId: doc.id };
  }

  async updateOne(filter: any, update: any) {
    const target = this.data.find((doc: any) => {
      if (filter._id && doc._id === filter._id) return true;
      if (filter.id && doc.id === filter.id) return true;
      return false;
    });

    if (target && update.$set) {
      Object.assign(target, update.$set);
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  }
}

class MockDb {
  collections: Record<string, MockCollection>;

  constructor() {
    this.collections = {
      firms: new MockCollection([]),
      users: new MockCollection([
        { _id: "u1", id: "usr-1", username: "legacy_advisor", role: "advisor" }, // missing firmId
        { _id: "u2", id: "usr-2", username: "legacy_admin", role: "admin" }, // missing firmId
        { _id: "u3", id: "usr-3", username: "v4_user", role: "ADVISOR", firmId: "custom_firm" }, // already migrated
      ]),
      encrypted_sync_blobs: new MockCollection([
        { _id: "s1", ownerId: "usr-1", ciphertext: "encrypted-data" }, // missing firmId
      ]),
      advisor_tasks: new MockCollection([
        { _id: "t1", id: "task-1", title: "Review Mandate", userId: "usr-1" }, // missing firmId
      ]),
      advisor_activity: new MockCollection([
        { _id: "a1", id: "act-1", title: "Logged in", userId: "usr-1" },
      ]),
      advisor_decisions: new MockCollection([
        { _id: "d1", id: "dec-1", issue: "Rebalance", userId: "usr-1" },
      ]),
    };
  }

  collection(name: string) {
    return this.collections[name] || new MockCollection([]);
  }
}

describe("V4 IDEMPOTENT DATA MIGRATION SUITE", () => {
  test("PASS 1: Legacy data is migrated deterministically into default firm", async () => {
    const mockDb = new MockDb();

    const report = await MigrationService.runMigration(mockDb);

    expect(report.defaultFirmCreated).toBe(true);
    expect(report.usersMigrated).toBe(2);
    expect(report.syncRecordsMigrated).toBe(1);
    expect(report.tasksMigrated).toBe(1);
    expect(report.activitiesMigrated).toBe(1);
    expect(report.decisionsMigrated).toBe(1);
    expect(report.errors).toEqual([]);

    // Verify Default Firm exists
    const defaultFirm = await mockDb.collection("firms").findOne({ id: DEFAULT_FIRM_ID });
    expect(defaultFirm).not.toBeNull();
    expect(defaultFirm.name).toBe(DEFAULT_FIRM_NAME);

    // Verify User 1 was updated
    const user1 = await mockDb.collection("users").findOne({ id: "usr-1" });
    expect(user1.firmId).toBe(DEFAULT_FIRM_ID);
    expect(user1.role).toBe("ADVISOR");

    // Verify User 2 was updated
    const user2 = await mockDb.collection("users").findOne({ id: "usr-2" });
    expect(user2.firmId).toBe(DEFAULT_FIRM_ID);
    expect(user2.role).toBe("ADMIN");

    // Verify User 3 was unchanged (preserved existing firm)
    const user3 = await mockDb.collection("users").findOne({ id: "usr-3" });
    expect(user3.firmId).toBe("custom_firm");
    expect(user3.role).toBe("ADVISOR");
  });

  test("PASS 2: Idempotency guarantee — subsequent migration run makes 0 changes", async () => {
    const mockDb = new MockDb();

    // First run
    await MigrationService.runMigration(mockDb);

    // Second run on the same database
    const secondReport = await MigrationService.runMigration(mockDb);

    expect(secondReport.defaultFirmCreated).toBe(false);
    expect(secondReport.usersMigrated).toBe(0);
    expect(secondReport.syncRecordsMigrated).toBe(0);
    expect(secondReport.tasksMigrated).toBe(0);
    expect(secondReport.activitiesMigrated).toBe(0);
    expect(secondReport.decisionsMigrated).toBe(0);
    expect(secondReport.errors).toEqual([]);
  });
});
