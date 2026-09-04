import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { ClientInput, PortfolioHoldingInput } from "./aiAdvisor";

export interface GeneratePdfOptions {
  client: ClientInput;
  advisorName?: string;
}

export async function exportClientPdfReport({ client, advisorName = "Asset Array Advisor" }: GeneratePdfOptions) {
  const holdings = client.portfolio || [];
  const totalValue = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const totalCost = holdings.reduce((sum, h) => sum + (Number(h.investedValue) || 0), 0);
  const totalGainLoss = totalValue - totalCost;
  const gainLossPercent = totalCost > 0 ? ((totalGainLoss / totalCost) * 100).toFixed(1) : "0";
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const holdingsTableRows = holdings.length > 0
    ? holdings.map((h, i) => {
        const val = Number(h.currentValue) || 0;
        const cost = Number(h.investedValue) || 0;
        const diff = val - cost;
        const isPositive = diff >= 0;
        return `
          <tr style="background-color: ${i % 2 === 0 ? "#f8fafc" : "#ffffff"};">
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${h.assetName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">${h.assetClass}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">${h.quantity || "1"}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a;">$${cost.toLocaleString()}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a;">$${val.toLocaleString()}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: ${isPositive ? "#10b981" : "#ef4444"};">
              ${isPositive ? "+" : ""}$${diff.toLocaleString()}
            </td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="6" style="padding: 16px; text-align: center; color: #64748b;">No portfolio holdings recorded.</td></tr>`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Portfolio Summary Report - ${client.name}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 32px; background: #ffffff; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 28px; }
    .brand { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; }
    .report-title { font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.8px; }
    .client-card { background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 28px; }
    .client-name { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    .client-meta { font-size: 14px; color: #475569; display: flex; gap: 16px; }
    .metrics-grid { display: flex; gap: 16px; margin-bottom: 32px; }
    .metric-box { flex: 1; background: #f1f5f9; border-radius: 12px; padding: 16px; border: 1px solid #cbd5e1; }
    .metric-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 6px; }
    .metric-value { font-size: 20px; font-weight: 800; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    th { background: #0f172a; color: #ffffff; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    th.right { text-align: right; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">ASSET ARRAY</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Private Client Wealth Advisory</div>
    </div>
    <div style="text-align: right;">
      <div class="report-title">Portfolio Valuation Report</div>
      <div style="font-size: 13px; color: #475569; margin-top: 4px;">Date: ${dateStr}</div>
    </div>
  </div>

  <div class="client-card">
    <div class="client-name">${client.name}</div>
    <div class="client-meta">
      <span><strong>Category:</strong> ${client.category}</span>
      <span>|</span>
      <span><strong>Priority:</strong> ${client.priority}</span>
      <span>|</span>
      <span><strong>Prepared By:</strong> ${advisorName}</span>
    </div>
  </div>

  <div class="metrics-grid">
    <div class="metric-box">
      <div class="metric-label">Total Portfolio Value</div>
      <div class="metric-value">$${totalValue.toLocaleString()}</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Invested Capital</div>
      <div class="metric-value">$${totalCost.toLocaleString()}</div>
    </div>
    <div class="metric-box" style="background: ${totalGainLoss >= 0 ? "#ecfdf5" : "#fef2f2"}; border-color: ${totalGainLoss >= 0 ? "#a7f3d0" : "#fecaca"};">
      <div class="metric-label" style="color: ${totalGainLoss >= 0 ? "#047857" : "#b91c1c"};">Total Return</div>
      <div class="metric-value" style="color: ${totalGainLoss >= 0 ? "#047857" : "#b91c1c"};">
        ${totalGainLoss >= 0 ? "+" : ""}$${totalGainLoss.toLocaleString()} (${gainLossPercent}%)
      </div>
    </div>
  </div>

  <h3 style="font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin-bottom: 12px;">Asset Allocation & Holdings</h3>
  <table>
    <thead>
      <tr>
        <th>Asset Name</th>
        <th>Class</th>
        <th>Qty</th>
        <th class="right">Invested</th>
        <th class="right">Current Value</th>
        <th class="right">Gain / Loss</th>
      </tr>
    </thead>
    <tbody>
      ${holdingsTableRows}
    </tbody>
  </table>

  <div class="footer">
    <div>Confidential - For Client Use Only</div>
    <div>Generated via Asset Array Workspace</div>
  </div>
</body>
</html>
  `.trim();

  // Print to PDF file
  const { uri } = await Print.printToFileAsync({
    html: htmlContent,
    base64: false,
  });

  // Share file if sharing is available
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      UTI: ".pdf",
      mimeType: "application/pdf",
      dialogTitle: `Share Portfolio Report for ${client.name}`,
    });
  }

  return uri;
}
