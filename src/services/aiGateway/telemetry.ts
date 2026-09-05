/**
 * Institutional AI Gateway Telemetry
 * Zero-PII metric capture for request durations, model utilization, fallbacks, and cost tracking.
 */

import { AiTelemetryRecord } from "./types";

class AiTelemetryLogger {
  private records: AiTelemetryRecord[] = [];
  private readonly MAX_RECORDS = 250;

  public log(record: AiTelemetryRecord): void {
    // Sanitize any accidental fields to strictly enforce zero PII
    const sanitized: AiTelemetryRecord = {
      requestId: record.requestId,
      provider: record.provider,
      model: record.model,
      taskType: record.taskType,
      durationMs: Math.max(0, record.durationMs),
      status: record.status,
      fallbackUsed: Boolean(record.fallbackUsed),
      estimatedCost: Number(record.estimatedCost.toFixed(6)),
      timestamp: record.timestamp || new Date().toISOString(),
    };

    this.records.unshift(sanitized);
    if (this.records.length > this.MAX_RECORDS) {
      this.records.length = this.MAX_RECORDS;
    }
  }

  public getRecentRecords(limit = 50): AiTelemetryRecord[] {
    return this.records.slice(0, limit);
  }

  public getSummary(): {
    totalRequests: number;
    successRatePct: number;
    averageDurationMs: number;
    totalEstimatedCost: number;
    providerBreakdown: Record<string, number>;
  } {
    const total = this.records.length;
    if (total === 0) {
      return {
        totalRequests: 0,
        successRatePct: 100,
        averageDurationMs: 0,
        totalEstimatedCost: 0,
        providerBreakdown: {},
      };
    }

    const successCount = this.records.filter((r) => r.status === "SUCCESS").length;
    const totalDuration = this.records.reduce((sum, r) => sum + r.durationMs, 0);
    const totalCost = this.records.reduce((sum, r) => sum + r.estimatedCost, 0);

    const providerBreakdown: Record<string, number> = {};
    for (const r of this.records) {
      providerBreakdown[r.provider] = (providerBreakdown[r.provider] || 0) + 1;
    }

    return {
      totalRequests: total,
      successRatePct: Number(((successCount / total) * 100).toFixed(1)),
      averageDurationMs: Math.round(totalDuration / total),
      totalEstimatedCost: Number(totalCost.toFixed(4)),
      providerBreakdown,
    };
  }

  public getEntries(): AiTelemetryRecord[] {
    return this.records;
  }

  public clear(): void {
    this.records = [];
  }
}

export const aiTelemetry = new AiTelemetryLogger();
export const aiTelemetryLogger = aiTelemetry;
export { AiTelemetryLogger };
