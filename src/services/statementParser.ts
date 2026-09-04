/**
 * 1-Click Statement & CSV Importer Engine
 * Parses institutional and retail broker statements (Zerodha, CAMS/KFintech, ICICI Direct, Morgan Stanley, Generic CSV)
 * Extracts holdings into normalized SimpleHolding records with asset-class resolution.
 */

import { SimpleHolding } from "./rebalancer";

export interface ParsedStatementResult {
  success: boolean;
  holdings: SimpleHolding[];
  totalValue: number;
  totalGainLoss: number;
  unmappedCount: number;
  errors: string[];
  detectedBroker?: string;
  sourceRowsCount: number;
}

/**
 * Standard templates for user demonstration
 */
export const SAMPLE_STATEMENTS = {
  zerodha: `Symbol,Instrument,Quantity,Avg Price,LTP,Current Value
RELIANCE,Reliance Industries Ltd,250,2350.00,2890.50,722625
TCS,Tata Consultancy Services,120,3200.00,3840.00,460800
HDFCBANK,HDFC Bank Limited,400,1450.00,1620.00,648000
INFY,Infosys Ltd,300,1380.00,1750.25,525075
GOLDBEES,Nippon India ETF Gold BeES,800,48.50,59.20,47360
ICICIBANK,ICICI Bank Ltd,350,850.00,1090.00,381500`,

  camsCas: `Scheme Name,Folio No,Units,Purchase NAV,Current NAV,Current Value
Mirae Asset Large Cap Fund,10293847,12500.50,68.40,94.20,1177547
Parag Parikh Flexi Cap Fund,99382711,18400.00,45.20,72.60,1335840
HDFC Corporate Bond Fund,88271920,45000.00,22.10,26.80,1206000
SBI Small Cap Fund,55192837,8200.00,98.50,142.10,1165220
Kotak Equity Arbitrage Fund,77281922,30000.00,28.40,32.10,963000`,

  familyOffice: `Asset Class,Security Name,Ticker,Shares,Cost Basis,Market Price,Total Value
Equities,Apple Inc,AAPL,500,145.00,198.50,99250
Equities,Microsoft Corp,MSFT,300,280.00,415.00,124500
Fixed Income,US Treasury 10Y Note,US10Y,100,980.00,995.00,99500
Commodities,SPDR Gold Shares,GLD,250,175.00,215.00,53750
Alternatives,Blackstone Private Equity,BXPE,1000,100.00,122.00,122000`,
};

/**
 * Heuristic to detect asset class based on name/ticker
 */
function inferAssetClass(name: string, symbol: string, explicitClass?: string): string {
  if (explicitClass) {
    const clean = explicitClass.trim().toLowerCase();
    if (clean.includes("eq") || clean.includes("stock") || clean.includes("share")) return "Equity";
    if (clean.includes("debt") || clean.includes("bond") || clean.includes("fixed") || clean.includes("treasury"))
      return "Fixed Income";
    if (clean.includes("gold") || clean.includes("silver") || clean.includes("commodity")) return "Commodities";
    if (clean.includes("mutual") || clean.includes("fund") || clean.includes("etf")) return "Mutual Fund";
    if (clean.includes("alt") || clean.includes("reit") || clean.includes("pe") || clean.includes("crypto"))
      return "Alternatives";
  }

  const combined = `${name} ${symbol}`.toLowerCase();
  if (combined.includes("gold") || combined.includes("silver") || combined.includes("bees")) return "Commodities";
  if (combined.includes("bond") || combined.includes("treasury") || combined.includes("gilt") || combined.includes("liquid"))
    return "Fixed Income";
  if (combined.includes("fund") || combined.includes("flexi") || combined.includes("index") || combined.includes("growth"))
    return "Mutual Fund";
  if (combined.includes("reit") || combined.includes("invit") || combined.includes("private equity"))
    return "Alternatives";

  return "Equity";
}

/**
 * Clean numeric values by removing commas, currency symbols, and spaces
 */
