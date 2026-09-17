import { ReportRenderer } from '../src/services/v4/reporting/reportRenderer';
import { ReportGenerator } from '../src/services/v4/reporting/reportGenerator';
import { ReportSnapshot } from '../src/types/v4/reporting';

describe('V4 Phase 5 — Report Grounding & Multi-Currency Formatting', () => {
  test('Formats INR values properly into Cr, L, and standard thousands', () => {
    expect(ReportRenderer.formatCurrency(1250000000, 'INR')).toBe('₹125.00 Cr');
    expect(ReportRenderer.formatCurrency(4500000, 'INR')).toBe('₹45.00 L');
    expect(ReportRenderer.formatCurrency(99999, 'INR')).toBe('₹99,999');
    expect(ReportRenderer.formatCurrency(-250000, 'INR')).toBe('-₹2.50 L');
  });

  test('Formats USD, EUR, and GBP accurately', () => {
    expect(ReportRenderer.formatCurrency(5000000, 'USD')).toBe('$5,000,000');
    expect(ReportRenderer.formatCurrency(250000, 'EUR')).toBe('€250,000');
    expect(ReportRenderer.formatCurrency(100000, 'GBP')).toBe('£100,000');
  });

  test('Renders clean HTML preview with metrics grid and tables', () => {
    const report: ReportSnapshot = ReportGenerator.generateSnapshot({
      tenantId: 'firm_1',
      clientId: 'client_1',
      reportType: 'CLIENT_REVIEW_REPORT',
      actorId: 'adv_1',
      currency: 'INR',
      clientData: { name: 'Sunil Gavaskar' },
      portfolioData: {
        totalAUM: 80000000,
        driftScore: 4.5,
        topHoldings: [{ symbol: 'TCS', name: 'Tata Consultancy Services', weightPct: 20, currentVal: 16000000 }]
      }
    });

    const html = ReportRenderer.renderToHtml(report);
    expect(html).toContain('CLIENT REVIEW REPORT — Sunil Gavaskar');
    expect(html).toContain('₹8.00 Cr');
    expect(html).toContain('Tata Consultancy Services');
    expect(html).toContain('Performance calculations are GIPS-aligned');
  });
});
