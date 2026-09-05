import { requestAiResearch, AiResearchResult } from "./secureSync";

export interface PortfolioHoldingInput {
  assetName: string;
  assetClass: string;
  ticker?: string;
  quantity?: string;
  investedValue?: string;
  currentValue?: string;
  targetWeight?: string;
}

export interface ClientInput {
  id: string;
  name: string;
  category: string;
  priority: string;
  city?: string;
  riskProfile?: string;
  allocation?: string;
  notes?: string;
  portfolio?: PortfolioHoldingInput[];
}

export interface PortfolioAnalysisOptions {
  endpoint: string;
  client: ClientInput;
  accessToken?: string | null;
  onUnauthorized?: () => Promise<string | null>;
}

export interface ClientAiRecommendation {
  analysis: AiResearchResult;
  whatsappDraft: string;
  emailDraft: string;
  rebalanceActions: string[];
}

export async function analyzeClientPortfolioWithAI({
  endpoint,
  client,
  accessToken,
  onUnauthorized,
}: PortfolioAnalysisOptions): Promise<ClientAiRecommendation> {
  const holdings = client.portfolio || [];
  const totalValue = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const totalCost = holdings.reduce((sum, h) => sum + (Number(h.investedValue) || 0), 0);
  const totalGainLoss = totalValue - totalCost;
  const gainLossPercent = totalCost > 0 ? ((totalGainLoss / totalCost) * 100).toFixed(1) : "0";

  const holdingsSummary = holdings.map(
    (h) => `- ${h.assetName} (${h.assetClass}): Value $${(Number(h.currentValue) || 0).toLocaleString()}, Cost $${(Number(h.investedValue) || 0).toLocaleString()}`
  ).join("\n");

  const query = `
Perform an advisor decision-support portfolio analysis for client:
- Client Name: ${client.name}
- Category: ${client.category} (Priority: ${client.priority})
- Risk Preference: ${client.notes?.toLowerCase().includes("conservative") ? "Conservative" : "Balanced/Growth"}
- Total Portfolio Value: $${totalValue.toLocaleString()} (Gain/Loss: ${gainLossPercent}%)

Holdings Breakdown:
${holdingsSummary || "No holdings entered yet."}

Provide an objective, non-guaranteed analysis including market observations, potential risk factors, asset allocation considerations, and suggested areas for advisor review. Clearly distinguish observed facts, model results, and suggested review points.
  `.trim();

  const aiResult = await requestAiResearch({
    endpoint,
    query,
    accessToken,
    onUnauthorized,
  });

  const whatsappDraft = `Hi ${client.name}, here is a quick market & portfolio update regarding your wealth strategy with Asset Array. Your portfolio total stands at $${totalValue.toLocaleString()}. Based on recent market trends (${aiResult.sentiment}), we recommend ${aiResult.opportunities[0] || "maintaining balanced allocation"}. Let me know if you would like to schedule a quick call!`;

  const emailDraft = `Subject: Portfolio Insight & Market Strategy Update - ${client.name}

Dear ${client.name},

I hope this message finds you well.

Below is your latest portfolio overview and tailored advisor analysis:

- Portfolio Value: $${totalValue.toLocaleString()} (${gainLossPercent}% overall return)
- Market Sentiment: ${aiResult.sentiment}
- Key Highlights: ${aiResult.summary}

Strategic Recommendations:
${aiResult.opportunities.map((o) => `• ${o}`).join("\n")}

Risk Considerations:
${aiResult.risks.map((r) => `• ${r}`).join("\n")}

Please let me know if you have any questions or if you'd like to adjust your risk target.

Best regards,
Your Asset Array Advisory Team`;

  return {
    analysis: aiResult,
    whatsappDraft,
    emailDraft,
    rebalanceActions: aiResult.opportunities,
  };
}
