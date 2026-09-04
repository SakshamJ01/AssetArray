export interface TargetModel {
  id: string;
  name: string;
  description: string;
  allocations: Record<string, number>; // assetClass -> percentage (0 - 100)
}

export const TARGET_MODELS: TargetModel[] = [
  {
    id: "aggressive_growth",
    name: "Aggressive Growth",
    description: "Maximum equity compounding for high-risk tolerance and multi-decade horizon.",
    allocations: {
      Equity: 70,
      Debt: 15,
      Alternative: 15,
    },
  },
  {
    id: "balanced_wealth",
    name: "Balanced Fiduciary",
    description: "Optimal risk-adjusted Sharpe ratio across core equities and fixed income.",
    allocations: {
      Equity: 50,
      Debt: 30,
      Alternative: 20,
    },
  },
  {
    id: "capital_preservation",
    name: "Capital Preservation",
    description: "Defensive capital protection focusing on treasury yield and minimal drawdown.",
    allocations: {
      Equity: 20,
      Debt: 60,
      Alternative: 20,
    },
  },
  {
    id: "all_weather",
    name: "All-Weather Endowment",
    description: "Ray Dalio-inspired macro diversification across all economic seasons.",
    allocations: {
      Equity: 30,
      Debt: 40,
      Alternative: 30,
    },
  },
];

export interface RebalanceItem {
  assetClass: string;
  currentValue: number;
  currentWeight: number; // percentage
  targetWeight: number; // percentage
  drift: number; // current - target
  action: "BUY" | "SELL" | "BALANCED";
  amount: number; // absolute dollar amount to trade
}

export interface TaxLossHarvestCandidate {
  holdingId: string;
  assetName: string;
  assetClass: string;
  investedValue: number;
  currentValue: number;
  unrealizedLoss: number;
  estimatedTaxSavings: number; // 20% capital gains shield
}

export interface RebalanceResult {
  totalPortfolioValue: number;
  items: RebalanceItem[];
  maxDrift: number;
  isRebalanceRecommended: boolean;
  taxLossCandidates: TaxLossHarvestCandidate[];
  totalHarvestableLoss: number;
  potentialTaxShield: number;
}

export interface SimpleHolding {
  id: string;
  assetName: string;
  assetClass: string;
  currentValue: number;
  investedValue: number;
  quantity?: number;
  ticker?: string;
  symbol?: string;
}

export function calculateRebalance(
  holdings: SimpleHolding[],
  model: TargetModel = TARGET_MODELS[1],
  driftThresholdPct: number = 2.0
): RebalanceResult {
  const totalVal = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  if (totalVal <= 0) {
    return {
      totalPortfolioValue: 0,
      items: [],
      maxDrift: 0,
      isRebalanceRecommended: false,
      taxLossCandidates: [],
      totalHarvestableLoss: 0,
      potentialTaxShield: 0,
    };
  }

  // Aggregate current valuation by asset class (normalize string to title case)
  const currentByClass: Record<string, number> = {};
  holdings.forEach((h) => {
    const rawClass = (h.assetClass || "Alternative").trim();
    const normalizedClass =
      rawClass.toLowerCase().includes("stock") || rawClass.toLowerCase().includes("equity")
        ? "Equity"
        : rawClass.toLowerCase().includes("bond") || rawClass.toLowerCase().includes("debt")
        ? "Debt"
        : "Alternative";

    currentByClass[normalizedClass] =
      (currentByClass[normalizedClass] || 0) + (Number(h.currentValue) || 0);
  });

  const allCategories = Array.from(
    new Set([...Object.keys(model.allocations), ...Object.keys(currentByClass)])
  );

  let maxDrift = 0;
  const items: RebalanceItem[] = allCategories.map((cat) => {
    const currentVal = currentByClass[cat] || 0;
    const currentWeight = (currentVal / totalVal) * 100;
    const targetWeight = model.allocations[cat] || 0;
    const drift = currentWeight - targetWeight;
    const absDrift = Math.abs(drift);

    if (absDrift > maxDrift) {
      maxDrift = absDrift;
    }

    const targetVal = (targetWeight / 100) * totalVal;
    const deltaAmount = Math.abs(currentVal - targetVal);

    let action: "BUY" | "SELL" | "BALANCED" = "BALANCED";
    if (absDrift >= driftThresholdPct) {
      action = drift > 0 ? "SELL" : "BUY";
    }

    return {
      assetClass: cat,
      currentValue: currentVal,
      currentWeight: parseFloat(currentWeight.toFixed(1)),
      targetWeight: parseFloat(targetWeight.toFixed(1)),
      drift: parseFloat(drift.toFixed(1)),
      action,
      amount: parseFloat(deltaAmount.toFixed(2)),
    };
  });

  // Identify Tax-Loss Harvesting Candidates
  const taxLossCandidates: TaxLossHarvestCandidate[] = [];
  let totalHarvestableLoss = 0;

  holdings.forEach((h) => {
    const cur = Number(h.currentValue) || 0;
    const inv = Number(h.investedValue) || 0;
    if (inv > cur) {
      const loss = inv - cur;
      totalHarvestableLoss += loss;
      taxLossCandidates.push({
        holdingId: h.id,
        assetName: h.assetName,
        assetClass: h.assetClass,
        investedValue: inv,
        currentValue: cur,
        unrealizedLoss: parseFloat(loss.toFixed(2)),
        estimatedTaxSavings: parseFloat((loss * 0.2).toFixed(2)),
      });
    }
  });

  taxLossCandidates.sort((a, b) => b.unrealizedLoss - a.unrealizedLoss);

  return {
    totalPortfolioValue: parseFloat(totalVal.toFixed(2)),
    items,
    maxDrift: parseFloat(maxDrift.toFixed(1)),
    isRebalanceRecommended: maxDrift >= driftThresholdPct,
    taxLossCandidates,
    totalHarvestableLoss: parseFloat(totalHarvestableLoss.toFixed(2)),
    potentialTaxShield: parseFloat((totalHarvestableLoss * 0.2).toFixed(2)),
  };
}
