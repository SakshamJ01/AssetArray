import {
  SmartAlert,
  SmartAlertRule,
  Client,
  SmartAlertCondition,
  SmartAlertSeverity,
  SmartAlertStatus,
  Goal,
} from "../types/wealth";
import { calculateHealthScore } from "./healthScore";
import { normalizeCategory } from "./attribution";

export const SMART_ALERTS_METHODOLOGY_VERSION = "smart-alerts-governance-v1.1";

export interface InstitutionalSmartAlert extends SmartAlert {
  createdAt: string;
  portfolioId?: string;
  metric?: string;
  observedValue?: number;
  threshold?: number;
  status?: SmartAlertStatus;
  severity: SmartAlertSeverity;
  snoozedUntil?: string | null;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
  methodologyVersion?: string;
}

export const INSTITUTIONAL_ALERT_RULES: SmartAlertRule[] = [
  {
    id: "rule_concentration",
    name: "Single Asset Concentration Breach",
    condition: "CONCENTRATION_BREACH",
    thresholdValue: 20.0, // Alert if holding > 20%
    enabled: true,
  },
  {
    id: "rule_health_score",
    name: "Portfolio Health Score Degradation",
    condition: "HEALTH_SCORE_DROP",
    thresholdValue: 60.0, // Alert if health score < 60
    enabled: true,
  },
  {
    id: "rule_tax_harvest",
    name: "Year-End Tax Loss Opportunity",
    condition: "TAX_HARVEST_WINDOW",
    thresholdValue: 50000.0, // Alert if harvestable loss > ₹50,000
    enabled: true,
  },
  {
    id: "rule_rebalance_drift",
    name: "Target Allocation Drift",
    condition: "REBALANCE_DRIFT",
    thresholdValue: 5.0, // Alert if drift > 5%
    enabled: true,
  },
  {
    id: "rule_drawdown",
    name: "Portfolio Drawdown Breach",
    condition: "DRAWDOWN_EVENT",
    thresholdValue: 10.0, // Alert if portfolio down > 10% from cost
    enabled: true,
  },
  {
    id: "rule_unallocated_cash",
    name: "Excess Unallocated Cash Drag",
    condition: "GOAL_SHORTFALL", // evaluates cash drag / goal risk
    thresholdValue: 25.0, // Alert if cash > 25% of NAV
    enabled: true,
  },
];

export const DEFAULT_ALERT_RULES = INSTITUTIONAL_ALERT_RULES;

/**
 * Marks an alert as acknowledged by the advisor.
 */
export function acknowledgeAlert(alert: InstitutionalSmartAlert): InstitutionalSmartAlert {
  return {
    ...alert,
    acknowledged: true,
    status: "ACKNOWLEDGED",
  };
}

/**
 * Resolves an alert with an optional audit trail note.
 */
export function resolveAlert(
  alert: InstitutionalSmartAlert,
  resolutionNote?: string
): InstitutionalSmartAlert {
  return {
    ...alert,
    status: "RESOLVED",
    acknowledged: true,
    resolvedAt: new Date().toISOString(),
    resolutionNote: resolutionNote || "Resolved by advisor review",
  };
}

/**
 * Snoozes an alert for a specified duration (default 24 hours).
 */
export function snoozeAlert(
  alert: InstitutionalSmartAlert,
  snoozeHours = 24
): InstitutionalSmartAlert {
  const snoozedUntil = new Date(Date.now() + snoozeHours * 60 * 60 * 1000).toISOString();
  return {
    ...alert,
    status: "SNOOZED",
    snoozedUntil,
  };
}

/**
 * Suppresses duplicate alerts within a configurable time window (default 24 hours).
 * Respects SNOOZED, RESOLVED, and ACKNOWLEDGED states to prevent alert storms on market ticks.
 */
