/**
 * AssetArray 4.0 — Validation Engine
 * Explicitly validates canonical records. Detects anomalies and produces structured warnings/errors.
 * Does NOT silently repair financial data.
 */

import { CanonicalRecord, ValidationIssue } from "../../../types/v4/computation";

export interface ValidationReport {
  isValid: boolean;
  issues: ValidationIssue[];
}

export function validateCanonicalRecord(record: CanonicalRecord): ValidationReport {
  const issues: ValidationIssue[] = [];

  // 1. Quantity validation
  if (isNaN(record.quantity) || !isFinite(record.quantity)) {
    issues.push({
      code: "INVALID_QUANTITY_NAN",
      field: "quantity",
      message: "Quantity is NaN or Infinite.",
      severity: "ERROR",
      recordId: record.canonicalId,
    });
  } else if (record.quantity < 0) {
    issues.push({
      code: "NEGATIVE_QUANTITY",
      field: "quantity",
      message: `Negative quantity (${record.quantity}) detected without explicit shorting permission.`,
      severity: "ERROR",
      recordId: record.canonicalId,
    });
  }

  // 2. Price validation
  if (isNaN(record.price) || !isFinite(record.price)) {
    issues.push({
      code: "INVALID_PRICE_NAN",
      field: "price",
      message: "Price is NaN or Infinite.",
      severity: "ERROR",
      recordId: record.canonicalId,
    });
  } else if (record.price <= 0 && record.currentValue > 0) {
    issues.push({
      code: "ZERO_PRICE",
      field: "price",
      message: "Unit price is zero or negative while total current value is positive.",
      severity: "WARNING",
      recordId: record.canonicalId,
    });
  }

  // 3. Current value validation
  if (isNaN(record.currentValue) || !isFinite(record.currentValue)) {
    issues.push({
      code: "INVALID_VALUE_NAN",
      field: "currentValue",
      message: "Current value is NaN or Infinite.",
      severity: "ERROR",
      recordId: record.canonicalId,
    });
  }

  // 4. Missing security identity
  if (!record.symbol || record.symbol.startsWith("UNMAPPED-")) {
    issues.push({
      code: "MISSING_SECURITY_IDENTITY",
      field: "symbol",
      message: `Record ${record.canonicalId} lacks a recognized symbol or ISIN.`,
      severity: "ERROR",
      recordId: record.canonicalId,
    });
  }

  // 5. Currency validation
  if (!record.currency || record.currency.trim().length === 0) {
    issues.push({
      code: "MISSING_CURRENCY",
      field: "currency",
      message: "Currency code is missing.",
      severity: "ERROR",
      recordId: record.canonicalId,
    });
  }

  // 6. Date validation
  if (record.acquisitionDate) {
    const parsed = Date.parse(record.acquisitionDate);
    if (isNaN(parsed)) {
      issues.push({
        code: "MALFORMED_ACQUISITION_DATE",
        field: "acquisitionDate",
        message: `Acquisition date '${record.acquisitionDate}' is malformed or invalid.`,
        severity: "WARNING",
        recordId: record.canonicalId,
      });
    }
  }

  // 7. Cost/Value Inconsistency
  if (record.investedAmount < 0) {
    issues.push({
      code: "NEGATIVE_COST_BASIS",
      field: "investedAmount",
      message: `Negative invested amount (${record.investedAmount}).`,
      severity: "ERROR",
      recordId: record.canonicalId,
    });
  }

  const hasErrors = issues.some((i) => i.severity === "ERROR");

  return {
    isValid: !hasErrors,
    issues,
  };
}

export function validateBatch(records: CanonicalRecord[]): {
  accepted: CanonicalRecord[];
  rejected: CanonicalRecord[];
  allIssues: ValidationIssue[];
} {
  const accepted: CanonicalRecord[] = [];
  const rejected: CanonicalRecord[] = [];
  const allIssues: ValidationIssue[] = [];

  const seenSymbols = new Set<string>();

  records.forEach((record) => {
    const report = validateCanonicalRecord(record);

    // Duplicate position check
    if (seenSymbols.has(record.symbol)) {
      report.issues.push({
        code: "DUPLICATE_POSITION_IN_BATCH",
        field: "symbol",
        message: `Duplicate position for symbol '${record.symbol}' detected in the same batch.`,
        severity: "WARNING",
        recordId: record.canonicalId,
      });
    } else {
      seenSymbols.add(record.symbol);
    }

    allIssues.push(...report.issues);

    if (report.isValid) {
      accepted.push(record);
    } else {
      rejected.push(record);
    }
  });

  return { accepted, rejected, allIssues };
}
