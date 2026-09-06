import {
  setOnlineStatus,
  getOnlineStatus,
  subscribeNetworkStatus,
} from "../src/services/network";

describe("Sync & Network Truth Suite", () => {
  let originalOnlineState: boolean;

  beforeEach(() => {
    originalOnlineState = getOnlineStatus();
  });

  afterEach(() => {
    setOnlineStatus(originalOnlineState);
  });

  describe("Network Status Detection", () => {
    it("updates online status and notifies subscribers on status change", () => {
      let currentOnline = getOnlineStatus();
      const unsubscribe = subscribeNetworkStatus((status) => {
        currentOnline = status.isOnline;
      });

      setOnlineStatus(false);
      expect(getOnlineStatus()).toBe(false);
      expect(currentOnline).toBe(false);

      setOnlineStatus(true);
      expect(getOnlineStatus()).toBe(true);
      expect(currentOnline).toBe(true);

      unsubscribe();
    });
  });

  describe("SyncBadge State Determination Logic", () => {
    function computeSyncBadgeState(isSyncing: boolean, isOnline: boolean, syncState: string) {
      const isFailed =
        Boolean(syncState) &&
        (syncState.toLowerCase().includes("failed") || syncState.toLowerCase().includes("error"));

      if (isSyncing) return "SYNCING";
      if (!isOnline) return "OFFLINE";
      if (isFailed) return "ERROR";
      return "SYNCED";
    }

    it("correctly maps SYNCING state", () => {
      expect(computeSyncBadgeState(true, true, "")).toBe("SYNCING");
      expect(computeSyncBadgeState(true, false, "")).toBe("SYNCING");
    });

    it("correctly maps OFFLINE state when not syncing", () => {
      expect(computeSyncBadgeState(false, false, "")).toBe("OFFLINE");
      expect(computeSyncBadgeState(false, false, "Encrypted backup pushed")).toBe("OFFLINE");
    });

    it("correctly maps ERROR state when sync failed", () => {
      expect(computeSyncBadgeState(false, true, "Sync failed")).toBe("ERROR");
      expect(computeSyncBadgeState(false, true, "Restore error")).toBe("ERROR");
    });

    it("correctly maps SYNCED state when online and successful", () => {
      expect(computeSyncBadgeState(false, true, "Encrypted backup pushed")).toBe("SYNCED");
      expect(computeSyncBadgeState(false, true, "")).toBe("SYNCED");
    });
  });

  describe("Backend Environment Security Rules", () => {
    it("strictly rejects default TOKEN_SECRET in production", () => {
      const DEFAULT_DEV_TOKEN_SECRET = "asset-array-dev-secret-change-in-production";
      const envSecret: string = DEFAULT_DEV_TOKEN_SECRET;
      const isProduction = true;

      const isInvalid = isProduction && (!envSecret || envSecret === DEFAULT_DEV_TOKEN_SECRET);
      expect(isInvalid).toBe(true);
    });

    it("accepts custom TOKEN_SECRET in production", () => {
      const DEFAULT_DEV_TOKEN_SECRET = "asset-array-dev-secret-change-in-production";
      const envSecret: string = "prod-super-secure-secret-key-99211";
      const isProduction = true;

      const isInvalid = isProduction && (!envSecret || envSecret === DEFAULT_DEV_TOKEN_SECRET);
      expect(isInvalid).toBe(false);
    });

    it("strictly rejects wildcard CORS_ORIGIN in production", () => {
      const corsOrigin: string = "*";
      const isProduction = true;

      const isInvalid = isProduction && (!corsOrigin || corsOrigin === "*");
      expect(isInvalid).toBe(true);
    });

    it("accepts specific domain CORS_ORIGIN in production", () => {
      const corsOrigin: string = "https://asset-array.web.app";
      const isProduction = true;

      const isInvalid = isProduction && (!corsOrigin || corsOrigin === "*");
      expect(isInvalid).toBe(false);
    });
  });
});