export function suppressDuplicateAlerts(
  incomingAlerts: InstitutionalSmartAlert[],
  existingAlerts: InstitutionalSmartAlert[] = [],
  windowHours = 24
): InstitutionalSmartAlert[] {
  const windowMs = windowHours * 60 * 60 * 1000;
  const nowMs = Date.now();

  return incomingAlerts.filter((incoming) => {
    // Find matching existing alert by ruleId and clientId (and position id if present)
    const existing = existingAlerts.find((ex) => {
      if (ex.ruleId !== incoming.ruleId || ex.clientId !== incoming.clientId) {
        return false;
      }
      if (incoming.id && ex.id && incoming.id === ex.id) {
        return true;
      }
      return true;
    });

    if (!existing) return true;

    // 1. If currently snoozed and snooze period has not expired, suppress
    if (existing.status === "SNOOZED" && existing.snoozedUntil) {
      if (new Date(existing.snoozedUntil).getTime() > nowMs) {
        return false;
      }
    }

    // 2. If resolved within cooldown window, suppress
    if (existing.status === "RESOLVED" && existing.resolvedAt) {
      const resolvedAgeMs = nowMs - new Date(existing.resolvedAt).getTime();
      if (resolvedAgeMs < windowMs) {
        return false;
      }
    }

    // 3. If open or acknowledged within cooldown window, suppress duplicate
    const existingTime = new Date(existing.createdAt || existing.timestamp).getTime();
    if (nowMs - existingTime < windowMs) {
      return false;
    }

    return true;
  });
}

/**
 * Deterministically scans client portfolios against active smart alert rules
 */
