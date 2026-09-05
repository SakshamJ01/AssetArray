import { DailyReturnPoint } from "../performance/types";
import { BenchmarkAnalyticsOptions, BenchmarkRiskMetrics } from "./types";

export const BENCHMARK_ANALYTICS_VERSION = "benchmark-risk-v1.1";

/**
 * Calculates institutional risk and benchmark comparison analytics from daily return series.
 *
 * Formulas:
 * Beta (\beta) = Cov(Rp, Rb) / Var(Rb)
 * Jensen's Alpha (\alpha) = Rp_ann - [Rf + \beta * (Rb_ann - Rf)]
 * Tracking Error (TE) = StdDev(Rp - Rb) * sqrt(252)
 * Information Ratio (IR) = (Rp_ann - Rb_ann) / TE
 * Sharpe Ratio = (Rp_ann - Rf) / (StdDev(Rp) * sqrt(252))
 * Downside Deviation = sqrt( (1/N) * \sum min(0, r_p - MAR)^2 ) * sqrt(252)
 * Sortino Ratio = (Rp_ann - Rf) / Downside Deviation
 * Up Capture = Product(1 + Rp_up) / Product(1 + Rb_up)
 * Down Capture = Product(1 + Rp_down) / Product(1 + Rb_down)
 */
export function calculateBenchmarkAnalytics(
  portfolioReturns: DailyReturnPoint[],
  benchmarkReturns: DailyReturnPoint[],
  options?: BenchmarkAnalyticsOptions
): BenchmarkRiskMetrics {
  const rf = options?.riskFreeRate ?? 0.065; // 6.5% default Indian risk-free rate
  const factor = options?.annualizationFactor ?? 252; // 252 trading days per year
  const minObs = options?.minimumObservations ?? 10;
  const version = options?.methodologyVersion ?? BENCHMARK_ANALYTICS_VERSION;
  const warnings: string[] = [];

  // Align dates between portfolio and benchmark
  const benchMap = new Map<string, number>();
  benchmarkReturns.forEach((b) => benchMap.set(b.date, b.dailyReturn));

  const paired: { date: string; rp: number; rb: number }[] = [];
  portfolioReturns.forEach((p) => {
    const rb = benchMap.get(p.date);
    if (typeof rb === "number" && !isNaN(rb) && !isNaN(p.dailyReturn)) {
      paired.push({ date: p.date, rp: p.dailyReturn, rb });
    }
  });

  const n = paired.length;

  if (n < minObs) {
    return {
      observationCount: n,
      portfolioAnnualizedReturn: null,
      benchmarkAnnualizedReturn: null,
      activeReturn: null,
      portfolioVolatility: null,
      benchmarkVolatility: null,
      beta: null,
      alpha: null,
      trackingError: null,
      informationRatio: null,
      sharpeRatio: null,
      sortinoRatio: null,
      downsideDeviation: null,
      upCaptureRatio: null,
      downCaptureRatio: null,
      rSquared: null,
      quality: "INSUFFICIENT_DATA",
      dataSource: "HISTORICAL",
      methodologyVersion: version,
      assumptions: {
        riskFreeRate: rf,
        annualizationFactor: factor,
        observationFrequency: "DAILY",
      },
      warnings: [
        `Insufficient paired observations: ${n} found, minimum required is ${minObs}.`,
      ],
    };
  }

  // Calculate arithmetic means
  let sumP = 0;
  let sumB = 0;
  let compoundP = 1;
  let compoundB = 1;

  paired.forEach((pt) => {
    sumP += pt.rp;
    sumB += pt.rb;
    compoundP *= 1 + pt.rp;
    compoundB *= 1 + pt.rb;
  });

  const meanP = sumP / n;
  const meanB = sumB / n;

  // Annualized compound returns
  const years = n / factor;
  const annReturnP = Math.pow(compoundP, 1 / years) - 1;
  const annReturnB = Math.pow(compoundB, 1 / years) - 1;
  const activeReturn = annReturnP - annReturnB;

  // Variances, Covariance, and Downside Deviation
  let varP = 0;
  let varB = 0;
  let covPB = 0;
  let varDiff = 0;
  let sumDownsideSq = 0;
  const dailyMAR = rf / factor;

  // Up/Down capture accumulations
  let upCompP = 1;
  let upCompB = 1;
  let downCompP = 1;
  let downCompB = 1;
  let upCount = 0;
  let downCount = 0;

  paired.forEach((pt) => {
    const devP = pt.rp - meanP;
    const devB = pt.rb - meanB;
    const diff = pt.rp - pt.rb;

    varP += devP * devP;
    varB += devB * devB;
    covPB += devP * devB;
    varDiff += Math.pow(diff - (meanP - meanB), 2);

    const downsideDiff = Math.min(0, pt.rp - dailyMAR);
    sumDownsideSq += downsideDiff * downsideDiff;

    if (pt.rb > 0) {
      upCompP *= 1 + pt.rp;
      upCompB *= 1 + pt.rb;
      upCount++;
    } else if (pt.rb < 0) {
      downCompP *= 1 + pt.rp;
      downCompB *= 1 + pt.rb;
      downCount++;
    }
  });

  const sampleVarP = varP / (n - 1);
  const sampleVarB = varB / (n - 1);
  const sampleCov = covPB / (n - 1);
  const sampleVarDiff = varDiff / (n - 1);

  // Annualized volatilities
  const volP = Math.sqrt(sampleVarP) * Math.sqrt(factor);
  const volB = Math.sqrt(sampleVarB) * Math.sqrt(factor);

  // Beta & Alpha
  let beta: number | null = null;
  let alpha: number | null = null;
  if (volB > 1e-4 && sampleVarB > 1e-8 && isFinite(sampleCov)) {
    beta = parseFloat((sampleCov / sampleVarB).toFixed(3));
    // Jensen's Alpha: Rp - [Rf + Beta * (Rb - Rf)]
    const rawAlpha = annReturnP - (rf + beta * (annReturnB - rf));
    alpha = isFinite(rawAlpha) ? parseFloat(rawAlpha.toFixed(4)) : null;
  } else {
    warnings.push("Benchmark variance is zero; Beta and Jensen's Alpha are mathematically undefined.");
  }

  // Tracking Error & Information Ratio
  const trackingErrorVal = Math.sqrt(sampleVarDiff) * Math.sqrt(factor);
  const trackingError = isFinite(trackingErrorVal) ? parseFloat(trackingErrorVal.toFixed(4)) : null;
  let informationRatio: number | null = null;
  if (trackingErrorVal > 1e-8 && isFinite(activeReturn)) {
    informationRatio = parseFloat((activeReturn / trackingErrorVal).toFixed(3));
  } else {
    warnings.push("Tracking error is zero or undefined; Information Ratio cannot be computed.");
  }

  // Sharpe Ratio: (Rp - Rf) / VolP
  let sharpeRatio: number | null = null;
  if (volP > 1e-8 && isFinite(annReturnP)) {
    sharpeRatio = parseFloat(((annReturnP - rf) / volP).toFixed(3));
  } else {
    warnings.push("Portfolio volatility is zero; Sharpe Ratio is mathematically undefined.");
  }

  // Downside Deviation & Sortino Ratio
  const downsideDevVal = Math.sqrt(sumDownsideSq / n) * Math.sqrt(factor);
  const downsideDeviation = isFinite(downsideDevVal) ? parseFloat(downsideDevVal.toFixed(4)) : null;
  let sortinoRatio: number | null = null;
  if (downsideDevVal > 1e-8 && isFinite(annReturnP)) {
    sortinoRatio = parseFloat(((annReturnP - rf) / downsideDevVal).toFixed(3));
  } else {
    warnings.push("Downside deviation is zero; Sortino Ratio is mathematically undefined.");
  }

  // R-squared
  let rSquared: number | null = null;
  if (volP > 0 && volB > 0 && isFinite(sampleCov)) {
    const correlation = sampleCov / (Math.sqrt(sampleVarP) * Math.sqrt(sampleVarB));
    if (isFinite(correlation)) {
      rSquared = parseFloat(Math.min(1.0, Math.max(0.0, correlation * correlation)).toFixed(3));
    }
  }

  // Up/Down Capture
  let upCaptureRatio: number | null = null;
  if (upCount > 0 && Math.abs(upCompB - 1) > 1e-6) {
    const rawUp = ((upCompP - 1) / (upCompB - 1)) * 100;
    if (isFinite(rawUp)) {
      upCaptureRatio = parseFloat(rawUp.toFixed(2));
    }
  }

  let downCaptureRatio: number | null = null;
  if (downCount > 0 && Math.abs(downCompB - 1) > 1e-6) {
    const rawDown = ((downCompP - 1) / (downCompB - 1)) * 100;
    if (isFinite(rawDown)) {
      downCaptureRatio = parseFloat(rawDown.toFixed(2));
    }
  }

  const quality = n >= 60 && warnings.length === 0 ? "HIGH" : n >= 20 ? "MEDIUM" : "LOW";

  return {
    observationCount: n,
    portfolioAnnualizedReturn: isFinite(annReturnP) ? parseFloat(annReturnP.toFixed(4)) : null,
    benchmarkAnnualizedReturn: isFinite(annReturnB) ? parseFloat(annReturnB.toFixed(4)) : null,
    activeReturn: isFinite(activeReturn) ? parseFloat(activeReturn.toFixed(4)) : null,
    portfolioVolatility: isFinite(volP) ? parseFloat(volP.toFixed(4)) : null,
    benchmarkVolatility: isFinite(volB) ? parseFloat(volB.toFixed(4)) : null,
    beta,
    alpha,
    trackingError,
    informationRatio,
    sharpeRatio,
    sortinoRatio,
    downsideDeviation,
    upCaptureRatio,
    downCaptureRatio,
    rSquared,
    quality,
    dataSource: "HISTORICAL",
    methodologyVersion: version,
    assumptions: {
      riskFreeRate: rf,
      annualizationFactor: factor,
      observationFrequency: "DAILY",
    },
    warnings,
  };
}
