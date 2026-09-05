/**
 * Historical Snapshot Store
 * Persists and retrieves point-in-time metrics for real trend and change detection.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { HistoricalSnapshot, SnapshotEntityType } from "./types";

const SNAPSHOTS_STORAGE_KEY = "@assetarray_historical_snapshots_v1";

export class SnapshotStore {
  private cache: HistoricalSnapshot[] | null = null;
  private readonly METHODOLOGY_VERSION = "snapshot-v1.0";

  private async load(): Promise<HistoricalSnapshot[]> {
    if (this.cache) return this.cache;
    try {
      const raw = await AsyncStorage.getItem(SNAPSHOTS_STORAGE_KEY);
      this.cache = raw ? (JSON.parse(raw) as HistoricalSnapshot[]) : [];
    } catch {
      this.cache = [];
    }
    return this.cache;
  }

  private async save(): Promise<void> {
    if (!this.cache) return;
    try {
      await AsyncStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(this.cache));
    } catch (err: any) {
      console.warn("[SnapshotStore] Failed to persist snapshots:", err.message);
    }
  }

  public async recordSnapshot(params: {
    entityId: string;
    entityType: SnapshotEntityType;
    metric: string;
    value: number;
    timestamp?: string;
    metadata?: Record<string, any>;
    source?: string;
    isDemo?: boolean;
  }): Promise<HistoricalSnapshot> {
    const list = await this.load();
    const targetTimestamp = params.timestamp ? new Date(params.timestamp).getTime() : Date.now();
    const roundedValue = Number(params.value.toFixed(4));

    // Deduplication: same entity, same metric, same value within a 1-hour window
    const DEDUP_WINDOW_MS = 60 * 60 * 1000;
    const existingDuplicate = list.find(
      (s) =>
        s.entityId === params.entityId &&
        s.metric === params.metric &&
        Math.abs(s.value - roundedValue) < 0.0001 &&
        Math.abs(new Date(s.timestamp).getTime() - targetTimestamp) < DEDUP_WINDOW_MS
    );
    if (existingDuplicate) {
      return existingDuplicate;
    }

    const snapshot: HistoricalSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entityId: params.entityId,
      entityType: params.entityType,
      metric: params.metric,
      value: roundedValue,
      metadata: params.metadata,
      timestamp: params.timestamp || new Date().toISOString(),
      source: params.source || "Portfolio Calculation Engine",
      methodologyVersion: this.METHODOLOGY_VERSION,
      isDemo: Boolean(params.isDemo),
    };

    list.unshift(snapshot);
    // Keep max 2000 snapshots to balance performance and storage
    if (list.length > 2000) {
      list.length = 2000;
    }

    await this.save();
    return snapshot;
  }

  public async getSnapshots(entityId: string, metric?: string): Promise<HistoricalSnapshot[]> {
    const list = await this.load();
    return list.filter((s) => s.entityId === entityId && (!metric || s.metric === metric));
  }

  /**
   * Retrieves the latest snapshot and the closest prior snapshot within a lookback window (e.g. 30, 60, 90 days).
   */
  public async getHistoricalComparison(
    entityId: string,
    metric: string,
    targetLookbackDays = 30
  ): Promise<{
    current: HistoricalSnapshot;
    previous: HistoricalSnapshot;
    periodDays: number;
  } | null> {
    const history = await this.getSnapshots(entityId, metric);
    if (history.length < 2) return null;

    // Sort descending by timestamp
    const sorted = [...history].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const current = sorted[0];
    const currentTime = new Date(current.timestamp).getTime();
    const targetPastTime = currentTime - targetLookbackDays * 86400000;

    // Find the snapshot closest to targetPastTime (older than current)
    let closestPrior: HistoricalSnapshot | null = null;
    let minDiff = Infinity;

    for (let i = 1; i < sorted.length; i++) {
      const snapTime = new Date(sorted[i].timestamp).getTime();
      const diff = Math.abs(snapTime - targetPastTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestPrior = sorted[i];
      }
    }

    if (!closestPrior) return null;

    const actualPeriodDays = Math.max(
      1,
      Math.round((currentTime - new Date(closestPrior.timestamp).getTime()) / 86400000)
    );

    return {
      current,
      previous: closestPrior,
      periodDays: actualPeriodDays,
    };
  }

  /**
   * Records genuine historical snapshots from real portfolio updates / transactions / valuations.
   * Called on actual application events (portfolio save, import, valuation refresh).
   */
  public async recordPortfolioEventSnapshots(
    client: { id: string; portfolio?: any[] },
    source = "Portfolio Valuation Event"
  ): Promise<void> {
    const holdings = client.portfolio || [];
    if (holdings.length === 0) return;

    const now = new Date().toISOString();
    const totalCurrent = holdings.reduce((sum, h) => sum + (parseFloat(h.currentValue) || 0), 0);
    const totalInvested = holdings.reduce((sum, h) => sum + (parseFloat(h.investedValue) || 0), 0);

    if (totalCurrent > 0) {
      await this.recordSnapshot({
        entityId: client.id,
        entityType: "PORTFOLIO",
        metric: "total_aum",
        value: totalCurrent,
        timestamp: now,
        source,
      });

      // Calculate tech exposure
      const techHoldings = holdings.filter((h) => {
        const sector = (h.sector || h.category || "").toLowerCase();
        const name = (h.assetName || h.ticker || "").toLowerCase();
        return sector.includes("tech") || name.includes("tcs") || name.includes("infosys") || name.includes("wipro");
      });
      const techVal = techHoldings.reduce((sum, h) => sum + (parseFloat(h.currentValue) || 0), 0);
      const techPct = Number(((techVal / totalCurrent) * 100).toFixed(1));

      await this.recordSnapshot({
        entityId: client.id,
        entityType: "PORTFOLIO",
        metric: "sector_concentration_tech",
        value: techPct,
        timestamp: now,
        source,
      });

      // Calculate cash weight
      const cashHoldings = holdings.filter((h) => {
        const assetClass = (h.assetClass || h.category || "").toLowerCase();
        const name = (h.assetName || h.ticker || "").toLowerCase();
        return assetClass.includes("cash") || assetClass.includes("liquid") || name.includes("liquid") || name.includes("cash");
      });
      const cashVal = cashHoldings.reduce((sum, h) => sum + (parseFloat(h.currentValue) || 0), 0);
      const cashPct = Number(((cashVal / totalCurrent) * 100).toFixed(1));

      await this.recordSnapshot({
        entityId: client.id,
        entityType: "PORTFOLIO",
        metric: "cash_weight_pct",
        value: cashPct,
        timestamp: now,
        source,
      });

      // Calculate drawdown if underwater
      const gainLoss = totalCurrent - totalInvested;
      const drawdownPct = totalInvested > 0 && gainLoss < 0 ? Math.abs(Number(((gainLoss / totalInvested) * 100).toFixed(1))) : 0;
      await this.recordSnapshot({
        entityId: client.id,
        entityType: "PORTFOLIO",
        metric: "drawdown_pct",
        value: drawdownPct,
        timestamp: now,
        source,
      });
    }
  }

  public async clear(): Promise<void> {
    this.cache = [];
    await AsyncStorage.removeItem(SNAPSHOTS_STORAGE_KEY);
  }

  /**
   * DEMO ONLY: Seeds synthetic baseline historical snapshots for explicitly designated demo clients.
   * ABSOLUTE RULE: This must NEVER run for real production clients.
   */
  public async seedBaselineSnapshotsIfEmpty(
    clientId: string,
    params?: {
      techExposure?: number;
      healthScore?: number;
      drawdown?: number;
      cashWeight?: number;
      isDemo?: boolean;
      forceDemo?: boolean;
    }
  ): Promise<void> {
    // Strict Guard: Never seed synthetic baseline for real clients without explicit demo flag
    if (!params?.isDemo && !params?.forceDemo) {
      return;
    }

    const existing = await this.getSnapshots(clientId);
    if (existing.length > 0) return;

    const now = Date.now();
    const dayMs = 86400000;

    // 1. Tech Concentration: 90 days ago vs now
    const curTech = params?.techExposure ?? 27.4;
    const prevTech = Math.max(5, +(curTech - 9.3).toFixed(1));
    await this.recordSnapshot({
      entityId: clientId,
      entityType: "PORTFOLIO",
      metric: "sector_concentration_tech",
      value: prevTech,
      timestamp: new Date(now - 90 * dayMs).toISOString(),
      source: "DEMO DATA · SIMULATED HISTORY",
      isDemo: true,
    });
    await this.recordSnapshot({
      entityId: clientId,
      entityType: "PORTFOLIO",
      metric: "sector_concentration_tech",
      value: curTech,
      timestamp: new Date(now).toISOString(),
      source: "DEMO DATA · SIMULATED HISTORY",
      isDemo: true,
    });

    // 2. Health Score: 30 days ago vs now
    const curHealth = params?.healthScore ?? 72;
    const prevHealth = Math.min(100, curHealth + 16);
    await this.recordSnapshot({
      entityId: clientId,
      entityType: "HEALTH",
      metric: "health_score",
      value: prevHealth,
      timestamp: new Date(now - 30 * dayMs).toISOString(),
      source: "DEMO DATA · SIMULATED HISTORY",
      isDemo: true,
    });
    await this.recordSnapshot({
      entityId: clientId,
      entityType: "HEALTH",
      metric: "health_score",
      value: curHealth,
      timestamp: new Date(now).toISOString(),
      source: "DEMO DATA · SIMULATED HISTORY",
      isDemo: true,
    });

    // 3. Peak Drawdown: 30 days ago vs now
    const curDD = params?.drawdown ?? 9.3;
    const prevDD = Math.max(1, +(curDD - 5.2).toFixed(1));
    await this.recordSnapshot({
      entityId: clientId,
      entityType: "PORTFOLIO",
      metric: "drawdown_pct",
      value: prevDD,
      timestamp: new Date(now - 30 * dayMs).toISOString(),
      source: "DEMO DATA · SIMULATED HISTORY",
      isDemo: true,
    });
    await this.recordSnapshot({
      entityId: clientId,
      entityType: "PORTFOLIO",
      metric: "drawdown_pct",
      value: curDD,
      timestamp: new Date(now).toISOString(),
      source: "DEMO DATA · SIMULATED HISTORY",
      isDemo: true,
    });

    // 4. Cash Drag: 60 days ago vs now
    const curCash = params?.cashWeight ?? 14.2;
    const prevCash = Math.max(2, +(curCash - 7.7).toFixed(1));
    await this.recordSnapshot({
      entityId: clientId,
      entityType: "PORTFOLIO",
      metric: "cash_weight_pct",
      value: prevCash,
      timestamp: new Date(now - 60 * dayMs).toISOString(),
      source: "DEMO DATA · SIMULATED HISTORY",
      isDemo: true,
    });
    await this.recordSnapshot({
      entityId: clientId,
      entityType: "PORTFOLIO",
      metric: "cash_weight_pct",
      value: curCash,
      timestamp: new Date(now).toISOString(),
      source: "DEMO DATA · SIMULATED HISTORY",
      isDemo: true,
    });
  }
}

export const snapshotStore = new SnapshotStore();
