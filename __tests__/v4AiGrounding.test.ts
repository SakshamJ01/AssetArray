import { V4GroundingEngine } from '../src/services/v4/ai/groundingEngine';
import { AiContextSnapshot } from '../src/types/v4/ai';

describe('V4 Phase 4 — Numerical Grounding & Negative Knowledge Verification', () => {
  const snapshot: AiContextSnapshot = {
    snapshotId: 'ctx_grounding_001',
    tenantId: 'firm_alpha',
    clientId: 'client_101',
    taskType: 'PORTFOLIO_EXPLANATION',
    contextAsOf: new Date().toISOString(),
    version: 1,
    portfolioSnapshot: {
      totalAUM: 10000000,
      currency: 'INR',
      healthScore: 84,
      driftScore: 12.5,
      topHoldingsSummary: [
        { symbol: 'RELIANCE', weightPct: 25.0, gainLossPct: 15.2 },
        { symbol: 'HDFCBANK', weightPct: 20.0, gainLossPct: -3.4 }
      ]
    },
    riskSnapshot: {
      riskScore: 62,
      var95: 4.8,
      beta: 1.05
    },
    taxSnapshot: {
      harvestableLosses: 350000
    }
  };

  test('Validates verified numerical claims matching deterministic context', () => {
    const text = 'The portfolio holds a total AUM of ₹1 Cr (₹10,000,000) with a health score of 84. Reliance comprises 25% of the portfolio.';
    const result = V4GroundingEngine.verifyOutput(text, snapshot);

    expect(result.isFullyGrounded).toBe(true);
    expect(result.confidence).toBe('HIGH');
    expect(result.verifiedClaims.length).toBeGreaterThanOrEqual(2);
    expect(result.unsupportedClaims).toHaveLength(0);
    expect(result.evidenceLinks.length).toBeGreaterThanOrEqual(2);
  });

  test('Flags ungrounded / hallucinated numbers as UNSUPPORTED', () => {
    const hallucinatedText = 'The portfolio generated 45.8% return last month and has a Sharpe ratio of 3.9.';
    const result = V4GroundingEngine.verifyOutput(hallucinatedText, snapshot);

    expect(result.isFullyGrounded).toBe(false);
    expect(result.unsupportedClaims.length).toBeGreaterThanOrEqual(1);
    expect(result.disclaimer).toContain('Notice:');
  });

  test('Enforces Negative Knowledge: Detects unheld queried asset and refuses to hallucinate position', () => {
    const hallucinatedBitcoinText = 'The client owns 2.5 Bitcoin valued at $150,000, representing 15% crypto allocation.';
    const result = V4GroundingEngine.verifyOutput(hallucinatedBitcoinText, snapshot, ['BITCOIN', 'BTC']);

    expect(result.isFullyGrounded).toBe(false);
    expect(result.confidence).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.cleanedText).toContain('INSUFFICIENT EVIDENCE: Client portfolio does not hold BITCOIN');
  });
});
