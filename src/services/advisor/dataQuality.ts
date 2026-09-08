import { DataQualityReport, MissingDataItem } from "../../types/advisor";
import { Client } from "../../types/wealth";

/**
 * @deprecated Canonical engine is `src/services/dataQuality/dataQualityEngine.ts`.
 * This legacy sync wrapper is retained for AdvisorCommandCenter until migration
 * completes. It no longer contains hardcoded percentages.
 */
export function evaluateDataQuality(clients: Client[]): DataQualityReport {
  let totalHoldingsCount = 0;
  let holdingsWithCostBasis = 0;
  let holdingsWithAcquisitionDate = 0;
  let holdingsWithTargetWeight = 0;
  let clientsWithValidCategory = 0;

  const missingItems: MissingDataItem[] = [];

  clients.forEach((client) => {
    if (client.category && client.category.length > 0) {
      clientsWithValidCategory++;
    } else {
      missingItems.push({
        id: `dq_cat_${client.id}`,
        clientId: client.id,
        clientName: client.name,
        missingField: "Relationship Category / Mandate",
        issueDescription: `Client ${client.name} has no assigned categorization (e.g. HNI, Family Office).`,
        recommendedAction: "Assign institutional relationship tier in Client Profile.",
        severity: "WARNING",
      });
    }

    const holdings = client.portfolio || [];
    holdings.forEach((h) => {
      totalHoldingsCount++;

      const hasCost = Number(h.investedValue) > 0;
      if (hasCost) {
        holdingsWithCostBasis++;
      } else {
        missingItems.push({
          id: `dq_cost_${client.id}_${h.id}`,
          clientId: client.id,
          clientName: client.name,
          holdingId: h.id,
          holdingName: h.assetName || h.ticker,
          missingField: "Invested Cost Basis",
          issueDescription: `${h.assetName || h.ticker} has zero or missing invested cost basis.`,
          recommendedAction: "Enter original acquisition cost to enable accurate unrealized P&L.",
          severity: "CRITICAL",
        });
      }

      const acqDate = h.acquisitionDate || h.acquiredAt;
      if (acqDate && acqDate.length >= 10) {
        holdingsWithAcquisitionDate++;
      } else {
        missingItems.push({
          id: `dq_date_${client.id}_${h.id}`,
          clientId: client.id,
          clientName: client.name,
          holdingId: h.id,
          holdingName: h.assetName || h.ticker,
          missingField: "Acquisition Date",
          issueDescription: `${h.assetName || h.ticker} is missing verified purchase date for tax lot aging.`,
          recommendedAction: "Input purchase trade date to classify holding as Short-Term vs Long-Term.",
          severity: "WARNING",
        });
      }

      if (parseFloat(h.targetWeight || "0") > 0) {
        holdingsWithTargetWeight++;
      }
    });
  });

  const totalClients = Math.max(1, clients.length);
  const totalHoldings = Math.max(1, totalHoldingsCount);

  const portfolioDataCompletenessPct = Math.round(
    ((holdingsWithCostBasis / totalHoldings) * 0.7 + (clientsWithValidCategory / totalClients) * 0.3) * 100
  );

  const taxLotAcquisitionDateCoveragePct = Math.round(
    (holdingsWithAcquisitionDate / totalHoldings) * 100
  );

  // Honest coverage: this legacy path has no snapshot/benchmark inputs, so it
  // reports target-weight coverage (measurable) and 0 for NAV history (unknown),
  // instead of hardcoded 82/96.
  const holdingsWithTargetWeightPct =
    totalHoldingsCount === 0 ? 0 : Math.round((holdingsWithTargetWeight / totalHoldings) * 100);
  const historicalNavCoveragePct = 0;
  const benchmarkCoveragePct = holdingsWithTargetWeightPct;

  const overallScore = Math.round(
    portfolioDataCompletenessPct * 0.4 +
      taxLotAcquisitionDateCoveragePct * 0.3 +
      historicalNavCoveragePct * 0.15 +
      benchmarkCoveragePct * 0.15
  );

  return {
    overallScore,
    portfolioDataCompletenessPct,
    taxLotAcquisitionDateCoveragePct,
    historicalNavCoveragePct,
    benchmarkCoveragePct,
    missingItemsCount: missingItems.length,
    missingItems,
    asOfDate: new Date().toISOString(),
  };
}
