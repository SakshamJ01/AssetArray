import {
  AdvisorAction,
  AdvisorActionPriority,
  PriorityScoreFactors,
} from "../../types/advisor";
import { Client, SmartAlertSeverity } from "../../types/wealth";

export interface PrioritizationInput {
  severity?: "critical" | "warning" | "info" | SmartAlertSeverity;
  clientCategory?: string; // HNI, Retail, etc.
  clientPriority?: "High" | "Medium" | "Low" | string;
  portfolioValue?: number;
  financialImpactValue?: number; // e.g. harvestable loss, drift pct, deficit
  financialImpactMetric?: "AUM" | "PERCENT" | "AMOUNT";
  dueDate?: string; // ISO date string
  asOfDate?: string;
  hasVerifiedData?: boolean;
  notes?: string;
}

export interface PrioritizationResult {
  score: number; // 0 - 100
  priority: AdvisorActionPriority;
  factors: PriorityScoreFactors;
}

/**
 * Deterministic, fully inspectable priority scoring engine for AssetArray V3.3.
 * Prioritizes actions based on:
 * Priority Score = (Severity * 0.30 + Financial Impact * 0.25 + Urgency * 0.20 + Client Importance * 0.15 + Data Confidence * 0.10) / 5 * 100
 *
 * All factors (1-5 scale) are inspectable and explainable in the UI.
 */
export function calculatePriorityScore(input: PrioritizationInput): PrioritizationResult {
  const asOf = input.asOfDate ? new Date(input.asOfDate) : new Date();
  const todayStr = asOf.toISOString().split("T")[0];

  // 1. Severity Factor (1 - 5)
  let severityFactor = 2;
  const sevLower = String(input.severity || "").toLowerCase();
  if (sevLower === "critical") {
    severityFactor = 5;
  } else if (sevLower === "warning") {
    severityFactor = 3;
  } else if (sevLower === "info") {
    severityFactor = 1;
  }

  // 2. Client Importance Factor (1 - 5)
  let clientImportanceFactor = 2;
  const cat = String(input.clientCategory || "").toUpperCase();
  const prio = String(input.clientPriority || "").toUpperCase();

  if (cat.includes("HNI") || cat.includes("FAMILY OFFICE") || prio === "HIGH") {
    clientImportanceFactor = 5;
  } else if (prio === "MEDIUM" || cat.includes("LONG TERM")) {
    clientImportanceFactor = 3;
  } else {
    clientImportanceFactor = 2;
  }

  // 3. Financial Impact Factor (1 - 5)
  let financialImpactFactor = 2;
  const val = input.financialImpactValue ?? input.portfolioValue ?? 0;
  const metric = input.financialImpactMetric || "AMOUNT";

  if (metric === "PERCENT") {
    if (val >= 20) financialImpactFactor = 5;
    else if (val >= 10) financialImpactFactor = 4;
    else if (val >= 5) financialImpactFactor = 3;
    else financialImpactFactor = 2;
  } else {
    // INR Amounts (AUM or Loss or Deficit)
    if (val >= 10000000) financialImpactFactor = 5; // >= 1 Crore
    else if (val >= 2500000) financialImpactFactor = 4; // >= 25 Lakh
    else if (val >= 500000) financialImpactFactor = 3; // >= 5 Lakh
    else if (val >= 100000) financialImpactFactor = 2; // >= 1 Lakh
    else financialImpactFactor = 1;
  }

  // 4. Urgency Factor (1 - 5)
  let urgencyFactor = 1;
  if (input.dueDate) {
    const dueStr = input.dueDate.split("T")[0];
    if (dueStr < todayStr) {
      urgencyFactor = 5; // Overdue
    } else if (dueStr === todayStr) {
      urgencyFactor = 4; // Due today
    } else {
      const diffDays = Math.ceil(
        (new Date(dueStr).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= 3) urgencyFactor = 3;
      else if (diffDays <= 7) urgencyFactor = 2;
      else urgencyFactor = 1;
    }
  }

  // 5. Data Confidence Factor (1 - 5)
  const dataConfidenceFactor = input.hasVerifiedData !== false ? 5 : 2;

  // Weighted Score (0 - 100)
  const weightedSum =
    severityFactor * 0.30 +
    financialImpactFactor * 0.25 +
    urgencyFactor * 0.20 +
    clientImportanceFactor * 0.15 +
    dataConfidenceFactor * 0.10;

  const score = Math.min(100, Math.max(10, Math.round((weightedSum / 5) * 100)));

  // Categorize into Priority Tier
  let priority: AdvisorActionPriority = "LOW";
  if (score >= 80 || severityFactor === 5) {
    priority = "URGENT";
  } else if (score >= 60) {
    priority = "HIGH";
  } else if (score >= 40) {
    priority = "MEDIUM";
  }

  const factorSummary = [
    `Severity: ${factorLabel(severityFactor)} (${severityFactor}/5)`,
    `Financial Impact: ${factorLabel(financialImpactFactor)} (${financialImpactFactor}/5)`,
    `Urgency: ${factorLabel(urgencyFactor)} (${urgencyFactor}/5)`,
    `Client Importance: ${factorLabel(clientImportanceFactor)} (${clientImportanceFactor}/5)`,
    `Data Confidence: ${factorLabel(dataConfidenceFactor)} (${dataConfidenceFactor}/5)`,
  ].join(" • ");

  return {
    score,
    priority,
    factors: {
      severity: severityFactor,
      clientImportance: clientImportanceFactor,
      financialImpact: financialImpactFactor,
      urgency: urgencyFactor,
      dataConfidence: dataConfidenceFactor,
      explanation: factorSummary,
    },
  };
}

function factorLabel(factor: number): string {
  switch (factor) {
    case 5:
      return "Critical / Very High";
    case 4:
      return "High";
    case 3:
      return "Moderate";
    case 2:
      return "Low";
    default:
      return "Minimal";
  }
}

/**
 * Sorts actions deterministically:
 * Primary: priorityScore descending
 * Secondary: dueAt ascending (earlier due dates first)
 * Tertiary: createdAt descending
 */
export function sortActionsByPriority(actions: AdvisorAction[]): AdvisorAction[] {
  return [...actions].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    if (a.dueAt && b.dueAt && a.dueAt !== b.dueAt) {
      return a.dueAt.localeCompare(b.dueAt);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}
