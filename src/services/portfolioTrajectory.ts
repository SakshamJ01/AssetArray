/**
 * Consolidated Portfolio Trajectory Builder
 * Aggregates GENUINE point-in-time AUM snapshots (recorded on client valuation
 * events and Client 360 diagnostics) across all tracked clients into a
 * consolidated historical value curve. Demo-seeded snapshots (isDemo) are
 * strictly excluded so the curve reflects only real recorded history.
 */

import { snapshotStore } from "./clientInsights/snapshotStore";
import { ChartPeriod, DataPoint } from "../components/charts/PerformanceChart";

export type TrajectoryByPeriod = Record<ChartPeriod, DataPoint[]>;

const DAY_MS = 86400000;

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function emptyTrajectory(): TrajectoryByPeriod {
  return { "1M": [], "3M": [], YTD: [], "1Y": [], ALL: [] };
}

function formatDateLabel(dateKey: string): string {
  // dateKey: YYYY-MM-DD
  const [year, month, day] = dateKey.split("-").map((n) => parseInt(n, 10));
  if (!year || !month || !day) return dateKey;
  const now = new Date();
  const isCurrentYear = year === now.getFullYear();
  if (isCurrentYear) {
    return `${MONTHS_SHORT[month - 1] || month} ${day}`;
  }
  return `${MONTHS_SHORT[month - 1] || month} '${String(year).slice(-2)}`;
}

/**
 * Build a consolidated trajectory from genuine total_aum snapshots across
 * the given client ids. Periods with fewer than 2 data points are left empty
 * so the UI renders an honest "no history" state instead of an invented curve.
 */
export async function buildConsolidatedTrajectory(
  clientIds: string[],
  opts?: { now?: Date }
): Promise<TrajectoryByPeriod> {
  const ids = Array.from(new Set(clientIds.filter(Boolean)));
  const byDateKey = new Map<string, number>();

  for (const id of ids) {
    const snaps = await snapshotStore.getSnapshots(id, "total_aum");
    for (const s of snaps) {
      if (s.isDemo) continue;
      if (typeof s.value !== "number" || !isFinite(s.value)) continue;
      const dateKey = (s.timestamp || "").slice(0, 10);
      if (!dateKey) continue;
      byDateKey.set(dateKey, (byDateKey.get(dateKey) || 0) + s.value);
    }
  }

  if (byDateKey.size < 2) {
    return emptyTrajectory();
  }

  const sorted = [...byDateKey.entries()]
    .map(([key, value]) => ({
      ts: new Date(`${key}T00:00:00Z`).getTime(),
      point: { date: formatDateLabel(key), value: Number(value.toFixed(2)) },
    }))
    .sort((a, b) => a.ts - b.ts);

  const now = opts?.now || new Date();
  const nowMs = now.getTime();
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

  function inWindow(points: typeof sorted, cutoffMs: number) {
    return points.filter((p) => p.ts >= cutoffMs).map((p) => p.point);
  }

  const seriesFor = (days: number) => {
    const points = inWindow(sorted, nowMs - days * DAY_MS);
    if (points.length < 2) return [];
    return points;
  };

  const ytdPoints = inWindow(sorted, yearStart);
  const allPoints = sorted.map((p) => p.point);

  return {
    "1M": seriesFor(31),
    "3M": seriesFor(92),
    YTD: ytdPoints.length >= 2 ? ytdPoints : [],
    "1Y": seriesFor(366),
    ALL: allPoints.length >= 2 ? allPoints : [],
  };
}