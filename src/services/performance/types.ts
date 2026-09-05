import { PerformanceQuality, DataProvenance } from "../../types/wealth";

export interface CashFlow {
  date: string; // ISO 8601 date (YYYY-MM-DD)
  amount: number; // Positive = deposit / inflow, Negative = withdrawal / outflow
  type?: "DEPOSIT" | "WITHDRAWAL" | "DIVIDEND" | "FEE" | "INTEREST";
}

export interface ValuationPoint {
  date: string; // ISO 8601 date (YYYY-MM-DD)
  nav: number; // Portfolio Net Asset Value at end of day
  cashFlow?: number; // Net external cash flow occurring on this date
}

export interface SubPeriodResult {
  startDate: string;
  endDate: string;
  beginningValue: number;
  endingValue: number;
  netCashFlow: number;
  subPeriodReturn: number;
}

export interface TWRResult {
  twr: number; // Decimal e.g. 0.125 for 12.5%
  annualizedTwr?: number;
  totalDays: number;
  subPeriods: SubPeriodResult[];
  quality: PerformanceQuality;
  dataSource: DataProvenance;
  methodologyVersion: string;
  warnings: string[];
}

export interface MWRResult {
  xirr: number | null; // Decimal annualized rate of return, or null if non-convergent
  annualizedPercent: number | null; // e.g. 14.2%
  totalInflows: number;
  totalOutflows: number;
  netInvested: number;
  endingValue: number;
  iterations: number;
  converged: boolean;
  quality: PerformanceQuality;
  methodologyVersion: string;
  warnings: string[];
}

export interface DailyReturnPoint {
  date: string;
  nav: number;
  dailyReturn: number; // Decimal e.g. 0.0042
  netCashFlow: number;
}
