/**
 * Asset Array Institutional AI Context Engine
 * Compiles comprehensive, privacy-masked financial graphs for
 * LLM grounding, eliminating hallucination and context starvation.
 */

import { Client, Goal } from "../../types/wealth";

export interface FirmAnalyticsContext {
  totalInvested: number;
  totalCurrent: number;
  totalGainLoss: number;
  totalClientsTracked: number;
  allocation: Array<{ assetClass: string; currentValue: number; weight: number }>;
  topPerformers: Array<{ assetName: string; returnPct: number; current: number }>;
  laggards: Array<{ assetName: string; returnPct: number; current: number }>;
  clientSummaries: Array<{ clientName: string; current: number; holdings: number; category: string }>;
  riskFlags: string[];
}

export interface GroundedClientContext {
  id: string;
  name: string;
  category: string;
  priority: string;
  riskProfile: string;
  targetAllocation: string;
  totalInvested: number;
  totalCurrent: number;
  unrealizedGainLoss: number;
  returnPct: number;
  holdingsCount: number;
  holdings: Array<{
    name: string;
    assetClass: string;
    ticker: string;
    quantity: number;
    invested: number;
    current: number;
    weightPct: number;
    gainLoss: number;
    returnPct: number;
  }>;
  goals: Array<{
    title: string;
    type: string;
    targetAmount: number;
    currentAmount: number;
    targetYear: string;
    progressPct: number;
  }>;
  reminderDate?: string;
  isReminderDue: boolean;
  notesSummary?: string;
}

export interface GroundedFirmContext {
  totalAum: number;
  totalInvested: number;
  totalGainLoss: number;
  clientsCount: number;
  allocationBreakdown: Array<{ assetClass: string; value: number; weightPct: number }>;
  topClients: Array<{ name: string; aum: number; category: string }>;
  topConcentratedAssets: Array<{ assetName: string; returnPct: number; totalValue: number }>;
  dueFollowUpsCount: number;
  highPriorityClientsCount: number;
  systemRiskFlags: string[];
}

export class AiContextEngine {
  /**
   * Build comprehensive grounding context for a single client
   */
  public static buildClientContext(
    client: Client,
    allGoals: Goal[] = [],
    currency: string = "INR"
  ): GroundedClientContext {
    const portfolio = client.portfolio || [];
    
    let totalInvested = 0;
    let totalCurrent = 0;

    const parsedHoldings = portfolio.map((h) => {
      const invested = parseFloat(h.investedValue) || 0;
      const current = parseFloat(h.currentValue) || invested;
      const qty = parseFloat(h.quantity) || 1;
      const gainLoss = current - invested;
      const returnPct = invested > 0 ? (gainLoss / invested) * 100 : 0;

      totalInvested += invested;
      totalCurrent += current;

      return {
        name: h.assetName || "Unnamed Holding",
        assetClass: h.assetClass || "Stocks",
        ticker: h.ticker || h.assetName || "",
        quantity: qty,
        invested,
        current,
        weightPct: 0,
        gainLoss,
        returnPct: Number(returnPct.toFixed(1)),
      };
    });

    // Compute weights
    const holdings = parsedHoldings.map((h) => ({
      ...h,
      weightPct: totalCurrent > 0 ? Number(((h.current / totalCurrent) * 100).toFixed(1)) : 0,
    }));

    const unrealizedGainLoss = totalCurrent - totalInvested;
    const returnPct = totalInvested > 0 ? Number(((unrealizedGainLoss / totalInvested) * 100).toFixed(1)) : 0;

    // Filter linked goals (matching client name or unassigned goals)
    const clientGoals = allGoals
      .filter((g) => !g.title.includes(" - ") || g.title.toLowerCase().includes(client.name.toLowerCase()))
      .map((g) => {
        const target = parseFloat(g.targetAmount) || 0;
        const current = parseFloat(g.currentAmount) || 0;
        const progressPct = target > 0 ? Math.min(100, Number(((current / target) * 100).toFixed(1))) : 0;
        return {
          title: g.title,
          type: g.goalType,
          targetAmount: target,
          currentAmount: current,
          targetYear: g.targetYear,
          progressPct,
        };
      });

    const isReminderDue = Boolean(client.reminderDate && client.reminderDate <= new Date().toISOString().slice(0, 10));

    return {
      id: client.id,
      name: client.name,
      category: client.category || "Standard",
      priority: client.priority || "Normal",
      riskProfile: client.riskProfile || "Moderate",
      targetAllocation: client.allocation || "Standard Diversified",
      totalInvested,
      totalCurrent,
      unrealizedGainLoss,
      returnPct,
      holdingsCount: holdings.length,
      holdings,
      goals: clientGoals,
      reminderDate: client.reminderDate || undefined,
      isReminderDue,
      notesSummary: client.notes ? client.notes.trim() : undefined,
    };
  }

