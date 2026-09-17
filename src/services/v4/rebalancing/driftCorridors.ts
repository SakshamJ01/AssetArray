/**
 * AssetArray 4.0 — Drift Corridor Engine
 * Configurable target allocation corridors with percentage and absolute drift metrics.
 */

import { DriftCorridorConfig } from "../../../types/v4/computation";

export interface DriftEvaluationResult {
  assetClass: string;
  currentWeightPct: number;
  targetWeightPct: number;
  lowerBoundPct: number;
  upperBoundPct: number;
  absoluteDriftPct: number;
  isBreached: boolean;
  breachDirection: "OVERWEIGHT" | "UNDERWEIGHT" | "WITHIN_BANDS";
}

export function evaluateDriftCorridors(
  currentWeightsPct: Record<string, number>,
  configs: DriftCorridorConfig[]
): DriftEvaluationResult[] {
  return configs.map((cfg) => {
    const assetClass = cfg.assetClass;
    const currentWeightPct = currentWeightsPct[assetClass] || 0;
    const targetWeightPct = cfg.targetWeightPct;
    const lowerBoundPct = Math.max(0, targetWeightPct - cfg.lowerBandPct);
    const upperBoundPct = Math.min(100, targetWeightPct + cfg.upperBandPct);
    const absoluteDriftPct = currentWeightPct - targetWeightPct;

    let isBreached = false;
    let breachDirection: DriftEvaluationResult["breachDirection"] = "WITHIN_BANDS";

    if (currentWeightPct > upperBoundPct) {
      isBreached = true;
      breachDirection = "OVERWEIGHT";
    } else if (currentWeightPct < lowerBoundPct) {
      isBreached = true;
      breachDirection = "UNDERWEIGHT";
    }

    return {
      assetClass,
      currentWeightPct: parseFloat(currentWeightPct.toFixed(2)),
      targetWeightPct: parseFloat(targetWeightPct.toFixed(2)),
      lowerBoundPct: parseFloat(lowerBoundPct.toFixed(2)),
      upperBoundPct: parseFloat(upperBoundPct.toFixed(2)),
      absoluteDriftPct: parseFloat(absoluteDriftPct.toFixed(2)),
      isBreached,
      breachDirection,
    };
  });
}
