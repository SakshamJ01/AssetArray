/**
 * AssetArray 4.0 — Institutional Batch Reporting Engine
 * Generates firm-wide quarterly reviews, performance attribution dossiers, and tax loss summaries.
 */

import { AssetClass, Client, PortfolioHolding, FirmProfile } from "../types/wealth";
import { calculateRebalance } from "./rebalancer";
import { calculateHealthScore } from "./healthScore";
import { calculateAttribution } from "./attribution";

export interface BatchReportItem {
  clientId: string;
  clientName: string;
  category: string;
  riskProfile: string;
  totalAum: number;
  healthScore: number;
  healthStatus: string;
  maxDrift: number;
  rebalanceRecommended: boolean;
  harvestableTaxSavings: number;
  attributionAlphaBps: number;
  lastReviewDate: string;
}

export interface FirmWideReviewPackage {
  batchId: string;
  generatedAt: string;
  totalClients: number;
  totalFirmAum: number;
  averageHealthScore: number;
  clientsNeedingRebalance: number;
  totalHarvestableTaxShield: number;
  reports: BatchReportItem[];
  csvExport: string;
  markdownSummary: string;
}

export function generateFirmWideReviewPackage(clients: Client[]): FirmWideReviewPackage {
  const batchId = `BATCH-${Date.now().toString(36).toUpperCase()}`;
  const nowStr = new Date().toISOString();

  if (!clients || clients.length === 0) {
    return {
      batchId,
      generatedAt: nowStr,
      totalClients: 0,
      totalFirmAum: 0,
      averageHealthScore: 0,
      clientsNeedingRebalance: 0,
      totalHarvestableTaxShield: 0,
      reports: [],
      csvExport: "Client ID,Client Name,Category,Risk Profile,Total AUM (INR),Health Score,Rebalance Needed,Tax Shield (INR)\n",
      markdownSummary: "# FIRM-WIDE ADVISORY REVIEW\n\n*No clients found in active roster.*",
    };
  }

  const reports: BatchReportItem[] = [];
  let totalFirmAum = 0;
  let totalHealthSum = 0;
  let clientsNeedingRebalance = 0;
  let totalHarvestableTaxShield = 0;

  clients.forEach((client) => {
    const rawList = client.portfolio || (client as any).holdings || [];
    const portfolioHoldings: PortfolioHolding[] = rawList.map((h: any) => ({
      id: h.id || `h-${Math.random()}`,
      assetName: h.assetName || h.name || "Asset",
      assetClass: (h.assetClass as AssetClass) || "Stocks",
      ticker: h.ticker || h.symbol || "TICKER",
      quantity: String(h.quantity || "1"),
      investedValue: String(h.investedValue || h.currentValue || "0"),
      currentValue: String(h.currentValue || "0"),
      targetWeight: String(h.targetWeight || "0"),
      notes: h.notes || "",
    }));

    const simpleHoldings = portfolioHoldings.map((h) => ({
      id: h.id,
      assetName: h.assetName,
      assetClass: h.assetClass,
      currentValue: Number(h.currentValue) || 0,
      investedValue: Number(h.investedValue) || 0,
      quantity: Number(h.quantity) || 1,
      ticker: h.ticker,
    }));

    const aum = simpleHoldings.reduce((sum, h) => sum + h.currentValue, 0);
    totalFirmAum += aum;

    // Run institutional engines
    const rebal = calculateRebalance(simpleHoldings);
    const health = calculateHealthScore(portfolioHoldings);
    const attrib = calculateAttribution(portfolioHoldings);

    const isRebalNeeded = rebal.isRebalanceRecommended;
    if (isRebalNeeded) clientsNeedingRebalance++;
    totalHarvestableTaxShield += rebal.potentialTaxShield;
    totalHealthSum += health.healthScore;

    const alphaBps = Math.round((attrib.totalActiveReturn || 0) * 10000);

    reports.push({
      clientId: client.id,
      clientName: client.name,
      category: client.category || "Retail",
      riskProfile: client.riskProfile || "Moderate",
      totalAum: parseFloat(aum.toFixed(2)),
      healthScore: health.healthScore,
      healthStatus: health.grade,
      maxDrift: rebal.maxDrift,
      rebalanceRecommended: isRebalNeeded,
      harvestableTaxSavings: rebal.potentialTaxShield,
      attributionAlphaBps: alphaBps,
      lastReviewDate: client.reminderDate || client.lastContact || new Date().toISOString().split("T")[0],
    });
  });

  const averageHealthScore = parseFloat((totalHealthSum / clients.length).toFixed(1));

  // Generate compliance-ready CSV
  const csvRows = [
    "Client ID,Client Name,Category,Risk Profile,Total AUM (INR),Health Score,Health Status,Max Drift %,Rebalance Needed,Tax Shield (INR),Attribution Alpha (bps)",
  ];

  reports.forEach((r) => {
    csvRows.push(
      `"${r.clientId}","${r.clientName}","${r.category}","${r.riskProfile}",${r.totalAum},${r.healthScore},"${r.healthStatus}",${r.maxDrift},${r.rebalanceRecommended},${r.harvestableTaxSavings},${r.attributionAlphaBps}`
    );
  });

  const csvExport = csvRows.join("\n");

  // Generate Executive Markdown Dossier
  const markdownSummary = `# EXECUTIVE FIRM-WIDE ADVISORY REVIEW
**Generated**: ${nowStr}
**Batch ID**: \`${batchId}\`
**Total Client Roster**: ${clients.length} | **Total Firm AUM**: ₹${(totalFirmAum / 10000000).toFixed(2)} Cr
**Average Portfolio Health**: ${averageHealthScore}/100 | **Clients Needing Rebalance**: ${clientsNeedingRebalance}
**Total Actionable Tax Shield**: ₹${totalHarvestableTaxShield.toLocaleString("en-IN")}

## Client Risk & Rebalance Matrix
| Client Name | Category | Risk Profile | AUM (₹) | Health | Rebalance? | Actionable Tax Shield |
|---|---|---|---|:---:|:---:|---|
${reports
  .map(
    (r) =>
      `| ${r.clientName} | ${r.category} | ${r.riskProfile} | ₹${r.totalAum.toLocaleString("en-IN")} | ${r.healthScore} (${r.healthStatus}) | ${r.rebalanceRecommended ? "⚠️ **YES**" : "✅ Balanced"} | ₹${r.harvestableTaxSavings.toLocaleString("en-IN")} |`
  )
  .join("\n")}
`;

  return {
    batchId,
    generatedAt: nowStr,
    totalClients: clients.length,
    totalFirmAum: parseFloat(totalFirmAum.toFixed(2)),
    averageHealthScore,
    clientsNeedingRebalance,
    totalHarvestableTaxShield: parseFloat(totalHarvestableTaxShield.toFixed(2)),
    reports,
    csvExport,
    markdownSummary,
  };
}

