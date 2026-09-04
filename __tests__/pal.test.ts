jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import { storageService } from "../src/platform/storage";
import { billingService, WEB_MOCK_PACKAGES } from "../src/platform/billing/billing.web";
import { hapticsAdapter } from "../src/platform/haptics/haptics.web";
import { localAuth } from "../src/platform/auth/auth.web";

describe("Platform Abstraction Layer (PAL) - Enterprise Test Suite", () => {
  describe("Storage Service (Web & Universal)", () => {
    it("should set, get, and delete standard storage keys", async () => {
      await storageService.setItem("test_advisor_key", "advisor_val");
      const value = await storageService.getItem("test_advisor_key");
      expect(value).toBe("advisor_val");

      await storageService.removeItem("test_advisor_key");
      const deletedValue = await storageService.getItem("test_advisor_key");
      expect(deletedValue).toBeNull();
    });

    it("should set, get, and delete secure storage keys", async () => {
      await storageService.setSecureItem("fiduciary_pin", "9876");
      const pin = await storageService.getSecureItem("fiduciary_pin");
      expect(pin).toBe("9876");

      await storageService.removeSecureItem("fiduciary_pin");
      const deletedPin = await storageService.getSecureItem("fiduciary_pin");
      expect(deletedPin).toBeNull();
    });
  });

  describe("Billing Service (Web Sandbox & Entitlements)", () => {
    beforeEach(async () => {
      await billingService.resetDemoProStatus();
    });

    it("should return mock packages with USD pricing", async () => {
      const offerings = await billingService.getOfferings();
      expect(offerings.length).toBeGreaterThanOrEqual(2);
      expect(offerings[0].product.currencyCode).toBe("USD");
      expect(offerings[0].product.price).toBeGreaterThan(0);
    });

    it("should transition pro status upon purchasePackage", async () => {
      const initialPro = await billingService.checkProStatus();
      expect(initialPro).toBe(false);

      const success = await billingService.purchasePackage(WEB_MOCK_PACKAGES[0]);
      expect(success).toBe(true);

      const afterPurchasePro = await billingService.checkProStatus();
      expect(afterPurchasePro).toBe(true);
    });

    it("should restore purchases accurately", async () => {
      await billingService.purchasePackage(WEB_MOCK_PACKAGES[1]);
      const restored = await billingService.restorePurchases();
      expect(restored).toBe(true);
    });
  });

  describe("Haptics Service (Universal Feedback)", () => {
    it("should execute all tactile feedback methods without throwing", async () => {
      await expect(hapticsAdapter.selection()).resolves.toBeUndefined();
      await expect(hapticsAdapter.lightImpact()).resolves.toBeUndefined();
      await expect(hapticsAdapter.mediumImpact()).resolves.toBeUndefined();
      await expect(hapticsAdapter.successNotification()).resolves.toBeUndefined();
      await expect(hapticsAdapter.warningNotification()).resolves.toBeUndefined();
      await expect(hapticsAdapter.errorNotification()).resolves.toBeUndefined();
    });
  });

  describe("Auth Guard (Universal Biometrics)", () => {
    it("should report availability and authenticate gracefully", async () => {
      const hasHardware = await localAuth.hasHardwareAsync();
      expect(typeof hasHardware).toBe("boolean");

      const authResult = await localAuth.authenticateAsync();
      expect(authResult.success).toBe(true);
    });
  });
});
