import { DataProvenance, PerformanceQuality } from "../../types/wealth";

export interface BenchmarkAnalyticsOptions {
  riskFreeRate?: number; // Annualized e.g. 0.065 for 6.5% (RBI Repo / 91-day T-Bill)
  annualizationFactor?: number; // 252 for daily, 52 for weekly, 12 for monthly
  minimumObservations?: number; // Minimum periods required (default: 10)
  methodologyVersion?: string;
}

export interface BenchmarkRiskMetrics {
  observationCount: number;
  portfolioAnnualizedReturn: number | null;
  benchmarkAnnualizedReturn: number | null;
  activeReturn: number | null; // Rp - Rb
  portfolioVolatility: number | null; // Annualized standard deviation
  benchmarkVolatility: number | null;
  beta: number | null;
  alpha: number | null; // Annualized Jensen's Alpha
  trackingError: number | null; // Annualized standard deviation of (Rp - Rb)
  informationRatio: number | null; // Active Return / Tracking Error
  sharpeRatio: number | null; // (Rp - Rf) / Volatility
  sortinoRatio: number | null; // (Rp - Rf) / Downside Deviation
  downsideDeviation: number | null;
  upCaptureRatio: number | null; // Up capture %
  downCaptureRatio: number | null; // Down capture %
  rSquared: number | null;
  quality: PerformanceQuality;
  dataSource: DataProvenance;
  methodologyVersion: string;
  assumptions: {
    riskFreeRate: number;
    annualizationFactor: number;
    observationFrequency: "DAILY" | "WEEKLY" | "MONTHLY";
  };
  warnings: string[];
}

export interface DrawdownEpisode {
  peakDate: string;
  peakNav: number;
  troughDate: string;
  troughNav: number;
  recoveryDate: string | null;
  drawdownPercent: number; // e.g. -18.5%
  drawdownDurationDays: number; // Days from peak to trough
  recoveryDurationDays: number | null; // Days from trough to full recovery
  isRecovered: boolean;
}

export interface DrawdownAnalysis {
  currentDrawdownPercent: number; // e.g. -3.2%
  maxDrawdownPercent: number; // e.g. -24.8%
  peakNav: number;
  troughNav: number;
  longestRecoveryDays: number;
  worstPeriod: {
    startDate: string;
    endDate: string;
    drawdownPercent: number;
  } | null;
  episodes: DrawdownEpisode[];
  rollingVolatility30d?: number | null;
  quality: PerformanceQuality;
  methodologyVersion: string;
  warnings: string[];
}
