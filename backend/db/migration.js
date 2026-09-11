/**
 * AssetArray 4.0 — Idempotent V3.3 -> V4 Data Migration Service
 * Deterministically transitions standalone 3.3.x records into the default
 * firm tenant without data loss, downtime, or duplicate generation.
 */

const { FirmModel } = require("../firms/firmModel");
const { normalizeRole } = require("../auth/rbac");

const DEFAULT_FIRM_ID = "firm_default_practice";
const DEFAULT_FIRM_NAME = "Primary Advisory Practice";

class MigrationService {
  /**
   * Executes idempotent migration on the target database collections.
   */
  static async runMigration(db) {
    const report = {
      timestamp: new Date().toISOString(),
      defaultFirmCreated: false,
      usersMigrated: 0,
      syncRecordsMigrated: 0,
      tasksMigrated: 0,
      activitiesMigrated: 0,
      decisionsMigrated: 0,
      errors: [],
    };

    if (!db) {
      report.errors.push("Database instance not provided.");
      return report;
    }

    try {
      const firmsCol = db.collection("firms");
      const usersCol = db.collection("users");
      const syncCol = db.collection("encrypted_sync_blobs");
      const tasksCol = db.collection("advisor_tasks");
      const activityCol = db.collection("advisor_activity");
      const decisionsCol = db.collection("advisor_decisions");

      // 1. Ensure Default Firm Tenant Exists
      const existingFirm = await firmsCol.findOne({ id: DEFAULT_FIRM_ID });
      if (!existingFirm) {
        const defaultFirm = FirmModel.sanitize({
          id: DEFAULT_FIRM_ID,
          name: DEFAULT_FIRM_NAME,
          sebiRegistrationNo: "INA000000000",
          riaLicense: "SEBI-RIA-INSTITUTIONAL",
          status: "ACTIVE",
          tier: "INSTITUTIONAL_CORE",
        });
        await firmsCol.insertOne(defaultFirm);
        report.defaultFirmCreated = true;
      }

      // 2. Migrate Legacy Users without firmId or with lowercase roles
      const usersToMigrate = await usersCol.find({
        $or: [
          { firmId: { $exists: false } },
          { firmId: null },
          { role: "advisor" },
          { role: "admin" },
        ],
      }).toArray();

      for (const user of usersToMigrate) {
        const updatedFirmId = user.firmId || DEFAULT_FIRM_ID;
        const normalizedRole = normalizeRole(user.role);
        await usersCol.updateOne(
          { _id: user._id },
          {
            $set: {
              firmId: updatedFirmId,
              role: normalizedRole,
              status: user.status || (user.active !== false ? "ACTIVE" : "SUSPENDED"),
              updatedAt: new Date().toISOString(),
            },
          }
        );
        report.usersMigrated++;
      }

      // 3. Migrate Sync Records
      const syncToMigrate = await syncCol.find({
        $or: [{ firmId: { $exists: false } }, { firmId: null }],
      }).toArray();

      for (const sync of syncToMigrate) {
        await syncCol.updateOne(
          { _id: sync._id },
          {
            $set: {
              firmId: DEFAULT_FIRM_ID,
              updatedAt: sync.updatedAt || new Date().toISOString(),
            },
          }
        );
        report.syncRecordsMigrated++;
      }

      // 4. Migrate Advisor Tasks
      if (tasksCol) {
        const tasksToMigrate = await tasksCol.find({
          $or: [{ firmId: { $exists: false } }, { firmId: null }],
        }).toArray();
        for (const task of tasksToMigrate) {
          await tasksCol.updateOne(
            { _id: task._id },
            { $set: { firmId: DEFAULT_FIRM_ID } }
          );
          report.tasksMigrated++;
        }
      }

      // 5. Migrate Advisor Activities
      if (activityCol) {
        const actToMigrate = await activityCol.find({
          $or: [{ firmId: { $exists: false } }, { firmId: null }],
        }).toArray();
        for (const act of actToMigrate) {
          await activityCol.updateOne(
            { _id: act._id },
            { $set: { firmId: DEFAULT_FIRM_ID } }
          );
          report.activitiesMigrated++;
        }
      }

      // 6. Migrate Advisor Decisions
      if (decisionsCol) {
        const decToMigrate = await decisionsCol.find({
          $or: [{ firmId: { $exists: false } }, { firmId: null }],
        }).toArray();
        for (const dec of decToMigrate) {
          await decisionsCol.updateOne(
            { _id: dec._id },
            { $set: { firmId: DEFAULT_FIRM_ID } }
          );
          report.decisionsMigrated++;
        }
      }

      return report;
    } catch (err) {
      report.errors.push(err.message);
      return report;
    }
  }
}

module.exports = {
  MigrationService,
  DEFAULT_FIRM_ID,
  DEFAULT_FIRM_NAME,
};
