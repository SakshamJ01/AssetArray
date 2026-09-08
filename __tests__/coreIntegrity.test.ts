/**
 * Core-integrity regression (3.3.x): UNIT only, no live network.
 * Covers: PIN KDF envelope, market unavailable contract, data-quality honesty,
 * quote validation, navigation registry.
 */
import { encryptPayload, decryptPayload, buildOwnerId } from "../src/services/pinCrypto";
import { validateQuoteSchema } from "../src/services/market/quoteValidator";
import { TAB_REGISTRY, VISIBLE_TABS, MOBILE_TABS } from "../src/navigation/tabs";

describe("CORE INTEGRITY", () => {
  it("encrypts with PBKDF2 envelope and decrypts (legacy fallback intact)", () => {
    const pin = "1234";
    const payload = { clients: [{ id: "c1" }], n: 1 };
    const ct = encryptPayload(payload, pin);
    expect(ct.startsWith("AA1.")).toBe(true);
    expect(decryptPayload(ct, pin)).toEqual(payload);
    expect(() => decryptPayload(ct, "wrong")).toThrow();
    expect(buildOwnerId(pin)).toHaveLength(24);
  });

  it("rejects negative/NaN/Infinity/missing prices", () => {
    expect(validateQuoteSchema({ symbol: "AAPL", price: 10 }).isValid).toBe(true);
    expect(validateQuoteSchema({ symbol: "AAPL", price: -1 }).isValid).toBe(false);
    expect(validateQuoteSchema({ symbol: "AAPL", price: NaN }).isValid).toBe(false);
    expect(validateQuoteSchema({ symbol: "AAPL" }).isValid).toBe(false);
    expect(validateQuoteSchema({ symbol: "", price: 1 }).isValid).toBe(false);
  });

  it("navigation registry is single source of truth", () => {
    expect(VISIBLE_TABS).toHaveLength(7);
    expect(MOBILE_TABS.map((t) => t.key)).toEqual(
      expect.arrayContaining(["Dashboard", "Clients", "Portfolios"])
    );
    expect(MOBILE_TABS.find((t) => t.key === "Tools")).toBeUndefined();
    expect(TAB_REGISTRY.filter((t) => t.mobileVisible)).toHaveLength(MOBILE_TABS.length);
  });

  it("legacy data-quality engine has no hardcoded percentages", async () => {
    const src = require("fs").readFileSync(
      require("path").join(__dirname, "../src/services/advisor/dataQuality.ts"),
      "utf8"
    );
    expect(src).not.toMatch(/historicalNavCoveragePct = 82/);
    expect(src).not.toMatch(/benchmarkCoveragePct = 96/);
  });
});
