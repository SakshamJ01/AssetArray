/**
 * Institutional AI Task Prompts & Schemas
 * Grounded prompts that prohibit hallucination, numerical fabrication, and pseudo-research.
 */

import { AiTaskType, StreamContextPayload } from "./types";

export function isConversationalGreeting(text: string): boolean {
  const clean = (text || "").trim().toLowerCase().replace(/[!?.,;]/g, "");
  const greetings = new Set([
    "hi", "hello", "hey", "hiya", "howdy", "good morning", "good afternoon",
    "good evening", "sup", "yo", "test", "who are you", "what can you do", "help",
    "thanks", "thank you", "ok", "okay"
  ]);
  return greetings.has(clean);
}

export function buildTaskPrompt(
  query: string,
  taskType: AiTaskType,
  context?: StreamContextPayload
): string {
  if (isConversationalGreeting(query)) {
    const scopeName = context?.clientName || "Entire Practice";
    return [
      "You are the AssetArray AI Wealth Copilot.",
      `The advisor said: "${query}".`,
      `Active Scope: ${scopeName}.`,
      "Respond warmly, crisply, and professionally in 1-2 short sentences. Acknowledge the greeting, confirm the active scope, and mention 2-3 specific things you can assist with (such as portfolio breakdown, tax-loss harvesting, rebalancing drift, or meeting notes). Do NOT output formal memorandum headers, dates, disclaimers, or compliance fact sheets.",
    ].join("\n");
  }

  const parts: string[] = [];

  parts.push("=== INSTITUTIONAL ADVISORY GOVERNANCE DIRECTIVE ===");
  parts.push("You are an institutional wealth management co-pilot assisting an investment committee.");
  parts.push("STRICT CONSTRAINTS:");
  parts.push("1. ONLY reference verified figures explicitly supplied in PORTFOLIO DATA or CLIENT MANDATE.");
  parts.push("2. If a specific metric, holding, or tax lot is not provided, state that it is unavailable.");
  parts.push("3. NEVER invent AUM, percentage returns, health scores, tax losses, or security holdings.");
  parts.push("4. Answer the user's specific inquiry directly and concisely in clean Markdown without unnecessary boilerplate headers, memorandum dates, or 'OBSERVED FACTS' sections.");
  parts.push("5. If the inquiry asks about a security, asset class, or holding NOT in VERIFIED PORTFOLIO DATA, explicitly refuse: 'There is no record of [requested asset] in this client\\'s verified portfolio.' Never invent holdings.");


  if (context) {
    parts.push("\n=== VERIFIED PORTFOLIO DATA ===");
    if (context.clientName) parts.push(`Client Name: ${context.clientName}`);
    if (context.riskProfile) parts.push(`Mandate Risk Profile: ${context.riskProfile}`);
    if (context.totalAum != null) {
      parts.push(`Total Verified AUM: $${context.totalAum.toLocaleString()}`);
    } else {
      parts.push("Total Verified AUM: [Data not supplied]");
    }
    if (context.healthScore != null) {
      parts.push(`Portfolio Health Score: ${context.healthScore}/100`);
    } else {
      parts.push("Portfolio Health Score: [Not calculated]");
    }
    if (context.criticalAlertsCount != null) {
      parts.push(`Open Critical Alerts: ${context.criticalAlertsCount}`);
    }
    if (context.taxLossAvailable != null) {
      parts.push(`Identified Capital Loss Harvest Potential: $${context.taxLossAvailable.toLocaleString()}`);
    } else {
      parts.push("Capital Loss Harvest Potential: [No verified losses calculated]");
    }
    if (context.topHoldings && context.topHoldings.length > 0) {
      parts.push(`Core Holdings: ${context.topHoldings.join(", ")}`);
    } else {
      parts.push("Core Holdings: [No holdings recorded]");
    }

    if (context.evidence) {
      parts.push("\n=== EVIDENCE BASIS ===");
      parts.push(JSON.stringify(context.evidence, null, 2));
    }

    if (context.macroContext) {
      parts.push("\n=== MACRO & REGULATORY CONTEXT ===");
      if (Array.isArray(context.macroContext)) {
        context.macroContext.forEach((m: string) => parts.push(`- ${m}`));
      } else {
        parts.push(context.macroContext);
      }
    }

    if (context.rawContextPrompt) {
      parts.push("\n=== VERIFIED GROUNDED CONTEXT (HOLDINGS, GOALS, DRIFT & TAX LOTS) ===");
      parts.push(context.rawContextPrompt);
    }
  }

  parts.push(`\n=== TASK: ${taskType} ===`);
  parts.push(`USER INQUIRY: ${query}`);

  return parts.join("\n");
}
