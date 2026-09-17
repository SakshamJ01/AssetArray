import { ReportSnapshot, ReportSection } from '../../../types/v4/reporting';

export class ReportRenderer {
  /**
   * Formats currency amounts according to currency locale and standard abbreviations.
   */
  public static formatCurrency(val: number, currency: string = 'INR'): string {
    if (isNaN(val) || val == null) return '—';

    if (currency === 'INR') {
      const abs = Math.abs(val);
      const sign = val < 0 ? '-' : '';
      if (abs >= 10000000) {
        return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
      }
      if (abs >= 100000) {
        return `${sign}₹${(abs / 100000).toFixed(2)} L`;
      }
      return `${sign}₹${abs.toLocaleString('en-IN')}`;
    }

    const symbolMap: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };
    const sym = symbolMap[currency] || `${currency} `;
    return `${sym}${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  /**
   * Renders a ReportSnapshot into clean, responsive HTML for web preview and PDF generation.
   */
  public static renderToHtml(report: ReportSnapshot): string {
    const formattedDate = report.asOf.split('T')[0];

    const sectionsHtml = report.sections
      .map((sec) => {
        let metricsHtml = '';
        if (sec.metrics && sec.metrics.length > 0) {
          metricsHtml = `
            <div class="metrics-grid">
              ${sec.metrics
                .map(
                  (m) => `
                <div class="metric-card">
                  <div class="metric-label">${this.escapeHtml(m.label)}</div>
                  <div class="metric-value">${typeof m.value === 'number' ? this.formatCurrency(m.value, m.unit || report.currency) : this.escapeHtml(String(m.value))}</div>
                </div>`
                )
                .join('')}
            </div>`;
        }

        let tablesHtml = '';
        if (sec.tables && sec.tables.length > 0) {
          tablesHtml = sec.tables
            .map(
              (tbl) => `
            <table class="report-table">
              <thead>
                <tr>
                  ${tbl.headers.map((h) => `<th>${this.escapeHtml(h)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${tbl.rows
                  .map(
                    (row) => `
                  <tr>
                    ${row.map((cell) => `<td>${this.escapeHtml(String(cell))}</td>`).join('')}
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>`
            )
            .join('');
        }

        return `
          <section class="report-section">
            <h2>${this.escapeHtml(sec.title)}</h2>
            <p class="section-summary">${this.escapeHtml(sec.summaryText)}</p>
            ${metricsHtml}
            ${tablesHtml}
          </section>`;
      })
      .join('');

    const disclosuresHtml = (report.fiduciaryDisclosures || [])
      .map((d) => `<li>${this.escapeHtml(d)}</li>`)
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(report.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 24px; max-width: 900px; margin: 0 auto; line-height: 1.5; }
    header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
    h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
    .report-meta { font-size: 13px; color: #64748b; }
    .report-section { margin-bottom: 32px; }
    h2 { font-size: 18px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 12px; }
    .section-summary { font-size: 14px; color: #334155; margin-bottom: 16px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
    .metric-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .metric-value { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    .report-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    .report-table th { background: #f1f5f9; text-align: left; padding: 8px 12px; border-bottom: 2px solid #cbd5e1; }
    .report-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    footer { border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 40px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <header>
    <h1>${this.escapeHtml(report.title)}</h1>
    <div class="report-meta">
      <span>As of: ${formattedDate}</span> | 
      <span>Status: ${report.status}</span> | 
      <span>Methodology: ${report.methodologyVersion}</span>
    </div>
  </header>
  <main>
    ${sectionsHtml}
  </main>
  <footer>
    <h3>Disclosures & Methodology</h3>
    <ul>
      ${disclosuresHtml}
    </ul>
  </footer>
</body>
</html>`;
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
