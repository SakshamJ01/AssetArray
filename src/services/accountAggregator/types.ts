/**
 * AssetArray 4.0 — Account Aggregator (AA) Integration Types
 * Conforms to RBI / Sahamati Account Aggregator Architecture & SEBI Consent Frameworks.
 */

import { SimpleHolding } from "../rebalancer";

export type AaConsentStatus = "REQUESTED" | "PENDING_OTP" | "ACTIVE" | "REVOKED" | "EXPIRED";

export type AaFipType =
  | "DEPOSIT"
  | "TERM_DEPOSIT"
  | "MUTUAL_FUNDS"
  | "EQUITIES"
  | "INSURANCE_POLICIES"
  | "BONDS"
  | "NPS";

export interface AaConsentHandle {
  consentId: string;
  clientRefToken: string; // Zero-PII identifier
  fiuId: string; // Financial Information User (AssetArray RIA entity)
  fipTypes: AaFipType[];
  purposeCode: string; // e.g. "101 - Wealth Advisory & Periodic Review"
  dateRange: {
    from: string;
    to: string;
  };
  frequency: "ONETIME" | "DAILY" | "MONTHLY";
  status: AaConsentStatus;
  requestedAt: number;
  approvedAt?: number;
  expiresAt: number;
}

export interface AaBankAccountSummary {
  bankName: string;
  accountType: "SAVINGS" | "CURRENT" | "FD";
  maskedAccountNumber: string;
  balance: number;
  currency: string;
}

export interface AaConsolidatedPortfolio {
  consentId: string;
  clientRefToken: string;
  totalNetWorth: number;
  holdings: SimpleHolding[];
  bankAccounts: AaBankAccountSummary[];
  dataFreshnessTimestamp: number;
  fipCount: number;
  signatureHash: string; // Cryptographic verification of data authenticity
}
