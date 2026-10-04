/**
 * AssetArray 4.0 — Almgren-Chriss (2000) Market Impact & Slippage Model
 * Evaluates liquidity extraction costs, permanent market drift, and transaction cost analysis (TCA).
 */

import { MarketImpactEstimate } from "./types";

export interface MarketImpactParams {
  quantity: number;
  price: number;
  dailyVolume?: number;
  volatilityDailyPct?: number; // Daily volatility (default: ~1.5%)
  spreadBps?: number; // Bid-Ask spread in basis points (default: ~5 bps)
  slicesCount?: number;
  timeHorizonMinutes?: number;
}

export class MarketImpactModel {
  /**
   * Evaluates expected market impact, temporary liquidity penalty, and TCA savings.
   */
  public static calculateEstimate(params: MarketImpactParams): MarketImpactEstimate {
    const {
      quantity,
      price,
      dailyVolume = 1500000,
      volatilityDailyPct = 0.015, // 1.5% daily volatility
      spreadBps = 6.0, // 6 bps typical spread
      slicesCount = 8,
      timeHorizonMinutes = 60,
    } = params;

    const totalValue = quantity * price;
    const safeVolume = Math.max(dailyVolume, quantity * 2);

    // Participation rate as fraction of daily volume
    const participationRate = quantity / safeVolume;
    const participationRatePct = parseFloat((participationRate * 100).toFixed(3));

    // Gamma (permanent impact coefficient) ~ 0.314
    // Eta (temporary impact coefficient) ~ 0.142
    const gamma = 0.314;
    const eta = 0.142;

    // Almgren-Chriss Permanent Impact: Gamma * Volatility * (Q / V)
    // Converts to basis points (1 bp = 0.0001 = 0.01%)
    const rawPermanentImpact = gamma * volatilityDailyPct * participationRate;
    const permanentImpactBps = parseFloat((rawPermanentImpact * 10000).toFixed(2));

    // Rate of trading per slice
    const sliceRate = (quantity / Math.max(1, slicesCount)) / (safeVolume * (timeHorizonMinutes / 375)); // 375 trading mins in session
    const rawTemporaryImpact = (spreadBps / 20000) + (eta * volatilityDailyPct * Math.pow(Math.max(0.0001, sliceRate), 0.6));
    const temporaryImpactBps = parseFloat((rawTemporaryImpact * 10000).toFixed(2));

    // Total expected slippage for the algo order (bps)
    const totalSlippageBps = parseFloat((permanentImpactBps + temporaryImpactBps).toFixed(2));

    // Total estimated impact cost in currency
    const totalEstimatedImpactCost = parseFloat(((totalSlippageBps / 10000) * totalValue).toFixed(2));

    // Naive market sweep cost (if executed all at once without slicing)
    // Sizing exponent is higher for full block sweep
    const naiveSweepBps = parseFloat(
      (
        spreadBps +
        (gamma * volatilityDailyPct * participationRate * 10000 * 1.8) +
        (eta * volatilityDailyPct * Math.pow(participationRate * 10, 0.7) * 10000)
      ).toFixed(2)
    );
    const naiveMarketSweepCost = parseFloat(((naiveSweepBps / 10000) * totalValue).toFixed(2));

    // Algorithmic savings (TCA alpha)
    const algoSavingsBps = Math.max(0, parseFloat((naiveSweepBps - totalSlippageBps).toFixed(2)));
    const algoSavingsCost = Math.max(0, parseFloat((naiveMarketSweepCost - totalEstimatedImpactCost).toFixed(2)));

    return {
      parentQuantity: quantity,
      benchmarkPrice: price,
      dailyAverageVolume: safeVolume,
      estimatedSpreadBps: spreadBps,
      participationRatePct,
      permanentImpactBps,
      temporaryImpactBps,
      totalSlippageBps,
      totalEstimatedImpactCost,
      naiveMarketSweepCost,
      algoSavingsBps,
      algoSavingsCost,
    };
  }
}
