/**
 * AssetArray 4.0 — Institutional Broker Connect & Execution Gateway Types
 * Conforms to SEBI RIA execution advisory guidelines and FIX 4.4 protocol specifications.
 */

export type BrokerProviderId = "zerodha_kite" | "upstox" | "icici_breeze" | "fix_standard";

export type OrderTransactionType = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT" | "SL" | "SL-M";
export type OrderProduct = "CNC" | "MIS" | "NRML";
export type OrderStatus =
  | "DRAFT"
  | "VALIDATED"
  | "SUBMITTED"
  | "TRANSMITTED"
  | "EXECUTED"
  | "REJECTED"
  | "CANCELLED";

export interface TradeOrder {
  orderId: string;
  clientRefToken: string; // Zero-PII client identifier (e.g., CLIENT-881)
  symbol: string;
  tradingSymbol: string;
  exchange: "NSE" | "BSE" | "NFO" | "MCX" | "NASDAQ" | "NYSE";
  transactionType: OrderTransactionType;
  orderType: OrderType;
  product: OrderProduct;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  disclosedQuantity?: number;
  estimatedValue: number;
  status: OrderStatus;
  statusMessage?: string;
  brokerOrderId?: string;
  executionTimestamp?: number;
  executionReceiptHash?: string; // SHA-256 cryptographic proof of execution
}

export interface BrokerConnectionConfig {
  brokerId: BrokerProviderId;
  brokerName: string;
  apiKey: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  environment: "sandbox" | "live";
  status: "CONNECTED" | "DISCONNECTED" | "EXPIRED" | "AUTHENTICATING";
  lastConnectedAt?: number;
  tokenExpiresAt?: number;
}

export interface BatchExecutionRequest {
  batchId: string;
  brokerId: BrokerProviderId;
  orders: TradeOrder[];
  advisorNote?: string;
  requireClientConsentOtp?: boolean;
}

export interface BatchExecutionResult {
  batchId: string;
  brokerId: BrokerProviderId;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  totalOrders: number;
  executedCount: number;
  failedCount: number;
  totalExecutedValue: number;
  executedAt: number;
  batchReceiptHash: string;
  orders: TradeOrder[];
  auditLog: {
    timestamp: number;
    event: string;
    details: Record<string, any>;
  }[];
}
