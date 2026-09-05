/**
 * Institutional AI Provider Gateway — Type Definitions
 * Task-based routing, multi-model execution, streaming contracts, and telemetry.
 */

export type AiTaskType =
  | "ADVISOR_BRIEF"
  | "FAST_SUMMARY"
  | "DEEP_RESEARCH"
  | "DOCUMENT_EXTRACTION"
  | "PORTFOLIO_EXPLANATION"
  | "TAX_EXPLANATION";

export type AiStreamState =
  | "IDLE"
  | "CONNECTING"
  | "STREAMING"
  | "COMPLETED"
  | "FAILED"
  | "RETRYING"
  | "UNAVAILABLE";

export type ProviderStatus = "ONLINE" | "NOT_CONFIGURED" | "RATE_LIMITED" | "ERROR";

export interface AiProviderConfig {
  apiKey?: string | null;
  baseUrl?: string;
  defaultModel: string;
  timeoutMs?: number;
}

export interface StreamContextPayload {
  clientName?: string;
  totalAum?: number;
  riskProfile?: string;
  healthScore?: number;
  criticalAlertsCount?: number;
  taxLossAvailable?: number;
  topHoldings?: string[];
  macroContext?: string | string[];
  evidence?: Record<string, any>;
}

export interface AiStreamCallbacks {
  onStateChange?: (state: AiStreamState, message?: string) => void;
  onToken: (token: string) => void;
  onComplete?: (meta: {
    provider: string;
    model: string;
    durationMs: number;
    groundedAt: string;
    taskType: AiTaskType;
  }) => void;
  onError?: (error: Error) => void;
}

export interface AiProvider {
  readonly id: string;
  readonly name: string;
  getStatus(): ProviderStatus;
  isConfigured(): boolean;
  streamResponse(
    query: string,
    taskType: AiTaskType,
    context: StreamContextPayload | undefined,
    callbacks: AiStreamCallbacks,
    options?: { timeoutMs?: number; signal?: AbortSignal }
  ): Promise<void>;
}

export interface AiTelemetryRecord {
  requestId: string;
  provider: string;
  model: string;
  taskType: AiTaskType;
  durationMs: number;
  status: "SUCCESS" | "FAILED" | "FALLBACK";
  fallbackUsed: boolean;
  estimatedCost: number;
  timestamp: string;
  // Zero PII policy: no client names, account numbers, or raw text stored in telemetry
}
