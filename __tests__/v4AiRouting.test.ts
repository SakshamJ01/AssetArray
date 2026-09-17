import { V4AiTaskRouter } from '../src/services/v4/ai/aiTaskRouter';
import { AiContextSnapshot, V4StreamState } from '../src/types/v4/ai';

describe('V4 Phase 4 — AI Task Router, Free-First Routing & Deterministic Fallback', () => {
  const snapshot: AiContextSnapshot = {
    snapshotId: 'ctx_routing_001',
    tenantId: 'firm_alpha',
    clientId: 'client_101',
    taskType: 'FAST_SUMMARY' as any,
    contextAsOf: new Date().toISOString(),
    version: 1,
    clientSnapshot: {
      name: 'Rohan Sharma'
    },
    portfolioSnapshot: {
      totalAUM: 35000000,
      currency: 'INR',
      healthScore: 78
    }
  };

  test('Builds structured prompt with institutional template versioning', () => {
    const prompt = V4AiTaskRouter.buildStructuredPrompt('Summarize portfolio health', snapshot);
    expect(prompt).toContain(V4AiTaskRouter.PROMPT_VERSION);
    expect(prompt).toContain('TRUSTED_STRUCTURED_CONTEXT');
    expect(prompt).toContain('35000000');
    expect(prompt).toContain('Rohan Sharma');
  });

  test('Falls back to deterministic rule engine when cloud/external models fail without throwing', async () => {
    const streamStates: V4StreamState[] = [];
    const result = await V4AiTaskRouter.executeTask({
      userQuery: 'Summarize portfolio status',
      snapshot,
      onStreamState: (state) => {
        streamStates.push(state);
      }
    });

    expect(result.rawText).toBeDefined();
    expect(result.rawText.length).toBeGreaterThan(0);
    expect(result.providerUsed).toBe('DETERMINISTIC_RULE_ENGINE');
    expect(result.isDeterministicFallback).toBe(true);
    expect(streamStates).toContain('COMPLETED');
  }, 20000);
});
