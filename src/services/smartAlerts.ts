import {
  SmartAlert,
  SmartAlertRule,
  Client,
} from "../types/wealth";
import { calculateHealthScore } from "./healthScore";

export const DEFAULT_ALERT_RULES: SmartAlertRule[] = [
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
];

/**
 * Scans client portfolios against active smart alert rules
 */
export function evaluateSmartAlerts(
  clients: Client[],
  rules: SmartAlertRule[] = DEFAULT_ALERT_RULES
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const now = new Date().toISOString();

  clients.forEach((client) => {
    const holdings = client.portfolio || [];
    const totalVal = holdings.reduce(
      (sum, h) => sum + (Number(h.currentValue) || 0),
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
              alerts.push({
                id: `alert_conc_${client.id}_${h.id}`,
                ruleId: rule.id,
                clientId: client.id,
                clientName: client.name,
                condition: "CONCENTRATION_BREACH",
                title: "Concentration Limit Exceeded",
                message: `${h.assetName || h.ticker} constitutes ${weight.toFixed(1)}% of ${client.name}'s portfolio (limit: ${rule.thresholdValue}%).`,
                severity: weight > 35 ? "critical" : "warning",
                timestamp: now,
                acknowledged: false,
                actionableRoute: "Portfolios",
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
              condition: "HEALTH_SCORE_DROP",
              title: "Health Diagnostic Alert",
              message: `${client.name}'s portfolio health score dropped to ${health.healthScore}/100 (${health.grade}). Review recommended mitigations.`,
              severity: health.healthScore < 50 ? "critical" : "warning",
              timestamp: now,
              acknowledged: false,
              actionableRoute: "Portfolios",
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
              condition: "TAX_HARVEST_WINDOW",
              title: "Tax Harvesting Opportunity",
              message: `${client.name} has ₹${Math.round(clientTotalLoss).toLocaleString("en-IN")} in harvestable capital losses available to offset taxable gains.`,
              severity: "info",
              timestamp: now,
              acknowledged: false,
              actionableRoute: "Portfolios",
            });
          }
          break;
        }

        default:
          break;
      }
    });
  });

  return alerts;
}
