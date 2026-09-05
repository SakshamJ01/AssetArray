import { ValuationPoint, DailyReturnPoint } from "./types";

/**
 * Computes a normalized daily return series from historical NAV points and cash flows.
 * R_t = (NAV_t - CashFlow_t) / NAV_{t-1} - 1
 */
export function generateDailyReturnSeries(
  valuations: ValuationPoint[]
): DailyReturnPoint[] {
  if (!valuations || valuations.length < 2) return [];

  const sorted = [...valuations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const series: DailyReturnPoint[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    const prev = sorted[i - 1];
    const cf = curr.cashFlow || 0;

    let dailyReturn = 0;
    if (prev.nav > 0) {
      dailyReturn = (curr.nav - cf) / prev.nav - 1;
    }

    if (!isNaN(dailyReturn) && isFinite(dailyReturn)) {
      series.push({
        date: curr.date,
        nav: curr.nav,
        dailyReturn: parseFloat(dailyReturn.toFixed(6)),
        netCashFlow: cf,
      });
    }
  }

  return series;
}
