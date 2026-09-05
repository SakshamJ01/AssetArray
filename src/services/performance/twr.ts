import { TWRResult, ValuationPoint, SubPeriodResult } from "./types";

export const TWR_METHODOLOGY_VERSION = "twr-subperiod-v1.1";

/**
 * Calculates Time-Weighted Return (TWR) using sub-period linking around external cash flows.
 * Eliminates the distorting effect of external deposits and withdrawals.
 *
 * Formula:
 * (1 + R_TWR) = \prod_{i=1}^n (1 + R_i)
 * where R_i = (V_end - CF_i) / V_begin - 1
 */
export function calculateTWR(
  valuations: ValuationPoint[],
  methodologyVersion = TWR_METHODOLOGY_VERSION
): TWRResult {
  const warnings: string[] = [];

  if (!valuations || valuations.length < 2) {
    return {
      twr: 0,
      totalDays: 0,
      subPeriods: [],
      quality: "INSUFFICIENT_DATA",
      dataSource: "HISTORICAL",
      methodologyVersion,
      warnings: ["At least two valuation dates are required to compute Time-Weighted Return."],
    };
  }

  // Sort chronological
  const sorted = [...valuations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const startDate = new Date(sorted[0].date);
  const endDate = new Date(sorted[sorted.length - 1].date);
  const totalDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  let cumulativeCompound = 1.0;
  const subPeriods: SubPeriodResult[] = [];
  let prevNav = sorted[0].nav;

  if (prevNav <= 0) {
    warnings.push("Beginning valuation is non-positive; initial sub-period may be undefined.");
  }

  for (let i = 1; i < sorted.length; i++) {
    const pt = sorted[i];
    const prevPt = sorted[i - 1];
    const cf = pt.cashFlow || 0;

    let subReturn = 0;
    if (prevNav > 0) {
      // Standard GIPS end-of-period cash flow formula:
      // R_i = (V_end - CashFlow) / V_begin - 1
      subReturn = (pt.nav - cf) / prevNav - 1;
    } else if (cf > 0 && pt.nav > 0) {
      // Inflow into empty portfolio
      subReturn = (pt.nav - cf) / cf;
    }

    // Guard against numeric anomalies
    if (isNaN(subReturn) || !isFinite(subReturn)) {
      subReturn = 0;
      warnings.push(`Non-finite sub-period return detected between ${prevPt.date} and ${pt.date}.`);
    }

    cumulativeCompound *= 1 + subReturn;
    subPeriods.push({
      startDate: prevPt.date,
      endDate: pt.date,
      beginningValue: prevNav,
      endingValue: pt.nav,
      netCashFlow: cf,
      subPeriodReturn: parseFloat(subReturn.toFixed(6)),
    });

    prevNav = pt.nav;
  }

  const twr = parseFloat((cumulativeCompound - 1).toFixed(6));
  let annualizedTwr: number | undefined;

  if (totalDays >= 365) {
    const years = totalDays / 365.25;
    annualizedTwr = parseFloat((Math.pow(1 + twr, 1 / years) - 1).toFixed(6));
  }

  const quality =
    sorted.length >= 12 && totalDays >= 30
      ? "HIGH"
      : sorted.length >= 4
      ? "MEDIUM"
      : "LOW";

  return {
    twr,
    annualizedTwr,
    totalDays,
    subPeriods,
    quality,
    dataSource: "HISTORICAL",
    methodologyVersion,
    warnings,
  };
}
