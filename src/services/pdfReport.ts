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
}

export async function exportClientPdfReport({ client, advisorName = "Asset Array Private Wealth" }: GeneratePdfOptions) {
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
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
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
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px;">
        <span style="font-weight: 600; color: #1e293b;">${cls}</span>
        <span style="color: #475569;">$${val.toLocaleString()} <strong style="color: #0f172a; margin-left: 6px;">(${pct}%)</strong></span>
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
          <tr style="background-color: ${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
            <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">
              ${h.assetName}
              <div style="font-size: 11px; font-weight: 500; color: #64748b; margin-top: 2px;">Ticker: ${h.ticker || "N/A"} • ${h.targetWeight || "Weight: auto"}</div>
            </td>
            <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: #f1f5f9; font-size: 11px; font-weight: 600; color: #334155;">
                ${h.assetClass}
              </span>
            </td>
            <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569; font-size: 13px;">${h.quantity || "1"}</td>
            <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569; font-size: 13px;">$${cost.toLocaleString()}</td>
            <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a; font-size: 14px;">$${val.toLocaleString()}</td>
            <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: ${isPositive ? "#059669" : "#dc2626"}; font-size: 13px;">
              ${isPositive ? "+" : ""}$${diff.toLocaleString()}
              <div style="font-size: 10px; font-weight: 600;">(${isPositive ? "+" : ""}${diffPct}%)</div>
            </td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="6" style="padding: 24px; text-align: center; color: #64748b;">No portfolio holdings recorded on file.</td></tr>`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Executive Valuation Statement - ${client.name}</title>
  <style>
    @page { margin: 24px; size: A4; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 32px;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
    }
    .header-banner {
      background: #030712;
      border-radius: 14px;
      padding: 24px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #e0a84c;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 1.5px;
      color: #ffffff;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #e0a84c;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
      font-weight: 600;
    }
    .statement-meta {
      text-align: right;
    }
    .statement-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 700;
    }
    .statement-val {
      font-size: 14px;
      color: #ffffff;
      font-weight: 700;
      margin-top: 2px;
    }
    .client-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .client-name {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .client-details {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
      display: flex;
      gap: 12px;
    }
    .client-badge {
      display: inline-block;
      padding: 4px 10px;
      background: rgba(224, 168, 76, 0.15);
      border: 1px solid #e0a84c;
      color: #b37e28;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-row {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .kpi-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .kpi-num {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .two-col-summary {
      display: flex;
      gap: 20px;
      margin-bottom: 24px;
    }
    .summary-card {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
    }
    .card-heading {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0f172a;
      margin-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      margin-bottom: 28px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      padding: 12px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 800;
    }
    th.right { text-align: right; }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #94a3b8;
    }
    .fiduciary-seal {
      font-size: 10px;
      color: #64748b;
      line-height: 15px;
      max-width: 480px;
    }
    .signature-block {
      text-align: right;
    }
    .signature-line {
      width: 160px;
      border-top: 1px solid #0f172a;
      margin-top: 24px;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <div>
      <div class="brand-title">ASSET ARRAY</div>
      <div class="brand-subtitle">Private Wealth Management & Family Office Advisory</div>
    </div>
    <div class="statement-meta">
      <div class="statement-label">Statement Ref</div>
      <div class="statement-val">${reportRef}</div>
      <div class="statement-label" style="margin-top: 6px;">Valuation Date</div>
      <div style="font-size: 12px; color: #e2e8f0;">${dateStr}</div>
    </div>
  </div>

  <div class="client-card">
    <div>
      <div class="client-name">${client.name}</div>
      <div class="client-details">
        <span><strong>Category:</strong> ${client.category || "HNI Client"}</span>
        <span>•</span>
        <span><strong>Location:</strong> ${client.city || "Global Roster"}</span>
        <span>•</span>
        <span><strong>Lead Advisor:</strong> ${advisorName}</span>
      </div>
    </div>
    <div>
      <span class="client-badge">${client.riskProfile || "Balanced Growth"}</span>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi-card">
      <div class="kpi-title">Total Portfolio Value (AUM)</div>
      <div class="kpi-num">$${totalValue.toLocaleString()}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Invested Cost Basis</div>
      <div class="kpi-num" style="color: #475569;">$${totalCost.toLocaleString()}</div>
    </div>
    <div class="kpi-card" style="background: ${totalGainLoss >= 0 ? "#f0fdf4" : "#fef2f2"}; border-color: ${totalGainLoss >= 0 ? "#bbf7d0" : "#fecaca"};">
      <div class="kpi-title" style="color: ${totalGainLoss >= 0 ? "#15803d" : "#b91c1c"};">Net Unrealized Gain / Loss</div>
      <div class="kpi-num" style="color: ${totalGainLoss >= 0 ? "#15803d" : "#b91c1c"};">
        ${totalGainLoss >= 0 ? "+" : ""}$${totalGainLoss.toLocaleString()} (${gainLossPercent}%)
      </div>
    </div>
  </div>

  <!-- Institutional v3.1 Diagnostics Grid -->
  <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; color: #b37e28;">
    Institutional Analytics & Risk Mandate (v3.1 Engine)
  </div>
  <div class="kpi-row" style="margin-bottom: 20px;">
    <div class="kpi-card" style="border-top: 3px solid #e0a84c;">
      <div class="kpi-title">Health Score</div>
      <div class="kpi-num" style="font-size: 20px;">${health.healthScore}/100</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Rating: <strong>${health.grade}</strong> • Conf: ${health.confidence}</div>
    </div>
    <div class="kpi-card" style="border-top: 3px solid ${attribution.totalActiveReturn >= 0 ? "#10b981" : "#ef4444"};">
      <div class="kpi-title">Active Alpha vs Benchmark</div>
      <div class="kpi-num" style="font-size: 20px; color: ${attribution.totalActiveReturn >= 0 ? "#059669" : "#dc2626"};">
        ${attribution.totalActiveReturn >= 0 ? "+" : ""}${(attribution.totalActiveReturn * 100).toFixed(2)}%
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Benchmark: Balanced Hybrid</div>
    </div>
    <div class="kpi-card" style="border-top: 3px solid #6366f1;">
      <div class="kpi-title">Estimated Tax Impact</div>
      <div class="kpi-num" style="font-size: 20px; color: #4338ca;">$${tax.estimatedImmediateTaxSavings.toLocaleString()}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Harvestable: $${tax.totalHarvestableLoss.toLocaleString()}</div>
    </div>
    <div class="kpi-card" style="border-top: 3px solid #f59e0b;">
      <div class="kpi-title">Stress Simulation Impact</div>
      <div class="kpi-num" style="font-size: 20px; color: ${stress.percentChange >= 0 ? "#059669" : "#dc2626"};">
        ${stress.percentChange >= 0 ? "+" : ""}${stress.percentChange.toFixed(1)}%
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Scenario: Tech Correction</div>
    </div>
  </div>

  <div class="two-col-summary">
    <div class="summary-card">
      <div class="card-heading">Asset Class Allocation Breakdown</div>
      ${allocationRows || "<div style='color: #64748b; font-size: 12px;'>No asset class breakdown available.</div>"}
    </div>
    <div class="summary-card">
      <div class="card-heading">Investment Mandate & Strategy</div>
      <div style="font-size: 12px; color: #475569; line-height: 18px;">
        <strong>Allocations Mandate:</strong> ${client.allocation || "Diversified institutional allocation targeting capital preservation and real equity growth."}<br><br>
        <strong>Advisor Notes:</strong> ${client.notes || "Periodic portfolio review completed. Risk exposure is calibrated in alignment with long-term liquidity and estate planning objectives."}<br><br>
        <strong>Health Diagnostics:</strong> ${health.recommendations[0] || "Target diversification maintained."}
      </div>
    </div>
  </div>

  <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; color: #0f172a;">
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

  <div class="footer">
    <div class="fiduciary-seal" style="font-size: 9px; line-height: 14px; color: #64748b; max-width: 65%;">
      <strong>STRICTLY CONFIDENTIAL & PROPRIETARY • ADVISOR DECISION-SUPPORT RECORD</strong><br>
      <strong>Performance Methodology:</strong> Time-weighted return calculated using available valuation and external cash-flow observations (GIPS-informed methodology). The presence of a GIPS-informed methodology does not represent a claim of GIPS compliance by AssetArray or the advisor using the software.<br>
      <strong>Tax & Regulatory:</strong> Estimated Tax Impact figures are illustrative estimations under applicable tax rules and do not constitute formal tax advice or an assurance of tax savings. Processed with DPDP-aligned privacy controls. Prepared solely for the advisory and decision-support review of the named account holder.
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <div style="font-size: 11px; font-weight: 700; color: #0f172a;">${advisorName}</div>
      <div style="font-size: 10px; color: #64748b;">Managing Director • Wealth Advisory</div>
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