function cleanNumber(val: any): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).replace(/[^0-9.-]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse CSV string line by line handling quoted commas
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse Statement text (CSV or TSV) into validated SimpleHolding array
 */
export function parseStatement(csvContent: string): ParsedStatementResult {
  const errors: string[] = [];
  if (!csvContent || typeof csvContent !== "string" || csvContent.trim().length === 0) {
    return {
      success: false,
      holdings: [],
      totalValue: 0,
      totalGainLoss: 0,
      unmappedCount: 0,
      errors: ["Empty statement content provided."],
      sourceRowsCount: 0,
    };
  }

  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      success: false,
      holdings: [],
      totalValue: 0,
      totalGainLoss: 0,
      unmappedCount: 0,
      errors: ["Statement must contain a header row and at least one holding row."],
      sourceRowsCount: lines.length,
    };
  }

  // Parse header
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  // Find column indices
  let symbolIdx = headers.findIndex((h) => h === "symbol" || h === "ticker" || h === "isin" || h === "script");
  let nameIdx = headers.findIndex(
    (h) => h === "instrument" || h === "name" || h === "schemename" || h === "securityname" || h === "description"
  );
  let qtyIdx = headers.findIndex((h) => h === "quantity" || h === "qty" || h === "units" || h === "shares");
  let buyPriceIdx = headers.findIndex(
    (h) =>
      h === "avgprice" ||
      h === "buyprice" ||
      h === "averagecost" ||
      h === "purchasenav" ||
      h === "costbasis" ||
      h === "purchaseprice"
  );
  let currentPriceIdx = headers.findIndex(
    (h) =>
      h === "ltp" ||
      h === "currentprice" ||
      h === "lastprice" ||
      h === "currentnav" ||
      h === "marketprice" ||
      h === "nav"
  );
  let currentValueIdx = headers.findIndex(
    (h) => h === "currentvalue" || h === "marketvalue" || h === "totalvalue" || h === "value"
  );
  let assetClassIdx = headers.findIndex(
    (h) => h === "assetclass" || h === "type" || h === "category" || h === "segment"
  );

  // Auto-detect broker
  let detectedBroker = "Standard CSV";
  if (headers.includes("schemename") || headers.includes("foliono")) {
    detectedBroker = "CAMS / KFintech CAS";
  } else if (headers.includes("ltp") && headers.includes("instrument")) {
    detectedBroker = "Zerodha Kite";
  } else if (headers.includes("ticker") && headers.includes("costbasis")) {
    detectedBroker = "Institutional Custodian";
  }

  // Fallbacks if symbol or name missing
  if (symbolIdx === -1 && nameIdx !== -1) symbolIdx = nameIdx;
  if (nameIdx === -1 && symbolIdx !== -1) nameIdx = symbolIdx;

  if (symbolIdx === -1 || (qtyIdx === -1 && currentValueIdx === -1)) {
    return {
      success: false,
      holdings: [],
      totalValue: 0,
      totalGainLoss: 0,
      unmappedCount: lines.length - 1,
      errors: [
        `Could not identify required columns. Identified headers: ${headers.join(", ")}. Please include at least 'Symbol'/'Name' and 'Quantity' or 'Current Value'.`,
      ],
      detectedBroker,
      sourceRowsCount: lines.length - 1,
    };
  }

  const holdings: SimpleHolding[] = [];
  let unmappedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length === 0 || (row.length === 1 && row[0] === "")) continue;

    const rawSymbol = symbolIdx !== -1 ? row[symbolIdx] : "";
    const rawName = nameIdx !== -1 ? row[nameIdx] : rawSymbol;
    const explicitClass = assetClassIdx !== -1 ? row[assetClassIdx] : undefined;

    const symbol = (rawSymbol || rawName || `ASSET-${i}`).trim();
    const name = (rawName || rawSymbol || `Holding ${i}`).trim();

    const quantity = qtyIdx !== -1 ? cleanNumber(row[qtyIdx]) : 1;
    const buyPrice = buyPriceIdx !== -1 ? cleanNumber(row[buyPriceIdx]) : 0;
    let currentPrice = currentPriceIdx !== -1 ? cleanNumber(row[currentPriceIdx]) : 0;
    let currentValue = currentValueIdx !== -1 ? cleanNumber(row[currentValueIdx]) : 0;

    // Harmonize value vs price
    if (currentValue === 0 && currentPrice > 0 && quantity > 0) {
      currentValue = Math.round(currentPrice * quantity);
    } else if (currentPrice === 0 && currentValue > 0 && quantity > 0) {
      currentPrice = Math.round((currentValue / quantity) * 100) / 100;
    }

    if (currentValue <= 0) {
      unmappedCount++;
      continue;
    }

    const assetClass = inferAssetClass(name, symbol, explicitClass);

    const id = `imp-${i}-${symbol.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const investedValue =
      buyPrice > 0 && quantity > 0 ? Math.round(buyPrice * quantity) : currentValue;

    holdings.push({
      id,
      assetName: name,
      assetClass,
      currentValue,
      investedValue,
      quantity,
      symbol,
      ticker: symbol,
    });
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.investedValue, 0);
  const totalGainLoss = totalValue - totalInvested;

  return {
    success: holdings.length > 0,
    holdings,
    totalValue,
    totalGainLoss,
    unmappedCount,
    errors,
    detectedBroker,
    sourceRowsCount: lines.length - 1,
  };
}
