/**
 * AssetArray 4.0 — Cryptographic Source Fingerprinting (Idempotency Engine)
 * Generates deterministic hashes for source data payloads to prevent duplicate ingestion.
 */

import crypto from "crypto";

export function computeSourceFingerprint(
  tenantId: string,
  sourceType: string,
  rawContent: string | object
): string {
  const normalizedContent =
    typeof rawContent === "string"
      ? rawContent.trim()
      : JSON.stringify(rawContent);

  const hashInput = `${tenantId.trim()}::${sourceType.trim().toUpperCase()}::${normalizedContent}`;
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}
