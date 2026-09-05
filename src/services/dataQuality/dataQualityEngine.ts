/**
 * Institutional Data Quality Engine
 * Calculates real platform-wide data hygiene and completeness across 6 core dimensions.
 * Zero hardcoded or static KPIs (eliminates all "98%" fake metrics).
 */

import { Client, Goal } from "../../types/wealth";
import { snapshotStore } from "../clientInsights/snapshotStore";

export type QualityTier = "COMPLETE" | "PARTIAL" | "STALE" | "MISSING";

export interface QualityDimension {
  name: string;
  weight: number;
  percentage: number;
  tier: QualityTier;
  detail: string;
}

export interface DataQualityIssue {
  clientId?: string;
  clientName?: string;
  holdingId?: string;
  holdingName?: string;
  dimension: string;
  issue: string;
  recommendation: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
}

export interface DataQualitySummary {
  overallScore: number;
  overallTier: QualityTier;
  dimensions: {
    transactions: QualityDimension;
    taxLots: QualityDimension;
    prices: QualityDimension;
    historicalData: QualityDimension;
    clientMetadata: QualityDimension;
    goals: QualityDimension;
  };
  missingIssuesCount: number;
  issues: DataQualityIssue[];
  asOf: string;
}

export class DataQualityEngine {
  private resolveTier(pct: number): QualityTier {
    if (pct >= 90) return "COMPLETE";
    if (pct >= 60) return "PARTIAL";
    if (pct > 0) return "STALE";
    return "MISSING";
  }

