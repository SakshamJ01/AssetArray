/**
 * AssetArray 4.0 — Institutional Algorithmic Execution Engine Types
 * Implements TWAP, VWAP, Iceberg, and Percentage of Volume (POV) algorithmic slicing
 * with Almgren-Chriss market impact estimation and FIX 4.4 protocol telemetry.
 */

export type AlgoStrategyType = "TWAP" | "VWAP" | "ICEBERG" | "POV" | "SNIPER";

export type AlgoUrgency = "LOW" | "MEDIUM" | "HIGH";

export type AlgoOrderStatus =
  | "PLANNING"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

export type SliceStatus =
  | "PENDING"
  | "SUBMITTED"
  | "TRANSMITTED"
  | "FILLED"
  | "PARTIAL"
  | "CANCELLED"
  | "REJECTED";

export interface AlgoExecutionParams {
  strategy: AlgoStrategyType;
  timeHorizonMinutes: number; // Duration of execution window
  slicesCount: number; // Number of child slices
  maxParticipationRatePct: number; // E.g., 10% of market volume
  limitBufferPct: number; // E.g., 0.2% price limit buffer
  jitterPct: number; // E.g., 0.10 for +/- 10% randomization to prevent HFT detection
  disclosedRatio?: number; // E.g., 0.15 (15% display qty) for Iceberg
  urgency?: AlgoUrgency;
}

export interface MarketImpactEstimate {
  parentQuantity: number;
  benchmarkPrice: number;
  dailyAverageVolume: number;
  estimatedSpreadBps: number;
  participationRatePct: number;
  permanentImpactBps: number; // Almgren-Chriss permanent price change
  temporaryImpactBps: number; // Almgren-Chriss liquidity extraction penalty
  totalSlippageBps: number; // Total expected slippage vs arrival price
  totalEstimatedImpactCost: number; // In currency units (e.g., INR / USD)
  naiveMarketSweepCost: number; // Cost if executed all at once via market order
  algoSavingsBps: number; // Basis points saved by using algorithmic slicing
  algoSavingsCost: number; // Net currency saved
}

export interface AlgoChildSlice {
  sliceId: string;
  parentOrderId: string;
  sliceIndex: number;
  totalSlices: number;
  scheduledTimeOffsetMs: number; // Offset from start time in ms
  scheduledTimestamp: number;
  quantity: number;
  disclosedQuantity: number;
  targetPrice: number;
  limitPrice: number;
  status: SliceStatus;
  filledQuantity: number;
  avgFillPrice?: number;
  executedValue?: number;
  executionTimestamp?: number;
  slippageBps?: number;
  fixClOrdId: string;
  fixMessage: string;
  receiptHash?: string;
  brokerOrderId?: string;
}

export interface AlgoParentOrder {
  parentOrderId: string;
  clientRefToken: string; // Zero-PII client identifier (e.g. CLIENT-881)
  symbol: string;
  tradingSymbol: string;
  exchange: "NSE" | "BSE" | "NASDAQ" | "NYSE" | "NFO" | "MCX";
  transactionType: "BUY" | "SELL";
  totalQuantity: number;
  benchmarkPrice: number; // Arrival / Reference price
  totalEstimatedValue: number;
  params: AlgoExecutionParams;
  marketImpact: MarketImpactEstimate;
  status: AlgoOrderStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  slices: AlgoChildSlice[];
  totalFilledQuantity: number;
  totalExecutedValue: number;
  vwapAchieved?: number;
  overallSlippageBps?: number;
  executionReceiptHash?: string; // Cryptographic SHA-256 audit proof
}

export interface AlgoSimulationUpdate {
  parentOrderId: string;
  slice: AlgoChildSlice;
  completedSlicesCount: number;
  totalSlicesCount: number;
  progressPct: number;
  currentVwap: number;
  currentSlippageBps: number;
  isComplete: boolean;
}
