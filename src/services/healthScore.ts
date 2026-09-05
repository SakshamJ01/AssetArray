import {
  HealthScoreResult,
  PortfolioHolding,
} from "../types/wealth";
import {
  calculateInstitutionalHealthScore,
  InstitutionalHealthScoreResult,
} from "./health";

export * from "./health";

/**
 * Calculates a multi-pillar 0-100 Portfolio Health Diagnostic Score.
 * Backed by the institutional factor engine in src/services/health/
 */
export function calculateHealthScore(
  holdings: PortfolioHolding[],
  liabilitiesValue: number = 0,
  portfolioId: string = "default-portfolio"
): InstitutionalHealthScoreResult {
  return calculateInstitutionalHealthScore(
    holdings,
    liabilitiesValue,
    portfolioId
  );
}