  /**
   * Evaluates genuine data completeness across all clients, holdings, tax lots, market prices,
   * point-in-time snapshots, and financial goals.
   */
  public async evaluateDataQuality(
    clients: Client[],
    goals: Goal[] = []
  ): Promise<DataQualitySummary> {
    const issues: DataQualityIssue[] = [];

    if (!clients || clients.length === 0) {
      return {
        overallScore: 0,
        overallTier: "MISSING",
        dimensions: {
          transactions: { name: "Transactions & Holdings", weight: 0.25, percentage: 0, tier: "MISSING", detail: "0/0 holdings verified" },
          taxLots: { name: "Tax Lots & Dates", weight: 0.20, percentage: 0, tier: "MISSING", detail: "0/0 tax lots classified" },
          prices: { name: "Market Prices", weight: 0.20, percentage: 0, tier: "MISSING", detail: "0/0 live prices active" },
          historicalData: { name: "Historical Snapshots", weight: 0.15, percentage: 0, tier: "MISSING", detail: "0/0 client baselines" },
          clientMetadata: { name: "Client Metadata", weight: 0.10, percentage: 0, tier: "MISSING", detail: "0/0 profiles complete" },
          goals: { name: "Financial Goals", weight: 0.10, percentage: 0, tier: "MISSING", detail: "0/0 goals tracked" },
        },
        missingIssuesCount: 0,
        issues: [],
        asOf: new Date().toISOString(),
      };
    }

    let totalHoldingsCount = 0;
    let validTransactionsCount = 0;
    let validTaxLotsCount = 0;
    let validPricesCount = 0;

    // 1. Client Metadata & Holdings Inspection
    let validMetadataCount = 0;
    for (const client of clients) {
      const hasName = Boolean(client.name && client.name.trim().length > 0);
      const hasCategory = Boolean(client.category && client.category.length > 0);
      const hasRisk = Boolean(client.riskProfile && client.riskProfile.length > 0);
      const hasContact = Boolean(client.email || client.phone);

      if (hasName && hasCategory && hasRisk && hasContact) {
        validMetadataCount++;
      } else {
        issues.push({
          clientId: client.id,
          clientName: client.name || "Unnamed Client",
          dimension: "Client Metadata",
          issue: `Incomplete profile: Missing ${[!hasCategory && "Category", !hasRisk && "Risk Profile", !hasContact && "Contact Info"].filter(Boolean).join(", ")}.`,
          recommendation: "Complete institutional relationship profile in Client Details.",
          severity: "WARNING",
        });
      }

      const holdings = client.portfolio || [];
      for (const h of holdings) {
        totalHoldingsCount++;

        // Transaction check (quantity > 0 and investedValue > 0)
        const qty = parseFloat(h.quantity) || 0;
        const invested = parseFloat(h.investedValue) || 0;
        const current = parseFloat(h.currentValue) || 0;
        const hasIdentity = Boolean(h.ticker || h.assetName);

        if (qty > 0 && invested > 0 && hasIdentity) {
          validTransactionsCount++;
        } else {
          issues.push({
            clientId: client.id,
            clientName: client.name,
            holdingId: h.id,
            holdingName: h.assetName || h.ticker || "Unknown Holding",
            dimension: "Transactions & Holdings",
            issue: "Missing cost basis or non-positive quantity.",
            recommendation: "Record trade confirmation or purchase cost basis.",
            severity: "CRITICAL",
          });
        }

        // Tax lot check (valid acquisition date)
        const acqDate = h.acquisitionDate || (h as any).acquiredAt;
        if (acqDate && acqDate.length >= 10) {
          validTaxLotsCount++;
        } else {
          issues.push({
            clientId: client.id,
            clientName: client.name,
            holdingId: h.id,
            holdingName: h.assetName || h.ticker || "Unknown Holding",
            dimension: "Tax Lots",
            issue: "Missing acquisition purchase date for capital gains aging.",
            recommendation: "Input trade date to enable STCG vs LTCG tax optimization.",
            severity: "WARNING",
          });
        }

        // Market Price check (current value > 0 and not NaN)
        if (current > 0 && !isNaN(current)) {
          validPricesCount++;
        } else {
          issues.push({
            clientId: client.id,
            clientName: client.name,
            holdingId: h.id,
            holdingName: h.assetName || h.ticker || "Unknown Holding",
            dimension: "Market Prices",
            issue: "Missing or zero live market valuation.",
            recommendation: "Refresh market feed or verify ticker symbol.",
            severity: "CRITICAL",
          });
        }
      }
    }

    // 2. Historical Snapshots Check
    let clientsWithHistory = 0;
    for (const client of clients) {
      const snaps = await snapshotStore.getSnapshots(client.id);
      if (snaps.length >= 2) {
        clientsWithHistory++;
      }
    }

    // 3. Goals Check
    let clientsWithGoals = 0;
    for (const client of clients) {
      const clientGoals = goals.filter((g) => g.clientId === client.id);
      if (clientGoals.length > 0 && clientGoals.some((g) => parseFloat(g.targetAmount) > 0)) {
        clientsWithGoals++;
      }
    }

    // Dimension Percentages
    const holdingsDenom = Math.max(1, totalHoldingsCount);
    const clientsDenom = Math.max(1, clients.length);

    const transactionsPct = totalHoldingsCount === 0 ? 0 : Math.round((validTransactionsCount / holdingsDenom) * 100);
    const taxLotsPct = totalHoldingsCount === 0 ? 0 : Math.round((validTaxLotsCount / holdingsDenom) * 100);
    const pricesPct = totalHoldingsCount === 0 ? 0 : Math.round((validPricesCount / holdingsDenom) * 100);
    const historicalDataPct = Math.round((clientsWithHistory / clientsDenom) * 100);
    const clientMetadataPct = Math.round((validMetadataCount / clientsDenom) * 100);
    const goalsPct = Math.round((clientsWithGoals / clientsDenom) * 100);

    // Weighted Overall Score
    // Transactions: 25%, Tax Lots: 20%, Prices: 20%, Historical Data: 15%, Client Metadata: 10%, Goals: 10%
    const overallScore = Math.round(
      transactionsPct * 0.25 +
      taxLotsPct * 0.20 +
      pricesPct * 0.20 +
      historicalDataPct * 0.15 +
      clientMetadataPct * 0.10 +
      goalsPct * 0.10
    );

    return {
      overallScore,
      overallTier: this.resolveTier(overallScore),
      dimensions: {
        transactions: {
          name: "Transactions & Holdings",
          weight: 0.25,
          percentage: transactionsPct,
          tier: this.resolveTier(transactionsPct),
          detail: `${validTransactionsCount}/${totalHoldingsCount} holdings cost-verified`,
        },
        taxLots: {
          name: "Tax Lots & Aging",
          weight: 0.20,
          percentage: taxLotsPct,
          tier: this.resolveTier(taxLotsPct),
          detail: `${validTaxLotsCount}/${totalHoldingsCount} lots dated`,
        },
        prices: {
          name: "Market Prices",
          weight: 0.20,
          percentage: pricesPct,
          tier: this.resolveTier(pricesPct),
          detail: `${validPricesCount}/${totalHoldingsCount} valuations live`,
        },
        historicalData: {
          name: "Historical Snapshots",
          weight: 0.15,
          percentage: historicalDataPct,
          tier: this.resolveTier(historicalDataPct),
          detail: `${clientsWithHistory}/${clients.length} clients with multi-period history`,
        },
        clientMetadata: {
          name: "Client Metadata",
          weight: 0.10,
          percentage: clientMetadataPct,
          tier: this.resolveTier(clientMetadataPct),
          detail: `${validMetadataCount}/${clients.length} complete profiles`,
        },
        goals: {
          name: "Financial Goals",
          weight: 0.10,
          percentage: goalsPct,
          tier: this.resolveTier(goalsPct),
          detail: `${clientsWithGoals}/${clients.length} clients with funded targets`,
        },
      },
      missingIssuesCount: issues.length,
      issues,
      asOf: new Date().toISOString(),
    };
  }
}

export const dataQualityEngine = new DataQualityEngine();
