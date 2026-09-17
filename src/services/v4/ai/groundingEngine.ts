import {
  AiContextSnapshot,
  ClaimVerification,
  ClaimType,
  AiConfidence,
  EvidenceLink
} from '../../../types/v4/ai';
import { extractNumericClaims } from '../../aiGateway/grounding';

export interface GroundingResult {
  isFullyGrounded: boolean;
  confidence: AiConfidence;
  verifiedClaims: ClaimVerification[];
  unsupportedClaims: ClaimVerification[];
  evidenceLinks: EvidenceLink[];
  cleanedText: string;
  disclaimer: string;
}

export class V4GroundingEngine {
  /**
   * Grounds and verifies generated model output against the structured context snapshot.
   */
  public static verifyOutput(
    generatedText: string,
    snapshot: AiContextSnapshot,
    queriedAssets?: string[]
  ): GroundingResult {
    if (!generatedText || generatedText.trim().length === 0) {
      return {
        isFullyGrounded: true,
        confidence: 'INSUFFICIENT_EVIDENCE',
        verifiedClaims: [],
        unsupportedClaims: [],
        evidenceLinks: [],
        cleanedText: '',
        disclaimer: 'No content generated.'
      };
    }

    // 1. Negative Knowledge & Unheld Asset Verification
    if (queriedAssets && queriedAssets.length > 0) {
      const heldSymbols = (snapshot.portfolioSnapshot?.topHoldingsSummary || []).map((h) => h.symbol.toUpperCase());
      const unheld = queriedAssets.filter((a) => !heldSymbols.includes(a.toUpperCase()));

      if (unheld.length > 0 && heldSymbols.length > 0) {
        // Check if generated text hallucinates positions in unheld assets
        for (const sym of unheld) {
          const symRegex = new RegExp(`\\b${sym}\\b`, 'i');
          if (
            symRegex.test(generatedText) &&
            /\b(holds?|holding|position|shares?|owns?|allocation|invested)\b/i.test(generatedText)
          ) {
            return {
              isFullyGrounded: false,
              confidence: 'INSUFFICIENT_EVIDENCE',
              verifiedClaims: [],
              unsupportedClaims: [
                {
                  id: 'claim_unheld_asset',
                  claimText: `Referenced unheld asset: ${sym}`,
                  claimType: 'UNSUPPORTED',
                  confidence: 'INSUFFICIENT_EVIDENCE',
                  evidenceLinks: [],
                  isGrounded: false,
                  unsupportedReason: `Asset ${sym} is not held in client portfolio.`
                }
              ],
              evidenceLinks: [],
              cleanedText: `INSUFFICIENT EVIDENCE: Client portfolio does not hold ${sym}. No position-specific risk or valuation data is available.`,
              disclaimer: 'Notice: The queried asset is not held by the client.'
            };
          }
        }
      }
    }

    // 2. Numerical Claims Extraction & Context Matching
    const rawNumericClaims = extractNumericClaims(generatedText);
    const verifiedClaims: ClaimVerification[] = [];
    const unsupportedClaims: ClaimVerification[] = [];
    const evidenceLinks: EvidenceLink[] = [];

    // Collect all known numbers from snapshot
    const knownMetrics: { value: number; metric: string; sourceType: string; tolerance: number }[] = [];

    if (snapshot.portfolioSnapshot) {
      if (snapshot.portfolioSnapshot.totalAUM) {
        knownMetrics.push({
          value: snapshot.portfolioSnapshot.totalAUM,
          metric: 'Portfolio Total AUM',
          sourceType: 'PORTFOLIO_LEDGER',
          tolerance: 100
        });
        knownMetrics.push({
          value: snapshot.portfolioSnapshot.totalAUM / 10000000, // Cr
          metric: 'Portfolio Total AUM (Cr)',
          sourceType: 'PORTFOLIO_LEDGER',
          tolerance: 0.1
        });
        knownMetrics.push({
          value: snapshot.portfolioSnapshot.totalAUM / 100000, // L
          metric: 'Portfolio Total AUM (L)',
          sourceType: 'PORTFOLIO_LEDGER',
          tolerance: 0.1
        });
      }
      if (snapshot.portfolioSnapshot.healthScore != null) {
        knownMetrics.push({
          value: snapshot.portfolioSnapshot.healthScore,
          metric: 'Portfolio Health Score',
          sourceType: 'HEALTH_ENGINE',
          tolerance: 0.5
        });
      }
      if (snapshot.portfolioSnapshot.driftScore != null) {
        knownMetrics.push({
          value: snapshot.portfolioSnapshot.driftScore,
          metric: 'Allocation Drift Score',
          sourceType: 'REBALANCE_ENGINE',
          tolerance: 0.5
        });
      }
      if (snapshot.portfolioSnapshot.topHoldingsSummary) {
        for (const h of snapshot.portfolioSnapshot.topHoldingsSummary) {
          knownMetrics.push({
            value: h.weightPct,
            metric: `Holding Weight: ${h.symbol}`,
            sourceType: 'HOLDINGS_LEDGER',
            tolerance: 0.5
          });
          if (h.gainLossPct != null) {
            knownMetrics.push({
              value: h.gainLossPct,
              metric: `Gain/Loss %: ${h.symbol}`,
              sourceType: 'TAX_LOT_ENGINE',
              tolerance: 0.5
            });
          }
        }
      }
    }

    if (snapshot.riskSnapshot) {
      if (snapshot.riskSnapshot.riskScore != null) {
        knownMetrics.push({ value: snapshot.riskSnapshot.riskScore, metric: 'Risk Score', sourceType: 'RISK_ENGINE', tolerance: 0.5 });
      }
      if (snapshot.riskSnapshot.var95 != null) {
        knownMetrics.push({ value: snapshot.riskSnapshot.var95, metric: 'Value at Risk (95%)', sourceType: 'RISK_ENGINE', tolerance: 0.5 });
      }
      if (snapshot.riskSnapshot.beta != null) {
        knownMetrics.push({ value: snapshot.riskSnapshot.beta, metric: 'Portfolio Beta', sourceType: 'RISK_ENGINE', tolerance: 0.05 });
      }
    }

    if (snapshot.taxSnapshot) {
      if (snapshot.taxSnapshot.harvestableLosses != null) {
        knownMetrics.push({
          value: snapshot.taxSnapshot.harvestableLosses,
          metric: 'Harvestable Capital Losses',
          sourceType: 'TAX_HARVEST_ENGINE',
          tolerance: 100
        });
      }
    }

    for (const claim of rawNumericClaims) {
      const match = knownMetrics.find((km) => Math.abs(km.value - claim.value) <= km.tolerance);

      if (match) {
        const evLink: EvidenceLink = {
          sourceType: match.sourceType,
          sourceId: snapshot.snapshotId,
          metric: match.metric,
          value: claim.value,
          unit: claim.unit,
          asOf: snapshot.contextAsOf
        };
        evidenceLinks.push(evLink);

        verifiedClaims.push({
          id: claim.id,
          claimText: claim.claimText,
          claimType: 'VERIFIED_NUMERIC',
          confidence: 'HIGH',
          evidenceLinks: [evLink],
          isGrounded: true
        });
      } else {
        unsupportedClaims.push({
          id: claim.id,
          claimText: claim.claimText,
          claimType: 'UNSUPPORTED',
          confidence: 'LOW',
          evidenceLinks: [],
          isGrounded: false,
          unsupportedReason: `Value ${claim.rawMatched} not found in deterministic portfolio context`
        });
      }
    }

    const isFullyGrounded = unsupportedClaims.length === 0;
    let confidence: AiConfidence = 'HIGH';
    if (unsupportedClaims.length > 0) {
      confidence = unsupportedClaims.length > 2 ? 'LOW' : 'MEDIUM';
    }

    return {
      isFullyGrounded,
      confidence,
      verifiedClaims,
      unsupportedClaims,
      evidenceLinks,
      cleanedText: generatedText,
      disclaimer: isFullyGrounded
        ? 'All numerical claims verified against deterministic financial engines.'
        : `Notice: ${unsupportedClaims.length} numerical claim(s) could not be verified against portfolio records.`
    };
  }
}
