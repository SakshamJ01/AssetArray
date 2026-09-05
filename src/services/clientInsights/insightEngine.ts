/**
 * Institutional Client Insight Engine
 * Real change detection driven strictly by historical snapshots.
 * Zero ungrounded observations or fake metrics.
 */

import { Client, Goal } from "../../types/wealth";
import { snapshotStore } from "./snapshotStore";
import { ClientInsight, HistoricalSnapshot, InsightConfidence } from "./types";

export class InsightEngine {
  /**
   * Computes evidence confidence derived from data completeness, history coverage, freshness, and calculation validity.
   * High: fresh snapshot (<=7d), good lookback coverage (70-150%), cost basis on >=80% holdings.
   * Medium: acceptable coverage & completeness.
   * Low: sparse history or incomplete lot data.
   * Insufficient Data: zero portfolio or empty history.
   */
  private computeConfidence(
    targetDays: number,
    actualDays: number,
    currentSnapshot: HistoricalSnapshot,
    client: Client
  ): InsightConfidence {
    const holdings = client.portfolio || [];
    if (holdings.length === 0) return "INSUFFICIENT_DATA";

    const now = Date.now();
    const snapTime = new Date(currentSnapshot.timestamp).getTime();
    const ageDays = (now - snapTime) / 86400000;
    const isFresh = ageDays <= 7;

    const coverageRatio = actualDays / targetDays;
    const hasGoodCoverage = coverageRatio >= 0.7 && coverageRatio <= 1.5;

    const completeHoldings = holdings.filter((h) => Number(h.investedValue) > 0).length;
    const completenessRatio = completeHoldings / holdings.length;

    if (isFresh && hasGoodCoverage && completenessRatio >= 0.8) {
      return "HIGH";
    }
    if (completenessRatio >= 0.5 && coverageRatio >= 0.4) {
      return "MEDIUM";
    }
    if (coverageRatio < 0.3 || completenessRatio < 0.5) {
      return "LOW";
    }
    return "MEDIUM";
  }