  /**
   * Build firm-wide macro context across all clients in the advisory desk
   */
  public static buildFirmContext(
    clients: Client[],
    firmAnalytics?: FirmAnalyticsContext | null,
    allGoals: Goal[] = []
  ): GroundedFirmContext {
    let totalInvested = 0;
    let totalCurrent = 0;
    let dueFollowUpsCount = 0;
    let highPriorityClientsCount = 0;

    const topClients = clients
      .map((c) => {
        const aum = (c.portfolio || []).reduce((sum, h) => sum + (parseFloat(h.currentValue) || 0), 0);
        const invested = (c.portfolio || []).reduce((sum, h) => sum + (parseFloat(h.investedValue) || 0), 0);
        totalCurrent += aum;
        totalInvested += invested;

        if (c.reminderDate && c.reminderDate <= new Date().toISOString().slice(0, 10)) {
          dueFollowUpsCount++;
        }
        if (c.priority === "High") {
          highPriorityClientsCount++;
        }

        return {
          name: c.name,
          aum,
          category: c.category || "Standard",
        };
      })
      .sort((a, b) => b.aum - a.aum)
      .slice(0, 6);

    const allocationBreakdown = firmAnalytics?.allocation?.map((a) => ({
      assetClass: a.assetClass,
      value: a.currentValue,
      weightPct: Number(a.weight.toFixed(1)),
    })) || [];

    const topConcentratedAssets = firmAnalytics?.topPerformers?.map((p) => ({
      assetName: p.assetName,
      returnPct: Number(p.returnPct.toFixed(1)),
      totalValue: p.current,
    })) || [];

    return {
      totalAum: totalCurrent,
      totalInvested,
      totalGainLoss: totalCurrent - totalInvested,
      clientsCount: clients.length,
      allocationBreakdown,
      topClients,
      topConcentratedAssets,
      dueFollowUpsCount,
      highPriorityClientsCount,
      systemRiskFlags: firmAnalytics?.riskFlags || [],
    };
  }

  /**
   * Generate clean Markdown context payload for LLM injection
   */
  public static formatContextForPrompt(
    clientContext?: GroundedClientContext | null,
    firmContext?: GroundedFirmContext | null,
    currency: string = "INR"
  ): string {
    const lines: string[] = [];

    if (clientContext) {
      lines.push("### ACTIVE CLIENT MANDATE");
      lines.push(`- **Client**: ${clientContext.name} (${clientContext.category} | Priority: ${clientContext.priority})`);
      lines.push(`- **Risk Mandate**: ${clientContext.riskProfile}`);
      lines.push(`- **Target Allocation Strategy**: ${clientContext.targetAllocation}`);
      lines.push(`- **Total Portfolio Valuation**: ${currency} ${clientContext.totalCurrent.toLocaleString("en-IN")}`);
      lines.push(`- **Cost Basis (Invested)**: ${currency} ${clientContext.totalInvested.toLocaleString("en-IN")}`);
      lines.push(`- **Unrealized P&L**: ${currency} ${clientContext.unrealizedGainLoss.toLocaleString("en-IN")} (${clientContext.returnPct >= 0 ? "+" : ""}${clientContext.returnPct}%)`);
      
      if (clientContext.isReminderDue) {
        lines.push(`- **ACTION REQUIRED**: Follow-up review is DUE NOW (Scheduled: ${clientContext.reminderDate})`);
      }
      if (clientContext.notesSummary) {
        lines.push(`- **Advisor Meeting Notes**: "${clientContext.notesSummary}"`);
      }

      lines.push("\n### ACTIVE PORTFOLIO HOLDINGS");
      if (clientContext.holdings.length === 0) {
        lines.push("*No positions currently recorded in this client portfolio.*");
      } else {
        lines.push("| Holding Name | Asset Class | Current Value | Invested Cost | Weight % | Gain/Loss | Return % |");
        lines.push("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |");
        for (const h of clientContext.holdings) {
          const tickerLabel = h.ticker && h.ticker !== h.name ? ` (${h.ticker})` : "";
          lines.push(
            `| ${h.name}${tickerLabel} | ${h.assetClass} | ${currency} ${h.current.toLocaleString("en-IN")} | ${currency} ${h.invested.toLocaleString("en-IN")} | ${h.weightPct}% | ${currency} ${h.gainLoss.toLocaleString("en-IN")} | ${h.returnPct >= 0 ? "+" : ""}${h.returnPct}% |`
          );
        }
      }

      if (clientContext.goals.length > 0) {
        lines.push("\n### CLIENT WEALTH GOALS");
        for (const g of clientContext.goals) {
          lines.push(`- **${g.title}** (${g.type}): Target ${currency} ${g.targetAmount.toLocaleString("en-IN")} by ${g.targetYear} | Funded: ${currency} ${g.currentAmount.toLocaleString("en-IN")} (${g.progressPct}%)`);
        }
      }
    } else if (firmContext) {
      lines.push("### ADVISORY PRACTICE / FIRM-WIDE OVERVIEW");
      lines.push(`- **Total Monitored AUM**: ${currency} ${firmContext.totalAum.toLocaleString("en-IN")}`);
      lines.push(`- **Total Clients Under Advisory**: ${firmContext.clientsCount}`);
      lines.push(`- **High Priority Mandates**: ${firmContext.highPriorityClientsCount}`);
      lines.push(`- **Follow-up Reviews Due Now**: ${firmContext.dueFollowUpsCount}`);

      if (firmContext.allocationBreakdown.length > 0) {
        lines.push("\n### FIRM ASSET ALLOCATION BREAKDOWN");
        for (const a of firmContext.allocationBreakdown) {
          lines.push(`- **${a.assetClass}**: ${currency} ${a.value.toLocaleString("en-IN")} (${a.weightPct}%)`);
        }
      }

      if (firmContext.topClients.length > 0) {
        lines.push("\n### TOP CLIENT PORTFOLIOS");
        for (const c of firmContext.topClients) {
          lines.push(`- **${c.name}** (${c.category}): ${currency} ${c.aum.toLocaleString("en-IN")}`);
        }
      }

      if (firmContext.systemRiskFlags.length > 0) {
        lines.push("\n### DETECTED RISK & ALLOCATION FLAGS");
        for (const f of firmContext.systemRiskFlags) {
          lines.push(`- ⚠️ ${f}`);
        }
      }
    }

    return lines.join("\n");
  }
}