export function evaluateSmartAlerts(
  clients: Client[],
  rules: SmartAlertRule[] = DEFAULT_ALERT_RULES,
  existingAlerts?: InstitutionalSmartAlert[]
): InstitutionalSmartAlert[] {
  const alerts: InstitutionalSmartAlert[] = [];
  const now = new Date().toISOString();

  clients.forEach((client) => {
    const holdings = client.portfolio || [];
    const totalVal = holdings.reduce(
      (sum, h) => sum + (Number(h.currentValue) || 0),
      0
    );
    const totalInvested = holdings.reduce(
      (sum, h) => sum + (Number(h.investedValue) || 0),
      0
    );

    if (totalVal <= 0 || holdings.length === 0) return;

    rules.forEach((rule) => {
      if (!rule.enabled) return;

      switch (rule.condition) {
        case "CONCENTRATION_BREACH": {
          holdings.forEach((h) => {
            const hVal = Number(h.currentValue) || 0;
            const weight = (hVal / totalVal) * 100;
            if (weight > rule.thresholdValue) {
              const severity: SmartAlertSeverity =
                weight > 35 ? "CRITICAL" : "WARNING";
              alerts.push({
                id: `alert_conc_${client.id}_${h.id}`,
                ruleId: rule.id,
                clientId: client.id,
                clientName: client.name,
                portfolioId: `port_${client.id}`,
                condition: "CONCENTRATION_BREACH",
                title: "Concentration Limit Exceeded",
                message: `${h.assetName || h.ticker} constitutes ${weight.toFixed(1)}% of ${client.name}'s portfolio (limit: ${rule.thresholdValue}%).`,
                severity: weight > 35 ? "critical" : "warning", // lower-case for legacy UI compat
                metric: "holdingWeightPct",
                observedValue: parseFloat(weight.toFixed(2)),
                threshold: rule.thresholdValue,
                status: "OPEN",
                createdAt: now,
                timestamp: now,
                acknowledged: false,
                actionableRoute: "Portfolios",
                methodologyVersion: SMART_ALERTS_METHODOLOGY_VERSION,
              });
            }
          });
          break;
        }

        case "HEALTH_SCORE_DROP": {
          const health = calculateHealthScore(holdings, 0, client.id);
          if (health.healthScore < rule.thresholdValue) {
            alerts.push({
              id: `alert_health_${client.id}`,
              ruleId: rule.id,
              clientId: client.id,
              clientName: client.name,
              portfolioId: `port_${client.id}`,
              condition: "HEALTH_SCORE_DROP",
              title: "Health Diagnostic Alert",
              message: `${client.name}'s portfolio health score dropped to ${health.healthScore}/100 (${health.grade}). Review recommended mitigations.`,
              severity: health.healthScore < 50 ? "critical" : "warning",
              metric: "healthScore",
              observedValue: health.healthScore,
              threshold: rule.thresholdValue,
              status: "OPEN",
              createdAt: now,
              timestamp: now,
              acknowledged: false,
              actionableRoute: "Portfolios",
              methodologyVersion: SMART_ALERTS_METHODOLOGY_VERSION,
            });
          }
          break;
        }

        case "TAX_HARVEST_WINDOW": {
          let clientTotalLoss = 0;
          holdings.forEach((h) => {
            const cur = Number(h.currentValue) || 0;
            const inv = Number(h.investedValue) || 0;
            if (inv > cur) clientTotalLoss += inv - cur;
          });

          if (clientTotalLoss >= rule.thresholdValue) {
            alerts.push({
              id: `alert_tax_${client.id}`,
              ruleId: rule.id,
              clientId: client.id,
              clientName: client.name,
              portfolioId: `port_${client.id}`,
              condition: "TAX_HARVEST_WINDOW",
              title: "Tax Harvesting Opportunity",
              message: `${client.name} has ₹${Math.round(clientTotalLoss).toLocaleString("en-IN")} in harvestable capital losses available to offset taxable gains.`,
              severity: "info",
              metric: "harvestableLossAmount",
              observedValue: Math.round(clientTotalLoss),
              threshold: rule.thresholdValue,
              status: "OPEN",
              createdAt: now,
              timestamp: now,
              acknowledged: false,
              actionableRoute: "Portfolios",
              methodologyVersion: SMART_ALERTS_METHODOLOGY_VERSION,
            });
          }
          break;
        }

        case "DRAWDOWN_EVENT": {
          if (totalInvested > 0 && totalVal < totalInvested) {
            const ddPct = ((totalInvested - totalVal) / totalInvested) * 100;
            if (ddPct >= rule.thresholdValue) {
              alerts.push({
                id: `alert_dd_${client.id}`,
                ruleId: rule.id,
                clientId: client.id,
                clientName: client.name,
                portfolioId: `port_${client.id}`,
                condition: "DRAWDOWN_EVENT",
                title: "Portfolio Drawdown Alert",
                message: `${client.name}'s portfolio is currently down ${ddPct.toFixed(1)}% below invested cost basis (threshold: ${rule.thresholdValue}%).`,
                severity: ddPct >= 20 ? "critical" : "warning",
                metric: "drawdownFromCostPct",
                observedValue: parseFloat(ddPct.toFixed(2)),
                threshold: rule.thresholdValue,
                status: "OPEN",
                createdAt: now,
                timestamp: now,
                acknowledged: false,
                actionableRoute: "Portfolios",
                methodologyVersion: SMART_ALERTS_METHODOLOGY_VERSION,
              });
            }
          }
          break;
        }

        case "REBALANCE_DRIFT": {
          // Check if any category drifted > 5% from target weight
          holdings.forEach((h) => {
            const curVal = Number(h.currentValue) || 0;
            const actualWeight = (curVal / totalVal) * 100;
            const targetWeight = parseFloat(h.targetWeight) || 0;
            if (targetWeight > 0) {
              const drift = Math.abs(actualWeight - targetWeight);
              if (drift >= rule.thresholdValue) {
                alerts.push({
                  id: `alert_drift_${client.id}_${h.id}`,
                  ruleId: rule.id,
                  clientId: client.id,
                  clientName: client.name,
                  portfolioId: `port_${client.id}`,
                  condition: "REBALANCE_DRIFT",
                  title: "Target Allocation Drift",
                  message: `${h.assetName || h.ticker} drifted by ${drift.toFixed(1)}% from target weight (${actualWeight.toFixed(1)}% vs target ${targetWeight.toFixed(1)}%).`,
                  severity: drift >= 10 ? "critical" : "warning",
                  metric: "allocationDriftPct",
                  observedValue: parseFloat(drift.toFixed(2)),
                  threshold: rule.thresholdValue,
                  status: "OPEN",
                  createdAt: now,
                  timestamp: now,
                  acknowledged: false,
                  actionableRoute: "Portfolios",
                  methodologyVersion: SMART_ALERTS_METHODOLOGY_VERSION,
                });
              }
            }
          });
          break;
        }

        default:
          break;
      }
    });
  });

  if (existingAlerts && existingAlerts.length > 0) {
    return suppressDuplicateAlerts(alerts, existingAlerts);
  }

  return alerts;
}
