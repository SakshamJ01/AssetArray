import { ReportShareService } from '../src/services/v4/reporting/shareService';

describe('V4 Phase 5 — Portal Security & Ephemeral Share Tokens', () => {
  const tenantId = 'firm_alpha';
  const reportId = 'rep_001';
  const clientId = 'client_101';

  test('Generates ephemeral share token with future expiration', () => {
    const tokenRecord = ReportShareService.generateShareToken(tenantId, reportId, clientId, 48);

    expect(tokenRecord.token).toBeDefined();
    expect(tokenRecord.token.startsWith('shr_')).toBe(true);
    expect(tokenRecord.isRevoked).toBe(false);

    const validation = ReportShareService.validateToken(tokenRecord);
    expect(validation.isValid).toBe(true);
  });

  test('Rejects expired share token', () => {
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    const expiredToken = {
      token: 'shr_expired',
      tenantId,
      reportId,
      clientId,
      createdAt: new Date(Date.now() - 7200 * 1000).toISOString(),
      expiresAt: pastDate,
      isRevoked: false,
      accessCount: 1
    };

    const validation = ReportShareService.validateToken(expiredToken);
    expect(validation.isValid).toBe(false);
    expect(validation.reason).toContain('expired');
  });

  test('Instant revocation immediately invalidates share token', () => {
    const activeToken = ReportShareService.generateShareToken(tenantId, reportId, clientId, 24);
    const revoked = ReportShareService.revokeToken(activeToken);

    expect(revoked.isRevoked).toBe(true);
    expect(revoked.revokedAt).toBeDefined();

    const validation = ReportShareService.validateToken(revoked);
    expect(validation.isValid).toBe(false);
    expect(validation.reason).toContain('revoked');
  });
});
