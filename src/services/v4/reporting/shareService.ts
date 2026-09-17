import { ReportShareToken } from '../../../types/v4/reporting';

export class ReportShareService {
  /**
   * Generates an ephemeral report share token with defined expiration (default: 72 hours).
   */
  public static generateShareToken(
    tenantId: string,
    reportId: string,
    clientId: string,
    expiresInHours: number = 72
  ): ReportShareToken {
    if (!tenantId || !reportId || !clientId) {
      throw new Error('Tenant, Report, and Client identifiers are required to generate a share token');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInHours * 3600 * 1000).toISOString();
    const token = `shr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      token,
      tenantId,
      reportId,
      clientId,
      createdAt: now.toISOString(),
      expiresAt,
      isRevoked: false,
      accessCount: 0
    };
  }

  /**
   * Validates a share token against expiration and revocation status.
   */
  public static validateToken(shareToken: ReportShareToken): { isValid: boolean; reason?: string } {
    if (shareToken.isRevoked || shareToken.revokedAt) {
      return { isValid: false, reason: 'Share token has been explicitly revoked' };
    }

    const now = new Date().getTime();
    const expiry = new Date(shareToken.expiresAt).getTime();

    if (now > expiry) {
      return { isValid: false, reason: 'Share token has expired' };
    }

    return { isValid: true };
  }

  /**
   * Revokes a share token immediately.
   */
  public static revokeToken(shareToken: ReportShareToken): ReportShareToken {
    return {
      ...shareToken,
      isRevoked: true,
      revokedAt: new Date().toISOString()
    };
  }
}