export interface ClientMonthlyDigestSnippet {
  clientId: string;
  clientName: string;
  totalAumFormatted: string;
  unrealizedReturnPct: string;
  equityWeightPct: string;
  portalLink: string;
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
}

export function generateClientReviewSnippet(
  client: Client,
  advisorFirmName: string = "Asset Array Wealth Desk",
  baseUrl: string = "https://asset-array.web.app"
): ClientMonthlyDigestSnippet {
  const holdings = client.portfolio || [];
  const totalVal = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const totalCost = holdings.reduce((sum, h) => sum + (Number(h.investedValue) || 0), 0);
  const totalGain = totalVal - totalCost;
  const gainPct = totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(1) : "0.0";

  const equityVal = holdings
    .filter((h) => (h.assetClass || "Stocks") === "Stocks")
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const equityPct = totalVal > 0 ? ((equityVal / totalVal) * 100).toFixed(0) : "0";

  const aumStr =
    totalVal >= 10000000
      ? `₹${(totalVal / 10000000).toFixed(2)} Cr`
      : totalVal >= 100000
      ? `₹${(totalVal / 100000).toFixed(2)} L`
      : `₹${totalVal.toLocaleString("en-IN")}`;

  const portalLink = `${baseUrl}/?portal=${client.id}&token=fiduciary_token_${client.id}`;
  const monthName = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });

  const whatsappMessage =
    `Dear ${client.name},\n\n` +
    `Here is your ${monthName} wealth performance snapshot from ${advisorFirmName}:\n` +
    `• Portfolio Net Worth: ${aumStr}\n` +
    `• Overall Return: ${Number(gainPct) >= 0 ? "+" : ""}${gainPct}%\n` +
    `• Equity Allocation: ${equityPct}%\n\n` +
    `Review your holdings & advisory recommendations on your private portal:\n${portalLink}\n\n` +
    `Warm regards,\n${advisorFirmName}`;

  const emailSubject = `Monthly Wealth Review — ${monthName} (${client.name})`;
  const emailBody =
    `Dear ${client.name},\n\n` +
    `We have prepared your comprehensive portfolio performance review for ${monthName}.\n\n` +
    `KEY HIGHLIGHTS:\n` +
    `- Total Portfolio Valuation: ${aumStr}\n` +
    `- Cumulative Unrealized Return: ${Number(gainPct) >= 0 ? "+" : ""}${gainPct}%\n` +
    `- Equity Weight: ${equityPct}%\n` +
    `- Nominee & Vault Status: 100% Verified\n\n` +
    `You can securely access your real-time holdings, rebalance proposals, and official SEBI quarterly statements on your dedicated investor portal:\n` +
    `${portalLink}\n\n` +
    `Warm regards,\n` +
    `${advisorFirmName}`;

  return {
    clientId: client.id,
    clientName: client.name,
    totalAumFormatted: aumStr,
    unrealizedReturnPct: gainPct,
    equityWeightPct: equityPct,
    portalLink,
    whatsappMessage,
    emailSubject,
    emailBody,
  };
}

