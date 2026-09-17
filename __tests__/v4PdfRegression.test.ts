import { ReportRenderer } from '../src/services/v4/reporting/reportRenderer';
import { ReportGenerator } from '../src/services/v4/reporting/reportGenerator';
import { ReportSnapshot } from '../src/types/v4/reporting';

describe('V4 Phase 5 — PDF & Document Layout Regression Suite', () => {
  test('Handles extremely long client, household and security names without layout failure', () => {
    const longClientName = 'His Excellency Maharaja Dr. Vikramaditya Chandra Bhanu Singh of Devgarh (Family Trust Non-Discretionary Mandate)';
    const longSecurityName = 'Tata Consultancy Services Limited High Dividend Yield Growth Direct Plan Sub-Fund Series IV';

    const report: ReportSnapshot = ReportGenerator.generateSnapshot({
      tenantId: 'firm_alpha',
      clientId: 'client_royal_001',
      reportType: 'CLIENT_REVIEW_REPORT',
      actorId: 'adv_senior_1',
      clientData: { name: longClientName },
      portfolioData: {
        totalAUM: 1250000000, // ₹125 Cr
        driftScore: 1.8,
        topHoldings: [{ symbol: 'TCS', name: longSecurityName, weightPct: 40.0, currentVal: 500000000 }]
      }
    });

    const renderedHtml = ReportRenderer.renderToHtml(report);

    expect(renderedHtml).toContain(longClientName);
    expect(renderedHtml).toContain(longSecurityName);
    expect(renderedHtml).toContain('₹125.00 Cr');
    expect(renderedHtml).toContain('<!DOCTYPE html>');
  });

  test('Renders meeting follow-up pack with action items table', () => {
    const report: ReportSnapshot = ReportGenerator.generateSnapshot({
      tenantId: 'firm_alpha',
      clientId: 'client_101',
      reportType: 'MEETING_FOLLOW_UP_PACK',
      actorId: 'adv_1',
      meetingData: {
        meetingId: 'mtg_99',
        meetingTitle: 'Annual Family Review',
        date: '2026-09-17',
        participants: ['Advisor Rahul', 'Client Pooja', 'CPA Mehta'],
        summary: 'Completed quarterly mandate discussion and tax loss harvesting alignment.',
        decisions: ['Approve rebalancing proposal #44'],
        actionItems: [
          { taskTitle: 'Execute tax loss harvesting before quarter end', owner: 'Advisor Rahul', dueDate: '2026-09-30' },
          { taskTitle: 'Send updated trust deed copy', owner: 'Client Pooja', dueDate: '2026-10-15' }
        ]
      }
    });

    const renderedHtml = ReportRenderer.renderToHtml(report);
    expect(renderedHtml).toContain('Annual Family Review');
    expect(renderedHtml).toContain('Execute tax loss harvesting before quarter end');
    expect(renderedHtml).toContain('Client Pooja');
  });
});
