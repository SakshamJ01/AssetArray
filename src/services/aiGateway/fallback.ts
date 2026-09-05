/**
 * Institutional AI Fallback Engine
 * Generates verified, deterministic summaries strictly from local data when AI models are unavailable.
 * Strictly prohibits fabricating financial content, synthetic numbers, or fake holdings.
 */

import { AiTaskType, StreamContextPayload } from "./types";

export function generateDeterministicSummary(
  arg1: string | AiTaskType,
  arg2?: AiTaskType | StreamContextPayload,
  arg3?: StreamContextPayload
): string {
  let taskType: AiTaskType = "ADVISOR_BRIEF";
  let context: StreamContextPayload | undefined;

  const validTasks: AiTaskType[] = [
    "ADVISOR_BRIEF",
    "FAST_SUMMARY",
    "DEEP_RESEARCH",
    "DOCUMENT_EXTRACTION",
    "PORTFOLIO_EXPLANATION",
    "TAX_EXPLANATION",
  ];

  if (validTasks.includes(arg1 as AiTaskType)) {
    taskType = arg1 as AiTaskType;
    context = arg2 as StreamContextPayload;
  } else {
    taskType = (arg2 as AiTaskType) || "ADVISOR_BRIEF";
    context = arg3;
  }

  const parts: string[] = [];

  parts.push("⚠️ [AI Service Offline — Verified Local Advisory Summary]");
  parts.push("AI generation is temporarily unavailable. Verified portfolio records remain accessible below.\n");

  const client = context?.clientName || "Current Mandate";
  const aum =
    context?.totalAum != null
      ? `₹${context.totalAum.toLocaleString("en-IN")}`
      : "AUM data not entered";
  const health =
    context?.healthScore != null
      ? `${context.healthScore}/100`
      : "Health score uncomputed";
  const holdings =
    context?.topHoldings && context.topHoldings.length > 0
      ? context.topHoldings.join(", ")
      : "No holdings in portfolio";

  switch (taskType) {
    case "TAX_EXPLANATION":
      parts.push(`Client: ${client}`);
      parts.push(`Monitored Portfolio Value: ${aum}`);
      if (context?.taxLossAvailable != null && context.taxLossAvailable > 0) {
        parts.push(
          `Identified Capital Loss Candidates: $${context.taxLossAvailable.toLocaleString()}`
        );
        parts.push(
          `Statutory Reference: Under Section 70/74 (Finance Act 2024), STCL may offset STCG and LTCG. LTCL offsets LTCG exclusively.`
        );
      } else {
        parts.push(
          "Tax Loss Harvesting: No verified unrealized capital losses calculated for current holdings."
        );
      }
      parts.push(
        "Advisor Action: Confirm purchase dates on transaction slips to substantiate holding period classification."
      );
      break;

    case "PORTFOLIO_EXPLANATION":
      parts.push(`Client: ${client}`);
      parts.push(`Monitored AUM: ${aum}`);
      parts.push(`Diagnostic Health: ${health}`);
      parts.push(`Recorded Positions: ${holdings}`);
      parts.push(
        "Advisor Action: Review asset allocation against mandate target bands before next committee meeting."
      );
      break;

    case "ADVISOR_BRIEF":
    case "FAST_SUMMARY":
    default:
      parts.push(`Client: ${client}`);
      parts.push(`Portfolio Value: ${aum}`);
      parts.push(`Health Diagnostic: ${health}`);
      if (context?.criticalAlertsCount != null && context.criticalAlertsCount > 0) {
        parts.push(
          `Alerts Requiring Desk Review: ${context.criticalAlertsCount} critical item(s).`
        );
      } else {
        parts.push("Desk Status: Zero critical alerts pending.");
      }
      parts.push(
        "System Notice: Live model connection could not be established. Calculations shown are deterministic."
      );
      break;
  }

  return parts.join("\n");
}
