import { ConnectedAccount, PortfolioHolding } from "../types/wealth";
import { normalizeCategory } from "./attribution";

export const NET_WORTH_METHODOLOGY_VERSION = "net-worth-unified-v1.1";

export interface AssetPosition {
  id: string;
  name: string;
  category: "Equities" | "Mutual Funds" | "Bonds" | "Cash & Bank" | "Real Estate" | "Gold & Alternatives";
  value: number;
  source: string;
  accountId?: string;
}

export interface LiabilityPosition {
  id: string;
  name: string;
  category: "Loan" | "Mortgage" | "Credit Card" | "Other Debt";
  value: number;
  interestRatePct?: number;
}

export interface InstitutionalNetWorthSnapshot {
  clientId: string;
  clientName?: string;
  asOfDate: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number; // totalAssets - totalLiabilities
  currency: string;
  breakdown: {
    equities: number;
    mutualFunds: number;
    bonds: number;
    cashAndBank: number;
    realEstate: number;
    alternativesAndGold: number;
    loans: number;
    mortgages: number;
    creditCards: number;
    otherLiabilities: number;
  };
  deduplicationAdjustments: {
    description: string;
    amount: number;
  }[];
  dataCompleteness: number; // 0 - 100%
  fxSource: string;
  methodologyVersion: string;
}

/**
 * Calculates unified institutional net worth while strictly preventing double-counting
 * between connected account balances and detailed security holdings.
 */
export function calculateUnifiedNetWorth(params: {
  clientId: string;
  clientName?: string;
  holdings?: PortfolioHolding[];
  connectedAccounts?: ConnectedAccount[];
  liabilities?: LiabilityPosition[];
  currency?: string;
  asOfDate?: string;
}): InstitutionalNetWorthSnapshot {
  const {
    clientId,
    clientName = "Client",
    holdings = [],
    connectedAccounts = [],
    liabilities = [],
    currency = "INR",
    asOfDate = new Date().toISOString(),
  } = params;

  let equities = 0;
  let mutualFunds = 0;
  let bonds = 0;
  let cashAndBank = 0;
  let realEstate = 0;
  let alternativesAndGold = 0;

  let totalHoldingsVal = 0;

  // 1. Process discrete portfolio holdings
  holdings.forEach((h) => {
    const val = Number(h.currentValue) || 0;
    totalHoldingsVal += val;
    const cat = normalizeCategory(h.assetClass);

    if (cat === "Stocks") equities += val;
    else if (cat === "Mutual Funds") mutualFunds += val;
    else if (cat === "Bonds") bonds += val;
    else if (cat === "Cash") cashAndBank += val;
    else if (cat === "Alternatives") {
      const name = (h.assetName || "").toLowerCase();
      if (name.includes("real estate") || name.includes("property")) {
        realEstate += val;
      } else {
        alternativesAndGold += val;
      }
    }
  });

  // 2. Clone liabilities to prevent mutating caller's arguments
  const activeLiabilities: LiabilityPosition[] = liabilities.map((l) => ({ ...l }));

  // 3. Process connected accounts with anti-double-counting logic
  // CRITICAL: If a connected account is a Broker/Investment account and we already have portfolio holdings,
  // we do NOT add the broker account total value again on top of the holdings!
  const deduplicationAdjustments: { description: string; amount: number }[] = [];

  connectedAccounts.forEach((acc) => {
    const accVal = parseFloat(acc.currentValue) || 0;
    if (accVal <= 0) return;

    if (acc.accountType === "Broker" || acc.accountType === "Retirement") {
      // If portfolio holdings already account for this asset base, suppress duplicate addition
      if (totalHoldingsVal > 0) {
        deduplicationAdjustments.push({
          description: `Suppressed duplicate inclusion of '${acc.institution} (${acc.accountType})' valued at ₹${accVal.toLocaleString("en-IN")} because holdings are already tracked individually.`,
          amount: accVal,
        });
      } else {
        // Holdings are empty; use account summary balance
        equities += accVal;
      }
    } else if (acc.accountType === "Bank") {
      // Bank deposit: add to liquid cash & bank
      cashAndBank += accVal;
    } else if (acc.accountType === "Card") {
      // Credit card balance: add to internal active liabilities without mutating caller
      activeLiabilities.push({
        id: acc.id,
        name: `${acc.institution} Credit Card`,
        category: "Credit Card",
        value: accVal,
      });
    }
  });

  // 4. Process liabilities from cloned array
  let loans = 0;
  let mortgages = 0;
  let creditCards = 0;
  let otherLiabilities = 0;

  activeLiabilities.forEach((l) => {
    const val = Math.max(0, l.value || 0);
    if (l.category === "Loan") loans += val;
    else if (l.category === "Mortgage") mortgages += val;
    else if (l.category === "Credit Card") creditCards += val;
    else otherLiabilities += val;
  });

  const totalAssets =
    equities + mutualFunds + bonds + cashAndBank + realEstate + alternativesAndGold;
  const totalLiabilities = loans + mortgages + creditCards + otherLiabilities;
  const netWorth = totalAssets - totalLiabilities;

  const dataCompleteness =
    holdings.length > 0 && connectedAccounts.length > 0
      ? 100
      : holdings.length > 0 || connectedAccounts.length > 0
      ? 80
      : 20;

  return {
    clientId,
    clientName,
    asOfDate,
    totalAssets: parseFloat(totalAssets.toFixed(2)),
    totalLiabilities: parseFloat(totalLiabilities.toFixed(2)),
    netWorth: parseFloat(netWorth.toFixed(2)),
    currency,
    breakdown: {
      equities: parseFloat(equities.toFixed(2)),
      mutualFunds: parseFloat(mutualFunds.toFixed(2)),
      bonds: parseFloat(bonds.toFixed(2)),
      cashAndBank: parseFloat(cashAndBank.toFixed(2)),
      realEstate: parseFloat(realEstate.toFixed(2)),
      alternativesAndGold: parseFloat(alternativesAndGold.toFixed(2)),
      loans: parseFloat(loans.toFixed(2)),
      mortgages: parseFloat(mortgages.toFixed(2)),
      creditCards: parseFloat(creditCards.toFixed(2)),
      otherLiabilities: parseFloat(otherLiabilities.toFixed(2)),
    },
    deduplicationAdjustments,
    dataCompleteness,
    fxSource: "Reserve Bank of India (RBI) Reference Rates",
    methodologyVersion: NET_WORTH_METHODOLOGY_VERSION,
  };
}
