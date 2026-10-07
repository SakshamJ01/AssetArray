import {
  PhysicalGoldHolding,
  RealEstateProperty,
  PrivateDebtNote,
  ShadowWealthSummary,
} from "../../types/intelligence";

export class ShadowWealthService {
  /**
   * Calculates current market value of physical gold holdings based on spot bullion rates.
   */
  static calculateGoldValuation(
    holdings: PhysicalGoldHolding[],
    spotRate24kPerGram: number = 7200 // INR / gram benchmark
  ): {
    totalValue: number;
    totalGrams: number;
    totalUnrealizedGain: number;
  } {
    let totalValue = 0;
    let totalGrams = 0;
    let totalCost = 0;

    for (const h of holdings) {
      const purityFactor = h.purity === "24K" ? 1.0 : h.purity === "22K" ? 22 / 24 : 18 / 24;
      const effectiveSpotRate = spotRate24kPerGram * purityFactor;
      const val = h.netWeightGrams * effectiveSpotRate;
      const cost = h.netWeightGrams * h.purchaseCostPerGram;

      totalValue += val;
      totalGrams += h.netWeightGrams;
      totalCost += cost;
    }

    return {
      totalValue: Math.round(totalValue),
      totalGrams: Math.round(totalGrams * 100) / 100,
      totalUnrealizedGain: Math.round(totalValue - totalCost),
    };
  }

  /**
   * Calculates private debt note accrued interest.
   */
  static calculatePrivateDebtAccrual(note: PrivateDebtNote, asOfDate: Date = new Date()): number {
    const issue = new Date(note.issueDate).getTime();
    const current = asOfDate.getTime();
    const elapsedDays = Math.max(0, (current - issue) / (1000 * 60 * 60 * 24));
    const elapsedYears = elapsedDays / 365.25;

    if (note.interestType === "Simple") {
      return Math.round(note.principalAmount * (note.annualInterestRate / 100) * elapsedYears);
    } else if (note.interestType === "Compounded Annually") {
      const totalAmount =
        note.principalAmount * Math.pow(1 + note.annualInterestRate / 100, elapsedYears);
      return Math.round(totalAmount - note.principalAmount);
    } else {
      // Quarterly compound
      const n = 4;
      const totalAmount =
        note.principalAmount *
        Math.pow(1 + note.annualInterestRate / 100 / n, n * elapsedYears);
      return Math.round(totalAmount - note.principalAmount);
    }
  }

  /**
   * Generates a comprehensive summary of all shadow physical and unlisted wealth.
   */
  static computeShadowSummary(params: {
    goldHoldings: PhysicalGoldHolding[];
    properties: RealEstateProperty[];
    privateNotes: PrivateDebtNote[];
    spotRate24kPerGram?: number;
  }): ShadowWealthSummary {
    const goldVal = this.calculateGoldValuation(
      params.goldHoldings,
      params.spotRate24kPerGram || 7200
    ).totalValue;

    const totalRealEstateValue = params.properties.reduce(
      (sum, p) => sum + (p.estimatedMarketValue || 0),
      0
    );

    const totalPrivateDebtValue = params.privateNotes.reduce((sum, n) => {
      const accrued = this.calculatePrivateDebtAccrual(n);
      return sum + n.principalAmount + accrued;
    }, 0);

    const totalShadowNetWorth = goldVal + totalRealEstateValue + totalPrivateDebtValue;

    return {
      totalPhysicalGoldValue: goldVal,
      totalRealEstateValue,
      totalPrivateDebtValue,
      totalShadowNetWorth,
      goldHoldingsCount: params.goldHoldings.length,
      propertiesCount: params.properties.length,
      privateNotesCount: params.privateNotes.length,
    };
  }
}
