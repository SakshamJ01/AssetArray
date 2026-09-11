/**
 * AssetArray 4.0 — Multi-Tenant Database Layer & Indexing
 * Establishes MongoDB connections and creates multi-tenant compound indexes.
 */

const { MongoClient } = require("mongodb");

class DatabaseManager {
  constructor(uri, dbName) {
    this.uri = uri || "mongodb://127.0.0.1:27017";
    this.dbName = dbName || "asset_array";
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.collections = {};
  }

  async connect() {
    if (this.isConnected && this.db) return this.db;

    this.client = new MongoClient(this.uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    });

    await this.client.connect();
    this.db = this.client.db(this.dbName);
    this.isConnected = true;

    // Register all canonical collections
    this.collections = {
      firms: this.db.collection("firms"),
      users: this.db.collection("users"),
      sessions: this.db.collection("refresh_sessions"),
      clients: this.db.collection("clients"),
      households: this.db.collection("households"),
      portfolios: this.db.collection("portfolios"),
      sync: this.db.collection("encrypted_sync_blobs"),
      broadcasts: this.db.collection("broadcast_campaigns"),
      auditEvents: this.db.collection("audit_events"),
      legacyAudit: this.db.collection("audit_logs"),
      aiResearch: this.db.collection("ai_research_history"),
      advisorTasks: this.db.collection("advisor_tasks"),
      advisorActivity: this.db.collection("advisor_activity"),
      advisorDecisions: this.db.collection("advisor_decisions"),
    };

    await this.ensureIndexes();
    return this.db;
  }

  async ensureIndexes() {
    if (!this.db) return;

    try {
      await Promise.allSettled([
        // Firms
        this.collections.firms.createIndex({ id: 1 }, { unique: true }),
        this.collections.firms.createIndex({ sebiRegistrationNo: 1 }, { sparse: true }),

        // Users: Scoped by firm and unique by username
        this.collections.users.createIndex({ id: 1 }, { unique: true }),
        this.collections.users.createIndex({ username: 1 }, { unique: true }),
        this.collections.users.createIndex({ firmId: 1, id: 1 }),
        this.collections.users.createIndex({ firmId: 1, role: 1 }),

        // Refresh Sessions
        this.collections.sessions.createIndex({ id: 1 }, { unique: true }),
        this.collections.sessions.createIndex({ userId: 1 }),
        this.collections.sessions.createIndex({ expiresAt: 1 }),

        // Clients: Partitioned by firmId
        this.collections.clients.createIndex({ firmId: 1, id: 1 }, { unique: true }),
        this.collections.clients.createIndex({ firmId: 1, householdId: 1 }),
        this.collections.clients.createIndex({ firmId: 1, pan: 1 }, { sparse: true }),

        // Households: Partitioned by firmId
        this.collections.households.createIndex({ firmId: 1, id: 1 }, { unique: true }),
        this.collections.households.createIndex({ firmId: 1, primaryClientId: 1 }),

        // Portfolios: Partitioned by firmId
        this.collections.portfolios.createIndex({ firmId: 1, id: 1 }, { unique: true }),
        this.collections.portfolios.createIndex({ firmId: 1, clientId: 1 }),
        this.collections.portfolios.createIndex({ firmId: 1, householdId: 1 }),

        // Sync: Partitioned by firmId and ownerId
        this.collections.sync.createIndex({ firmId: 1, ownerId: 1 }),
        this.collections.sync.createIndex({ ownerId: 1 }),

        // Audit Events: Partitioned by firmId and indexed by timestamp
        this.collections.auditEvents.createIndex({ firmId: 1, timestamp: -1 }),
        this.collections.auditEvents.createIndex({ firmId: 1, entityType: 1, entityId: 1 }),
        this.collections.auditEvents.createIndex({ firmId: 1, actorId: 1 }),
        this.collections.auditEvents.createIndex({ id: 1 }, { unique: true }),

        // Legacy Collections
        this.collections.broadcasts.createIndex({ campaignId: 1 }, { unique: true }),
        this.collections.aiResearch.createIndex({ userId: 1, timestamp: -1 }),
        this.collections.advisorTasks.createIndex({ firmId: 1, id: 1 }),
        this.collections.advisorActivity.createIndex({ firmId: 1, timestamp: -1 }),
        this.collections.advisorDecisions.createIndex({ firmId: 1, createdAt: -1 }),
      ]);
    } catch (err) {
      console.warn(`[DatabaseManager] Non-fatal index creation note: ${err.message}`);
    }
  }

  getCollection(name) {
    return this.collections[name] || (this.db ? this.db.collection(name) : null);
  }
}

module.exports = { DatabaseManager };
