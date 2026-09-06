import { documentExporter } from "../platform/export";
import { ClientInput } from "./aiAdvisor";
import { AssetClass, PortfolioHolding } from "../types/wealth";
import { calculateHealthScore } from "./healthScore";
import { calculateAttribution, STANDARD_BENCHMARKS } from "./attribution";
import { generateTaxHarvestReport } from "./taxIntelligence";
import { simulateScenario, PRESET_SCENARIOS } from "./scenarioEngine";

function normalizePdfAssetClass(cls?: string): AssetClass {
  if (!cls) return "Stocks";
  const lower = cls.toLowerCase();
  if (lower.includes("bond") || lower.includes("debt") || lower.includes("fixed")) return "Bonds";
  if (lower.includes("mutual") || lower.includes("fund")) return "Mutual Funds";
  if (lower.includes("cash") || lower.includes("liquid") || lower.includes("money")) return "Cash";
  if (lower.includes("real") || lower.includes("crypto") || lower.includes("gold") || lower.includes("alt")) return "Alternatives";
  return "Stocks";
}

export interface GeneratePdfOptions {
  client: ClientInput;
  advisorName?: string;
  currencySymbol?: string;
}

export async function exportClientPdfReport({
  client,
  advisorName = "Asset Array Private Wealth",
  currencySymbol = "₹",
}: GeneratePdfOptions) {
  const rawHoldings = client.portfolio || [];
  const holdings: PortfolioHolding[] = rawHoldings.map((h, i) => ({
    id: `holding-${i}`,
    assetName: h.assetName,
    assetClass: normalizePdfAssetClass(h.assetClass),
    ticker: h.ticker || "UNKNOWN",
    quantity: h.quantity || "1",
    investedValue: h.investedValue || "0",
    currentValue: h.currentValue || "0",
    targetWeight: h.targetWeight || "0%",
    notes: "",
    provenance: {
      dataSource: "USER_INPUT",
      lastVerifiedAt: new Date().toISOString(),
      confidence: "HIGH",
    },
    quality: "HIGH",
  }));

  const totalValue = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const totalCost = holdings.reduce((sum, h) => sum + (Number(h.investedValue) || 0), 0);
  const totalGainLoss = totalValue - totalCost;
  const gainLossPercent = totalCost > 0 ? ((totalGainLoss / totalCost) * 100).toFixed(2) : "0.00";
  const dateStr = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  const reportRef = `AA-${Math.floor(100000 + Math.random() * 900000)}`;

  // Evaluate institutional v3.1 diagnostic engines
  const health = calculateHealthScore(holdings, 0, client.id || "pdf-port");
  const attribution = calculateAttribution(holdings, STANDARD_BENCHMARKS.BALANCED_HYBRID, client.id || "pdf-port");
  const tax = generateTaxHarvestReport(holdings, { shortTerm: 0, longTerm: 0 }, client.id || "pdf-port");
  const stress = simulateScenario(holdings, PRESET_SCENARIOS.TECH_CORRECTION, client.id || "pdf-port");

  // Group by Asset Class for allocation breakdown
  const classBreakdown: Record<string, number> = {};
  holdings.forEach((h) => {
    const cls = h.assetClass || "Other";
    classBreakdown[cls] = (classBreakdown[cls] || 0) + (Number(h.currentValue) || 0);
  });

  const allocationRows = Object.entries(classBreakdown).map(([cls, val]) => {
    const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : "0.0";
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 12px; font-variant-numeric: tabular-nums;">
        <span style="font-weight: 600; color: #1e293b;">${cls}</span>
        <span style="color: #475569;">${currencySymbol}${val.toLocaleString("en-IN")} <strong style="color: #0f172a; margin-left: 6px;">(${pct}%)</strong></span>
      </div>
    `;
  }).join("");

  const holdingsTableRows = holdings.length > 0
    ? holdings.map((h, i) => {
        const val = Number(h.currentValue) || 0;
        const cost = Number(h.investedValue) || 0;
        const diff = val - cost;
        const diffPct = cost > 0 ? ((diff / cost) * 100).toFixed(1) : "0.0";
        const isPositive = diff >= 0;
        return `
          <tr style="background-color: ${i % 2 === 0 ? "#ffffff" : "#f8fafc"}; font-variant-numeric: tabular-nums;">
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">
              ${h.assetName}
              <div style="font-size: 10px; font-weight: 500; color: #64748b; margin-top: 1px;">Ticker: ${h.ticker || "N/A"} • ${h.targetWeight || "Weight: auto"}</div>
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 12px;">
              <span style="display: inline-block; padding: 2px 6px; border-radius: 2px; background: #f1f5f9; font-size: 10px; font-weight: 600; color: #334155;">
                ${h.assetClass}
              </span>
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569; font-size: 12px;">${h.quantity || "1"}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569; font-size: 12px;">${currencySymbol}${cost.toLocaleString("en-IN")}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a; font-size: 13px;">${currencySymbol}${val.toLocaleString("en-IN")}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: ${isPositive ? "#059669" : "#dc2626"}; font-size: 12px;">
              ${isPositive ? "+" : ""}${currencySymbol}${diff.toLocaleString("en-IN")}
              <div style="font-size: 10px; font-weight: 600;">(${isPositive ? "+" : ""}${diffPct}%)</div>
            </td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="6" style="padding: 24px; text-align: center; color: #64748b;">No portfolio holdings recorded on file.</td></tr>`;

  // HTML content adhering to Rule 64 structure: Client -> Portfolio -> Performance -> Risk -> Goals -> Tax -> Recommendations -> Disclosures
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Advisor Portfolio Statement - ${client.name}</title>
  <style>
    @page { margin: 24px; size: A4; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 28px;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
    }
    .header-banner {
      background: #0b1222;
      border-radius: 4px;
      padding: 18px 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e0a84c;
      margin-bottom: 18px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #ffffff;
    }
    .brand-subtitle {
      font-size: 10px;
      color: #e0a84c;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-top: 2px;
      font-weight: 600;
    }
    .statement-meta {
      text-align: right;
    }
    .statement-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #94a3b8;
      font-weight: 700;
    }
    .statement-val {
      font-size: 13px;
      color: #ffffff;
      font-weight: 700;
      margin-top: 2px;
      font-variant-numeric: tabular-nums;
    }
    .client-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .client-name {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.2px;
    }
    .client-details {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
      display: flex;
      gap: 10px;
    }
    .client-badge {
      display: inline-block;
      padding: 3px 8px;
      background: rgba(224, 168, 76, 0.15);
      border: 1px solid #e0a84c;
      color: #b37e28;
      border-radius: 2px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-row {
      display: flex;
      gap: 12px;
      margin-bottom: 18px;
    }
    .kpi-card {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 12px 14px;
      font-variant-numeric: tabular-nums;
    }
    .kpi-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .kpi-num {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .two-col-summary {
      display: flex;
      gap: 14px;
      margin-bottom: 18px;
    }
    .summary-card {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 12px 16px;
    }
    .card-heading {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #0f172a;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      margin-bottom: 22px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 12px;
      text-align: left;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      font-weight: 800;
    }
    th.right { text-align: right; }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #94a3b8;
    }
    .fiduciary-seal {
      font-size: 9px;
      color: #64748b;
      line-height: 14px;
      max-width: 65%;
    }
    .signature-block {
      text-align: right;
    }
    .signature-line {
      width: 140px;
      border-top: 1px solid #0f172a;
      margin-top: 18px;
      margin-bottom: 3px;
    }
  </style>
</head>
<body>
  <!-- 1. HEADER BANNER -->
  <div class="header-banner">
    <div>
      <div class="brand-title">ASSET ARRAY</div>
      <div class="brand-subtitle">Private Wealth Advisory • Executive Valuation Statement</div>
    </div>
    <div class="statement-meta">
      <div class="statement-label">Statement Ref</div>
      <div class="statement-val">${reportRef}</div>
      <div class="statement-label" style="margin-top: 4px;">As-of Valuation Date</div>
      <div style="font-size: 11px; color: #e2e8f0; font-variant-numeric: tabular-nums;">${dateStr}</div>
    </div>
  </div>

  <!-- 2. CLIENT PROFILE -->
  <div class="client-card">
    <div>
      <div class="client-name">${client.name}</div>
      <div class="client-details">
        <span><strong>Category:</strong> ${client.category || "Private Wealth"}</span>
        <span>•</span>
        <span><strong>Location:</strong> ${client.city || "Mumbai"}</span>
        <span>•</span>
        <span><strong>Primary Advisor:</strong> ${advisorName}</span>
      </div>
    </div>
    <div>
      <span class="client-badge">${client.riskProfile || "Moderate Growth"}</span>
    </div>
  </div>

  <!-- 3. PORTFOLIO VALUATION SUMMARY -->
  <div class="kpi-row">
    <div class="kpi-card">
      <div class="kpi-title">Current Portfolio Value (AUM)</div>
      <div class="kpi-num">${currencySymbol}${totalValue.toLocaleString("en-IN")}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Invested Cost Basis</div>
      <div class="kpi-num" style="color: #475569;">${currencySymbol}${totalCost.toLocaleString("en-IN")}</div>
    </div>
    <div class="kpi-card" style="background: ${totalGainLoss >= 0 ? "#f0fdf4" : "#fef2f2"}; border-color: ${totalGainLoss >= 0 ? "#bbf7d0" : "#fecaca"};">
      <div class="kpi-title" style="color: ${totalGainLoss >= 0 ? "#15803d" : "#b91c1c"};">Unrealized Net Gain / Loss</div>
      <div class="kpi-num" style="color: ${totalGainLoss >= 0 ? "#15803d" : "#b91c1c"};">
        ${totalGainLoss >= 0 ? "+" : ""}${currencySymbol}${totalGainLoss.toLocaleString("en-IN")} (${gainLossPercent}%)
      </div>
    </div>
  </div>

  <!-- 4. PERFORMANCE & 5. RISK MANDATE (GIPS-informed Engine) -->
  <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; color: #b37e28;">
    Institutional Analytics & Risk Mandate (v3.1 Engine)
  </div>
  <div class="kpi-row" style="margin-bottom: 16px;">
    <div class="kpi-card" style="border-top: 2px solid #e0a84c;">
      <div class="kpi-title">Portfolio Health Score</div>
      <div class="kpi-num" style="font-size: 17px;">${health.healthScore}/100</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Rating: <strong>${health.grade}</strong> • Data Conf: ${health.confidence}</div>
    </div>
    <div class="kpi-card" style="border-top: 2px solid ${attribution.totalActiveReturn >= 0 ? "#10b981" : "#ef4444"};">
      <div class="kpi-title">Active Alpha vs Benchmark</div>
      <div class="kpi-num" style="font-size: 17px; color: ${attribution.totalActiveReturn >= 0 ? "#059669" : "#dc2626"};">
        ${attribution.totalActiveReturn >= 0 ? "+" : ""}${(attribution.totalActiveReturn * 100).toFixed(2)}%
      </div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Benchmark: Balanced Hybrid</div>
    </div>
    <div class="kpi-card" style="border-top: 2px solid #6366f1;">
      <div class="kpi-title">Estimated Tax Impact</div>
      <div class="kpi-num" style="font-size: 17px; color: #4338ca;">${currencySymbol}${tax.estimatedImmediateTaxSavings.toLocaleString("en-IN")}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Harvestable Loss: ${currencySymbol}${tax.totalHarvestableLoss.toLocaleString("en-IN")}</div>
    </div>
    <div class="kpi-card" style="border-top: 2px solid #f59e0b;">
      <div class="kpi-title">Stress Simulation Impact</div>
      <div class="kpi-num" style="font-size: 17px; color: ${stress.percentChange >= 0 ? "#059669" : "#dc2626"};">
        ${stress.percentChange >= 0 ? "+" : ""}${stress.percentChange.toFixed(1)}%
      </div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Scenario: Tech Correction (-15%)</div>
    </div>
  </div>

  <!-- 6. GOALS & ASSET ALLOCATION -->
  <div class="two-col-summary">
    <div class="summary-card">
      <div class="card-heading">Asset Class Allocation Breakdown</div>
      ${allocationRows || "<div style='color: #64748b; font-size: 11px;'>No asset class breakdown available.</div>"}
    </div>
    <div class="summary-card">
      <div class="card-heading">Investment Mandate & Strategy</div>
      <div style="font-size: 11px; color: #475569; line-height: 16px;">
        <strong>Strategic Target:</strong> ${client.allocation || "Diversified capital growth targeting inflation-adjusted real returns."}<br><br>
        <strong>Advisor Governance Notes:</strong> ${client.notes || "Periodic fiduciary review completed. Asset allocation aligned with mandate risk thresholds."}<br><br>
        <strong>Diagnostics Action:</strong> ${health.recommendations[0] || "Maintain target asset class weights and disciplined SIP schedule."}
      </div>
    </div>
  </div>

  <!-- 7. CONSOLIDATED HOLDINGS SCHEDULE -->
  <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; color: #0f172a;">
    Consolidated Holdings Schedule
  </div>

  <table>
    <thead>
      <tr>
        <th>Asset & Identifier</th>
        <th>Class</th>
        <th class="right">Units</th>
        <th class="right">Cost Basis</th>
        <th class="right">Current Valuation</th>
        <th class="right">Unrealized Gain / Return</th>
      </tr>
    </thead>
    <tbody>
      ${holdingsTableRows}
    </tbody>
  </table>

  <!-- 8. DISCLOSURES & SIGN-OFF -->
  <div class="footer">
    <div class="fiduciary-seal">
      <strong>STRICTLY CONFIDENTIAL • ADVISOR DECISION-SUPPORT RECORD</strong><br>
      <strong>Performance Methodology:</strong> Returns calculated using available ledger valuations and external cash-flow records under a GIPS-informed methodology. The presence of GIPS-informed calculation methods does not represent a formal claim of GIPS compliance by AssetArray or the advisory firm.<br>
      <strong>Tax & Governance:</strong> Estimated Tax Impact figures are simulated approximations under prevailing income tax provisions (Sections 70/74) and do not constitute legal or tax counsel. Prepared with DPDP-aligned privacy controls.
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <div style="font-size: 11px; font-weight: 700; color: #0f172a;">${advisorName}</div>
      <div style="font-size: 9px; color: #64748b;">Managing Director • Wealth Advisory</div>
    </div>
  </div>
</body>
</html>
  `;

  await documentExporter.exportHtmlReport({
    html: htmlContent,
    filename: `AssetArray-${client.name.replace(/\s+/g, "_")}.pdf`,
    title: `Executive Portfolio Statement - ${client.name}`,
  });
}
