import { PortfolioHolding } from "../../../types/wealth";
import { FactorScoreResult } from "../types";

export function scoreGeographicAndCurrency(
  holdings: PortfolioHolding[],
  totalVal: number,
  weight = 0.15
): FactorScoreResult {
  if (totalVal <= 0 || holdings.length === 0) {
    return {
      factorId: "geographicExposure",
      name: "Geographic & Currency Exposure",
      score: 20,
      weight,
      inputs: { internationalWeight: 0, distinctCountries: 0 },
      explanation: "No geographic data available.",
      confidence: "INSUFFICIENT_DATA",
      recommendations: ["Add international or dollar-hedged assets."],
      evidence: [{ metric: "internationalExposure", value: "0%" }],
    };
  }

  let internationalVal = 0;
  const countries = new Set<string>();
  const currencies = new Set<string>();

  holdings.forEach((h) => {
    const val = Number(h.currentValue) || 0;
    const country = (h.country || "").trim().toUpperCase();
    const currency = (h.currency || "").trim().toUpperCase();
    const region = (h.region || "").trim().toUpperCase();
    const ticker = (h.ticker || "").toUpperCase();

    // Check explicit metadata first
    const isExplicitIntl =
      (country !== "" && country !== "IN" && country !== "INDIA") ||
      (currency !== "" && currency !== "INR") ||
      (region !== "" && region !== "DOMESTIC" && region !== "INDIA");

    // Fallback: check ticker / assetName if explicit metadata absent
    const isTickerIntl =
      ticker.includes(".O") ||
      ticker.includes("NASDAQ") ||
      ticker.includes("SPY") ||
      ticker.includes("QQQ") ||
      ticker.includes("VTI") ||
      (h.assetName || "").toLowerCase().includes("nasdaq") ||
      (h.assetName || "").toLowerCase().includes("s&p 500") ||
      (h.assetName || "").toLowerCase().includes("us equity") ||
      (h.assetName || "").toLowerCase().includes("global");

    if (isExplicitIntl || isTickerIntl) {
      internationalVal += val;
      countries.add(country || "Global/US");
      currencies.add(currency || "USD");
    } else {
      countries.add("India");
      currencies.add("INR");
    }
  });

  const intlWeight = internationalVal / totalVal;
  const intlPct = intlWeight * 100;

  // Institutional target for Indian/Global HNIs: 10% to 25% international exposure
  let score = 65; // Baseline domestic-only score
  if (intlPct >= 10 && intlPct <= 30) {
    score = 95; // Optimal global diversification
  } else if (intlPct > 0 && intlPct < 10) {
    score = 75 + Math.round(intlPct * 2);
  } else if (intlPct > 30 && intlPct <= 50) {
    score = 85;
  } else if (intlPct > 50) {
    score = 70; // Excessive currency volatility risk
  }

  const recommendations: string[] = [];
  if (intlWeight < 0.08) {
    recommendations.push(
      "Portfolio has negligible non-INR / international exposure. Allocate 10-15% into developed market funds (e.g. S&P 500, MSCI World) for currency hedging."
    );
  }

  return {
    factorId: "geographicExposure",
    name: "Geographic & Currency Exposure",
    score,
    weight,
    inputs: {
      internationalWeightPct: parseFloat(intlPct.toFixed(2)),
      countriesCount: countries.size,
      currenciesCount: currencies.size,
    },
    explanation:
      intlWeight >= 0.10
        ? `Well-calibrated geographic spread with ${intlPct.toFixed(1)}% invested across non-domestic assets.`
        : `Home-bias concentration: ${(100 - intlPct).toFixed(1)}% of capital remains tethered to domestic currency and sovereign risk.`,
    confidence: "HIGH",
    recommendations,
    evidence: [
      {
        metric: "internationalExposure",
        value: `${intlPct.toFixed(1)}%`,
        target: "10% - 25%",
        unit: "%",
      },
      { metric: "distinctCurrencies", value: currencies.size, target: ">= 2" },
    ],
  };
}
