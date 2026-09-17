import { V4ContextBuilder } from '../src/services/v4/ai/contextBuilder';
import { AiContextSnapshot } from '../src/types/v4/ai';

describe('V4 Phase 4 — Cross-Tenant & Cross-Client AI Isolation (Red Team)', () => {
  const firmA = 'firm_alpha';
  const firmB = 'firm_beta';

  const clientAData = {
    clientId: 'client_A',
    name: 'Alice Johnson',
    rawPortfolioData: { totalAUM: 50000000, topHoldingsSummary: [{ symbol: 'AAPL', weightPct: 30 }] }
  };

  const clientBData = {
    clientId: 'client_B',
    name: 'Bob Smith',
    rawPortfolioData: { totalAUM: 10000000, topHoldingsSummary: [{ symbol: 'GOOGL', weightPct: 40 }] }
  };

  test('Firm A AI Context contains zero Firm B data', () => {
    const snapshotFirmA = V4ContextBuilder.buildSnapshot({
      tenantId: firmA,
      taskType: 'PORTFOLIO_EXPLANATION',
      clientId: clientAData.clientId,
      rawClientData: { name: clientAData.name },
      rawPortfolioData: clientAData.rawPortfolioData
    });

    const snapshotFirmB = V4ContextBuilder.buildSnapshot({
      tenantId: firmB,
      taskType: 'PORTFOLIO_EXPLANATION',
      clientId: clientBData.clientId,
      rawClientData: { name: clientBData.name },
      rawPortfolioData: clientBData.rawPortfolioData
    });

    expect(snapshotFirmA.tenantId).toBe(firmA);
    expect(snapshotFirmB.tenantId).toBe(firmB);
    expect(JSON.stringify(snapshotFirmA)).not.toContain('Bob Smith');
    expect(JSON.stringify(snapshotFirmA)).not.toContain('GOOGL');
    expect(JSON.stringify(snapshotFirmB)).not.toContain('Alice Johnson');
    expect(JSON.stringify(snapshotFirmB)).not.toContain('AAPL');
  });

  test('Client A AI Context strictly isolates against Client B portfolio data', () => {
    const snapshotA = V4ContextBuilder.buildSnapshot({
      tenantId: firmA,
      taskType: 'ADVISOR_BRIEF',
      clientId: clientAData.clientId,
      rawClientData: { name: clientAData.name },
      rawPortfolioData: clientAData.rawPortfolioData
    });

    expect(snapshotA.clientId).toBe('client_A');
    expect(snapshotA.clientSnapshot?.name).toBe('Alice Johnson');
    expect(snapshotA.portfolioSnapshot?.totalAUM).toBe(50000000);
    expect(JSON.stringify(snapshotA)).not.toContain('client_B');
    expect(JSON.stringify(snapshotA)).not.toContain('Bob Smith');
  });
});
