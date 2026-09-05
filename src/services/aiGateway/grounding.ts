/**
 * Institutional AI Numerical Grounding & Prompt Injection Defense Engine
 * 
 * Ensures:
 * 1. Untrusted user/document inputs cannot execute prompt injections.
 * 2. Every numerical statement (₹, $, %, AUM, tax, risk) is validated against deterministic context.
 * 3. Ungrounded or fabricated numbers are flagged as UNVERIFIED.
 */

import { StreamContextPayload } from "./types";

export interface NumericClaim {
  id: string;
  claimText: string;
  rawMatched: string;
  value: number;
  unit: "INR" | "USD" | "PERCENT" | "POINTS" | "RAW";
  status: "VERIFIED" | "UNVERIFIED";
  matchedContextField?: string;
}

export interface GroundingValidationReport {
  isFullyGrounded: boolean;
  totalClaimsCount: number;
  verifiedClaimsCount: number;
  unverifiedClaimsCount: number;
  groundingPct: number;
  claims: NumericClaim[];
  disclaimer?: string;
}

// Regex to identify prompt injection attacks
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(all\s+)?(prior|previous|above)\s+prompts?/i,
  /system\s+override/i,
  /you\s+are\s+now\s+(an?\s+)?unrestricted/i,
  /print\s+(your\s+)?system\s+prompt/i,
  /reveal\s+(your\s+)?internal\s+rules/i,
  /bypass\s+(all\s+)?safeguards/i,
  /forget\s+(your\s+)?instructions/i,
];

/**
 * Sanitizes untrusted user inputs (notes, news, documents, descriptions)
 * to prevent prompt injection attacks.
 */
export function sanitizeUntrustedInput(input: string): {
  sanitizedText: string;
  injectionDetected: boolean;
  neutralizedPatterns: string[];
} {
  if (!input || typeof input !== "string") {
    return { sanitizedText: "", injectionDetected: false, neutralizedPatterns: [] };
  }

  let sanitized = input;
  const neutralized: string[] = [];
  let detected = false;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      detected = true;
      neutralized.push(pattern.source);
      sanitized = sanitized.replace(pattern, "[BLOCKED: POTENTIAL_PROMPT_INJECTION]");
    }
  }

  // Strip XML/HTML closing delimiters that could break prompt boundaries
  sanitized = sanitized
    .replace(/<\/?system>/gi, "[TAG_REMOVED]")
    .replace(/<\/?instruction>/gi, "[TAG_REMOVED]")
    .replace(/<\/?admin>/gi, "[TAG_REMOVED]");

  return {
    sanitizedText: `<untrusted_input sanitized="${detected ? "adversarial" : "clean"}">\n${sanitized.trim()}\n</untrusted_input>`,
    injectionDetected: detected,
    neutralizedPatterns: neutralized,
  };
}

/**
 * Extracts candidate numerical claims from text (₹, $, %, Cr, L, pts).
 */