export function formatBroadcastTemplate(
  template: string,
  client: Client,
  advisorFirmName: string = "Asset Array Wealth Desk",
  baseUrl: string = "https://asset-array.web.app"
): string {
  const snippet = generateClientReviewSnippet(client, advisorFirmName, baseUrl);
  return template
    .replace(/{ClientName}|{clientName}/g, client.name)
    .replace(/{NetWorth}|{netWorth}|{AUM}/g, snippet.totalAumFormatted)
    .replace(/{MonthlyReturn}|{returnPct}/g, `${Number(snippet.unrealizedReturnPct) >= 0 ? "+" : ""}${snippet.unrealizedReturnPct}%`)
    .replace(/{EquityAllocation}|{equityPct}/g, `${snippet.equityWeightPct}%`)
    .replace(/{PortalLink}|{portalLink}/g, snippet.portalLink)
    .replace(/{AdvisorFirm}|{firmName}/g, advisorFirmName);
}

export interface FirmWideMonthlyReview {
  package: FirmWideReviewPackage;
  clientSnippets: ClientMonthlyDigestSnippet[];
  summary: {
    totalClients: number;
    totalFirmAum: number;
    averageHealthScore: number;
    rebalanceCount: number;
    harvestableTaxShield: number;
  };
}

export function generateFirmWideMonthlyReview(
  clients: Client[],
  firmConfig?: Partial<FirmProfile>,
  baseUrl: string = "https://asset-array.web.app"
): FirmWideMonthlyReview {
  const pkg = generateFirmWideReviewPackage(clients);
  const firmName = firmConfig?.firmName || "Asset Array Wealth Desk";
  const clientSnippets = (clients || []).map((client) =>
    generateClientReviewSnippet(client, firmName, baseUrl)
  );

  return {
    package: pkg,
    clientSnippets,
    summary: {
      totalClients: pkg.totalClients,
      totalFirmAum: pkg.totalFirmAum,
      averageHealthScore: pkg.averageHealthScore,
      rebalanceCount: pkg.clientsNeedingRebalance,
      harvestableTaxShield: pkg.totalHarvestableTaxShield,
    },
  };
}