  /**
   * Evaluates all historical snapshots for a client and generates evidence-backed insights.
   */
  public async evaluateClientInsights(
    client: Client,
    goals: Goal[] = []
  ): Promise<ClientInsight[]> {
    const insights: ClientInsight[] = [];
    const clientId = client.id;
    const clientName = client.name;

    // 1. CONCENTRATION_CHANGE (e.g. Technology exposure 18.1% → 27.4% 90 days +9.3 pts)
    const techComparison = await snapshotStore.getHistoricalComparison(
      clientId,
      "sector_concentration_tech",
      90
    );
    if (techComparison) {
      const delta = +(techComparison.current.value - techComparison.previous.value).toFixed(1);
      if (Math.abs(delta) >= 3.0) {
        const confidence = this.computeConfidence(90, techComparison.periodDays, techComparison.current, client);
        insights.push({
          id: `ins_conc_${clientId}_${Date.now()}`,
          clientId,
          clientName,
          type: "CONCENTRATION_CHANGE",
          title: `Technology Exposure ${delta > 0 ? "Increased" : "Decreased"} by ${Math.abs(delta)}%`,
          summary: `Tech exposure shifted from ${techComparison.previous.value}% to ${techComparison.current.value}% over ${techComparison.periodDays} days (${delta > 0 ? "+" : ""}${delta} pts).`,
          evidence: {
            current: techComparison.current.value,
            previous: techComparison.previous.value,
            delta,
            unit: "%",
            periodDays: techComparison.periodDays,
            source: techComparison.current.source,
            confidence,
            threshold: 25.0,
            isDemo: techComparison.current.isDemo,
          },
          severity: techComparison.current.value > 25.0 ? "HIGH" : "MEDIUM",
          detectedAt: new Date().toISOString(),
          isDemo: techComparison.current.isDemo,
        });
      }
    }

    // 2. HEALTH_DETERIORATION (e.g. Health score 88 -> 72)
    const healthComp = await snapshotStore.getHistoricalComparison(
      clientId,
      "health_score",
      30
    );
    if (healthComp) {
      const delta = +(healthComp.current.value - healthComp.previous.value).toFixed(0);
      if (delta <= -5) {
        const confidence = this.computeConfidence(30, healthComp.periodDays, healthComp.current, client);
        insights.push({
          id: `ins_hlth_${clientId}_${Date.now()}`,
          clientId,
          clientName,
          type: "HEALTH_DETERIORATION",
          title: `Portfolio Health Diagnostic Dropped ${Math.abs(delta)} Points`,
          summary: `Health score declined from ${healthComp.previous.value}/100 to ${healthComp.current.value}/100 over ${healthComp.periodDays} days.`,
          evidence: {
            current: healthComp.current.value,
            previous: healthComp.previous.value,
            delta,
            unit: "pts",
            periodDays: healthComp.periodDays,
            source: healthComp.current.source,
            confidence,
            threshold: 70,
            isDemo: healthComp.current.isDemo,
          },
          severity: healthComp.current.value < 70 ? "CRITICAL" : "HIGH",
          detectedAt: new Date().toISOString(),
          isDemo: healthComp.current.isDemo,
        });
      }
    }

    // 3. DRAWDOWN_CHANGE (e.g. Portfolio drawdown -4.1% → -9.3%)
    const drawdownComp = await snapshotStore.getHistoricalComparison(
      clientId,
      "drawdown_pct",
      30
    );
    if (drawdownComp) {
      const delta = +(drawdownComp.current.value - drawdownComp.previous.value).toFixed(1);
      if (drawdownComp.current.value > 5.0 && delta > 2.0) {
        const confidence = this.computeConfidence(30, drawdownComp.periodDays, drawdownComp.current, client);
        insights.push({
          id: `ins_dd_${clientId}_${Date.now()}`,
          clientId,
          clientName,
          type: "DRAWDOWN_CHANGE",
          title: `Peak-to-Trough Drawdown Expanded to -${drawdownComp.current.value}%`,
          summary: `Drawdown widened from -${drawdownComp.previous.value}% to -${drawdownComp.current.value}% over ${drawdownComp.periodDays} days (+${delta}% expansion).`,
          evidence: {
            current: drawdownComp.current.value,
            previous: drawdownComp.previous.value,
            delta,
            unit: "%",
            periodDays: drawdownComp.periodDays,
            source: drawdownComp.current.source,
            confidence,
            threshold: 8.0,
            isDemo: drawdownComp.current.isDemo,
          },
          severity: drawdownComp.current.value >= 10.0 ? "CRITICAL" : "HIGH",
          detectedAt: new Date().toISOString(),
          isDemo: drawdownComp.current.isDemo,
        });
      }
    }

    // 4. CASH_DRAG (e.g. Cash ₹4.2L → ₹12.4L or Cash weight > 15%)
    const cashComp = await snapshotStore.getHistoricalComparison(
      clientId,
      "cash_weight_pct",
      60
    );
    if (cashComp) {
      const delta = +(cashComp.current.value - cashComp.previous.value).toFixed(1);
      if (cashComp.current.value > 12.0 && delta >= 3.0) {
        const confidence = this.computeConfidence(60, cashComp.periodDays, cashComp.current, client);
        insights.push({
          id: `ins_cash_${clientId}_${Date.now()}`,
          clientId,
          clientName,
          type: "CASH_DRAG",
          title: `Cash Drag Accumulation: ${cashComp.current.value}% Allocation`,
          summary: `Cash reserves increased from ${cashComp.previous.value}% to ${cashComp.current.value}% over ${cashComp.periodDays} days, creating uninvested return drag.`,
          evidence: {
            current: cashComp.current.value,
            previous: cashComp.previous.value,
            delta,
            unit: "%",
            periodDays: cashComp.periodDays,
            source: cashComp.current.source,
            confidence,
            threshold: 10.0,
            isDemo: cashComp.current.isDemo,
          },
          severity: "MEDIUM",
          detectedAt: new Date().toISOString(),
          isDemo: cashComp.current.isDemo,
        });
      }
    }

    // 5. GOAL_DETERIORATION (e.g. Goal probability 86% → 73% 30 days -13 pts)
    const clientGoals = goals.filter((g) => g.clientId === clientId);
    for (const goal of clientGoals) {
      const goalComp = await snapshotStore.getHistoricalComparison(
        goal.id,
        "goal_probability_pct",
        30
      );
      if (goalComp) {
        const delta = +(goalComp.current.value - goalComp.previous.value).toFixed(1);
        if (delta <= -8.0) {
          const confidence = this.computeConfidence(30, goalComp.periodDays, goalComp.current, client);
          insights.push({
            id: `ins_goal_${goal.id}_${Date.now()}`,
            clientId,
            clientName,
            type: "GOAL_DETERIORATION",
            title: `Goal Probability Slipped for "${goal.name}" (${delta} pts)`,
            summary: `Monte Carlo success probability fell from ${goalComp.previous.value}% to ${goalComp.current.value}% over ${goalComp.periodDays} days.`,
            evidence: {
              current: goalComp.current.value,
              previous: goalComp.previous.value,
              delta,
              unit: "%",
              periodDays: goalComp.periodDays,
              source: goalComp.current.source,
              confidence,
              threshold: 75.0,
              isDemo: goalComp.current.isDemo,
            },
            severity: goalComp.current.value < 75.0 ? "HIGH" : "MEDIUM",
            detectedAt: new Date().toISOString(),
            isDemo: goalComp.current.isDemo,
          });
        }
      }
    }

    // 6. If no historical changes detected but client has portfolio:
    // Check if client has historical snapshots or is a new client with insufficient history (< 2 snapshots for total_aum)
    if (insights.length === 0 && (client.portfolio || []).length > 0) {
      const aumSnapshots = await snapshotStore.getSnapshots(clientId, "total_aum");
      if (aumSnapshots.length < 2) {
        insights.push({
          id: `ins_pending_${clientId}_${Date.now()}`,
          clientId,
          clientName,
          type: "INSUFFICIENT_HISTORY",
          title: "Historical Baseline Pending",
          summary: "Initial baseline snapshot recorded. Multi-period trend and drift detection requires at least two valuation snapshots over time.",
          evidence: {
            current: (client.portfolio || []).length,
            previous: 0,
            delta: 0,
            unit: "holdings",
            periodDays: 0,
            source: "Portfolio Ledger (Active)",
            confidence: "INSUFFICIENT_DATA",
          },
          severity: "INFO",
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return insights;
  }
}

export const insightEngine = new InsightEngine();