export function extractNumericClaims(text: string): NumericClaim[] {
  if (!text || typeof text !== "string") return [];

  const claims: NumericClaim[] = [];
  // Matches: ₹12.4 Cr, ₹4.5 L, $10,000, 27.4%, 18.1 pts, -9.3%, +12.5%
  const regex = /(₹|\$)?\s*([+-]?\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s*(Cr|L|%|pts|points)?/gi;

  let match: RegExpExecArray | null;
  let counter = 1;

  while ((match = regex.exec(text)) !== null) {
    const rawMatched = match[0].trim();
    if (!rawMatched) continue;

    const prefix = match[1];
    const numStr = match[2]?.replace(/,/g, "");
    const suffix = match[3];

    let val = parseFloat(numStr);
    if (isNaN(val)) continue;

    // Normalize unit and magnitude
    let unit: "INR" | "USD" | "PERCENT" | "POINTS" | "RAW" = "RAW";
    if (prefix === "₹" || suffix === "Cr" || suffix === "L") {
      unit = "INR";
      if (suffix === "Cr") val *= 10000000;
      if (suffix === "L") val *= 100000;
    } else if (prefix === "$") {
      unit = "USD";
    } else if (suffix === "%") {
      unit = "PERCENT";
    } else if (suffix === "pts" || suffix === "points") {
      unit = "POINTS";
    }

    // Capture surrounding context sentence for traceability
    const startIdx = Math.max(0, match.index - 30);
    const endIdx = Math.min(text.length, match.index + rawMatched.length + 30);
    const claimSnippet = text.slice(startIdx, endIdx).trim();

    claims.push({
      id: `claim_${counter++}`,
      claimText: claimSnippet,
      rawMatched,
      value: val,
      unit,
      status: "UNVERIFIED",
    });
  }

  return claims;
}

/**
 * Validates extracted numerical claims against deterministic client/portfolio context.
 */
export function validateClaimsAgainstContext(
  claims: NumericClaim[],
  context?: StreamContextPayload
): GroundingValidationReport {
  if (claims.length === 0) {
    return {
      isFullyGrounded: true,
      totalClaimsCount: 0,
      verifiedClaimsCount: 0,
      unverifiedClaimsCount: 0,
      groundingPct: 100,
      claims: [],
    };
  }

  // Extract known context values
  const knownValues: { value: number; field: string; tolerance: number }[] = [];

  if (context) {
    if (context.totalAum != null) {
      knownValues.push({ value: context.totalAum, field: "portfolio.totalAum", tolerance: 100 });
      // In Cr & L
      knownValues.push({ value: context.totalAum / 10000000, field: "portfolio.totalAum_Cr", tolerance: 0.1 });
      knownValues.push({ value: context.totalAum / 100000, field: "portfolio.totalAum_L", tolerance: 0.1 });
    }
    if (context.healthScore != null) {
      knownValues.push({ value: context.healthScore, field: "portfolio.healthScore", tolerance: 0.5 });
    }
    if (context.criticalAlertsCount != null) {
      knownValues.push({ value: context.criticalAlertsCount, field: "portfolio.criticalAlertsCount", tolerance: 0.1 });
    }
    if (context.taxLossAvailable != null) {
      knownValues.push({ value: context.taxLossAvailable, field: "tax.taxLossAvailable", tolerance: 100 });
      knownValues.push({ value: context.taxLossAvailable / 100000, field: "tax.taxLossAvailable_L", tolerance: 0.1 });
    }
    if (context.evidence) {
      for (const [k, v] of Object.entries(context.evidence)) {
        if (typeof v === "number") {
          knownValues.push({ value: v, field: `evidence.${k}`, tolerance: 0.2 });
        }
      }
    }
  }

  let verifiedCount = 0;

  const validatedClaims = claims.map((claim) => {
    // Find match in known context
    const match = knownValues.find((kv) => {
      // Check absolute value match or percentage point match
      return Math.abs(kv.value - claim.value) <= kv.tolerance;
    });

    if (match) {
      verifiedCount++;
      return {
        ...claim,
        status: "VERIFIED" as const,
        matchedContextField: match.field,
      };
    }

    return {
      ...claim,
      status: "UNVERIFIED" as const,
    };
  });

  const unverifiedCount = claims.length - verifiedCount;
  const groundingPct = Math.round((verifiedCount / claims.length) * 100);

  return {
    isFullyGrounded: unverifiedCount === 0,
    totalClaimsCount: claims.length,
    verifiedClaimsCount: verifiedCount,
    unverifiedClaimsCount: unverifiedCount,
    groundingPct,
    claims: validatedClaims,
    disclaimer:
      unverifiedCount > 0
        ? `NOTICE: ${unverifiedCount} numerical statement(s) could not be verified against deterministically calculated portfolio records.`
        : undefined,
  };
}
