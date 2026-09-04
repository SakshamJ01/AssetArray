import {
  convertCurrency,
  formatWealthAmount,
  CURRENCY_REGISTRY,
} from "../src/services/currency";

describe("Global Multi-Currency & FX Engine", () => {
  it("converts USD to INR accurately using base FX rates", () => {
    const inrAmount = convertCurrency(1000, "USD", "INR");
    // 1000 * 83.9 = 83,900
    expect(inrAmount).toBeCloseTo(83900, 0);
  });

  it("converts INR to EUR cross-currency correctly", () => {
    // 83,900 INR should convert back to ~920 EUR
    const eurAmount = convertCurrency(83900, "INR", "EUR");
    expect(eurAmount).toBeCloseTo(920, 0);
  });

  it("formats Indian Rupee amounts in Lakhs and Crores when compact is enabled", () => {
    // 25,000,000 INR = 2.50 Cr
    const formattedCr = formatWealthAmount(25000000, "INR", true);
    expect(formattedCr).toBe("₹2.50 Cr");

    // 500,000 INR = 5.00 L
    const formattedL = formatWealthAmount(500000, "INR", true);
    expect(formattedL).toBe("₹5.00 L");
  });

  it("formats Western currencies (USD, EUR, GBP) in Millions when compact is enabled", () => {
    const formattedUSD = formatWealthAmount(12500000, "USD", true);
    expect(formattedUSD).toBe("$12.50M");

    const formattedEUR = formatWealthAmount(4500000, "EUR", true);
    expect(formattedEUR).toBe("€4.50M");
  });

  it("formats standard comma notation for INR correctly (1,00,000)", () => {
    const formatted = formatWealthAmount(1500000, "INR", false);
    expect(formatted).toBe("₹15,00,000.00");
  });

  it("formats standard comma notation for USD correctly (1,500,000)", () => {
    const formatted = formatWealthAmount(1500000, "USD", false);
    expect(formatted).toBe("$1,500,000.00");
  });
});
