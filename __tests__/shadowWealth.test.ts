import { ShadowWealthService } from "../src/services/intelligence/shadowWealthService";
import {
  PhysicalGoldHolding,
  RealEstateProperty,
  PrivateDebtNote,
} from "../src/types/intelligence";

describe("Shadow Wealth & Physical Asset Desk Service", () => {
  const mockGold: PhysicalGoldHolding[] = [
    {
      id: "g1",
      itemType: "Bar",
      purity: "24K",
      grossWeightGrams: 50,
      netWeightGrams: 50,
      purchaseDate: "2024-01-10",
      purchaseCostPerGram: 6200,
      currentSpotRatePerGram: 7200,
      lockerLocation: "HDFC Bank Safe Deposit Locker #402, Mumbai",
    },
  ];

  const mockProperties: RealEstateProperty[] = [
    {
      id: "p1",
      propertyType: "Commercial",
      address: "Bandra Kurla Complex",
      city: "Mumbai",
      carpetAreaSqFt: 1200,
      circleRatePerSqFt: 35000,
      estimatedMarketValue: 42000000,
      annualRentalYield: 6.5,
      propertyTaxDueDate: "2026-12-31",
    },
  ];

  const mockDebtNotes: PrivateDebtNote[] = [
    {
      id: "d1",
      borrowerName: "Apex Logistics Ltd.",
      borrowerContact: "+919800011223",
      principalAmount: 1000000,
      annualInterestRate: 12,
      interestType: "Simple",
      issueDate: "2025-01-01",
      maturityDate: "2027-01-01",
      accruedInterest: 0,
      totalReceivable: 0,
    },
  ];

  test("calculates gold valuation accurately based on 24K spot benchmark", () => {
    const goldVal = ShadowWealthService.calculateGoldValuation(mockGold, 7200);
    expect(goldVal.totalGrams).toBe(50);
    expect(goldVal.totalValue).toBe(360000); // 50g * 7200
    expect(goldVal.totalUnrealizedGain).toBe(50000); // (7200 - 6200) * 50
  });

  test("computes accrued simple interest on private debt notes", () => {
    // 1 year after issue date
    const asOf = new Date("2026-01-01");
    const interest = ShadowWealthService.calculatePrivateDebtAccrual(mockDebtNotes[0], asOf);
    expect(interest).toBeGreaterThanOrEqual(119000);
    expect(interest).toBeLessThanOrEqual(121000);
  });

  test("computes consolidated shadow net worth summary", () => {
    const summary = ShadowWealthService.computeShadowSummary({
      goldHoldings: mockGold,
      properties: mockProperties,
      privateNotes: mockDebtNotes,
      spotRate24kPerGram: 7200,
    });

    expect(summary.goldHoldingsCount).toBe(1);
    expect(summary.propertiesCount).toBe(1);
    expect(summary.privateNotesCount).toBe(1);
    expect(summary.totalPhysicalGoldValue).toBe(360000);
    expect(summary.totalRealEstateValue).toBe(42000000);
    expect(summary.totalShadowNetWorth).toBeGreaterThan(43000000);
  });
});
