import { ValuationPoint } from "../performance/types";
import { DrawdownAnalysis, DrawdownEpisode } from "./types";

export const DRAWDOWN_METHODOLOGY_VERSION = "drawdown-hwm-v1.1";

/**
 * Calculates institutional drawdown, underwater series, and recovery durations.
 * Tracks High Water Mark (HWM) across historical valuation points.
 */
export function calculateDrawdown(
  valuations: ValuationPoint[],
  methodologyVersion = DRAWDOWN_METHODOLOGY_VERSION
): DrawdownAnalysis {
  const warnings: string[] = [];

  if (!valuations || valuations.length === 0) {
    return {
      currentDrawdownPercent: 0,
      maxDrawdownPercent: 0,
      peakNav: 0,
      troughNav: 0,
      longestRecoveryDays: 0,
      worstPeriod: null,
      episodes: [],
      quality: "INSUFFICIENT_DATA",
      methodologyVersion,
      warnings: ["No historical valuation points provided."],
    };
  }

  // Sort chronologically
  const sorted = [...valuations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let highWaterMark = sorted[0].nav;
  let hwmDate = sorted[0].date;

  let currentPeakNav = sorted[0].nav;
  let currentPeakDate = sorted[0].date;
  let currentTroughNav = sorted[0].nav;
  let currentTroughDate = sorted[0].date;

  let maxDrawdown = 0; // Negative or 0
  let maxDdPeakDate = sorted[0].date;
  let maxDdTroughDate = sorted[0].date;
  let peakNav = sorted[0].nav;
  let troughNav = sorted[0].nav;

  const episodes: DrawdownEpisode[] = [];
  let inDrawdown = false;
  let longestRecoveryDays = 0;

  for (let i = 0; i < sorted.length; i++) {
    const pt = sorted[i];
    const nav = pt.nav;
    const date = pt.date;

    if (nav > highWaterMark) {
      // New all-time high water mark reached
      if (inDrawdown) {
        // Current drawdown episode closed with recovery!
        const troughTime = new Date(currentTroughDate).getTime();
        const recTime = new Date(date).getTime();
        const peakTime = new Date(currentPeakDate).getTime();

        const ddDuration = Math.round((troughTime - peakTime) / (1000 * 60 * 60 * 24));
        const recDuration = Math.round((recTime - troughTime) / (1000 * 60 * 60 * 24));

        if (recDuration > longestRecoveryDays) {
          longestRecoveryDays = recDuration;
        }

        const ddPct = (currentTroughNav - currentPeakNav) / currentPeakNav;

        episodes.push({
          peakDate: currentPeakDate,
          peakNav: currentPeakNav,
          troughDate: currentTroughDate,
          troughNav: currentTroughNav,
          recoveryDate: date,
          drawdownPercent: parseFloat((ddPct * 100).toFixed(2)),
          drawdownDurationDays: Math.max(0, ddDuration),
          recoveryDurationDays: Math.max(0, recDuration),
          isRecovered: true,
        });

        inDrawdown = false;
      }

      highWaterMark = nav;
      hwmDate = date;
      currentPeakNav = nav;
      currentPeakDate = date;
      currentTroughNav = nav;
      currentTroughDate = date;
    } else if (nav < highWaterMark) {
      // In drawdown relative to HWM
      if (!inDrawdown) {
        inDrawdown = true;
        currentPeakNav = highWaterMark;
        currentPeakDate = hwmDate;
        currentTroughNav = nav;
        currentTroughDate = date;
      }

      if (nav < currentTroughNav) {
        currentTroughNav = nav;
        currentTroughDate = date;
      }

      const currentDd = (nav - highWaterMark) / highWaterMark;
      if (currentDd < maxDrawdown) {
        maxDrawdown = currentDd;
        maxDdPeakDate = highWaterMark === currentPeakNav ? currentPeakDate : hwmDate;
        maxDdTroughDate = date;
        peakNav = highWaterMark;
        troughNav = nav;
      }
    }
  }

  // If still in unrecovered drawdown at series end
  if (inDrawdown) {
    const peakTime = new Date(currentPeakDate).getTime();
    const troughTime = new Date(currentTroughDate).getTime();
    const ddDuration = Math.round((troughTime - peakTime) / (1000 * 60 * 60 * 24));
    const ddPct = (currentTroughNav - currentPeakNav) / currentPeakNav;

    episodes.push({
      peakDate: currentPeakDate,
      peakNav: currentPeakNav,
      troughDate: currentTroughDate,
      troughNav: currentTroughNav,
      recoveryDate: null,
      drawdownPercent: parseFloat((ddPct * 100).toFixed(2)),
      drawdownDurationDays: Math.max(0, ddDuration),
      recoveryDurationDays: null,
      isRecovered: false,
    });
  }

  // Current drawdown at last point
  const lastNav = sorted[sorted.length - 1].nav;
  const currentDrawdown =
    highWaterMark > 0 ? (lastNav - highWaterMark) / highWaterMark : 0;

  // Calculate 30-day rolling volatility if sufficient data exists
  let rollingVolatility30d: number | null = null;
  if (sorted.length >= 30) {
    const recent = sorted.slice(-30);
    const returns: number[] = [];
    for (let j = 1; j < recent.length; j++) {
      returns.push((recent[j].nav - recent[j - 1].nav) / recent[j - 1].nav);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    rollingVolatility30d = parseFloat((Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(2));
  }

  const worstPeriod =
    maxDrawdown < 0
      ? {
          startDate: maxDdPeakDate,
          endDate: maxDdTroughDate,
          drawdownPercent: parseFloat((maxDrawdown * 100).toFixed(2)),
        }
      : null;

  const quality =
    sorted.length >= 60 ? "HIGH" : sorted.length >= 10 ? "MEDIUM" : "LOW";

  return {
    currentDrawdownPercent: parseFloat((currentDrawdown * 100).toFixed(2)),
    maxDrawdownPercent: parseFloat((maxDrawdown * 100).toFixed(2)),
    peakNav,
    troughNav,
    longestRecoveryDays,
    worstPeriod,
    episodes,
    rollingVolatility30d,
    quality,
    methodologyVersion,
    warnings,
  };
}
