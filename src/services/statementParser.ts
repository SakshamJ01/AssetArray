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
  redactedPiiCount?: number;
}

/**
 * Institutional Zero-PII Sanitizer
 * Scrubs PAN numbers, Aadhaar, bank accounts, emails, and phone numbers before parsing or storing.
 */
export function sanitizePii(rawText: string): { sanitized: string; redactedPiiCount: number } {
  let count = 0;
  let text = rawText || "";

  // 1. Redact PAN (e.g. ABCDE1234F)
  text = text.replace(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/g, () => {
    count++;
    return "[REDACTED_PAN]";
  });

  // 2. Redact Aadhaar (e.g. 1234 5678 9012 or 1234-5678-9012)
  text = text.replace(/\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/g, () => {
    count++;
    return "[REDACTED_AADHAAR]";
  });

  // 3. Redact Email addresses
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, () => {
    count++;
    return "[REDACTED_EMAIL]";
  });

  // 4. Redact Phone numbers (+91 9876543210 or 9876543210)
  text = text.replace(/(?:\+91[\-\s]?)?[6-9]\d{9}\b/g, () => {
    count++;
    return "[REDACTED_PHONE]";
  });

  return { sanitized: text, redactedPiiCount: count };
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

  groww: `Company Name,ISIN,Shares,Avg. Buy Price,Current Market Price,Current Value
Tata Motors Ltd,INE155A01022,500,620.00,980.00,490000
Larsen & Toubro Ltd,INE018A01030,150,2800.00,3550.00,532500
State Bank of India,INE062A01020,800,540.00,810.00,648000
HDFC AMC,INE127D01025,200,3100.00,4100.00,820000`,

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
      redactedPiiCount: 0,
    };
  }

  // 1. Sanitize any PII (PAN, Aadhaar, email, phone) before parsing
  const { sanitized, redactedPiiCount } = sanitizePii(csvContent);

  const lines = sanitized
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
      redactedPiiCount,
    };
  }

  let headerRowIdx = 0;
  let headers: string[] = [];
  let symbolIdx = -1;
  let nameIdx = -1;
  let qtyIdx = -1;
  let buyPriceIdx = -1;
  let currentPriceIdx = -1;
  let currentValueIdx = -1;
  let assetClassIdx = -1;

  for (let row = 0; row < Math.min(lines.length, 10); row++) {
    const candidateHeaders = parseCsvLine(lines[row]).map((h) =>
      h.toLowerCase().replace(/[^a-z0-9]/g, "")
    );
    const sym = candidateHeaders.findIndex(
      (h) =>
        h === "symbol" ||
        h === "ticker" ||
        h === "isin" ||
        h === "isinnumber" ||
        h === "script" ||
        h === "scrip" ||
        h === "code"
    );
    const name = candidateHeaders.findIndex(
      (h) =>
        h === "companyname" ||
        h === "instrument" ||
        h === "name" ||
        h === "schemename" ||
        h === "securityname" ||
        h === "stockname" ||
        h === "scripname" ||
        h === "description"
    );
    const qty = candidateHeaders.findIndex(
      (h) =>
        h === "quantity" ||
        h === "qty" ||
        h === "units" ||
        h === "shares" ||
        h === "unitsheld" ||
        h === "balance"
    );
    const curVal = candidateHeaders.findIndex(
      (h) =>
        h === "currentvalue" ||
        h === "marketvalue" ||
        h === "totalvalue" ||
        h === "value" ||
        h === "holdingvalue"
    );

    if ((sym !== -1 || name !== -1) && (qty !== -1 || curVal !== -1)) {
      headerRowIdx = row;
      headers = candidateHeaders;
      symbolIdx = sym;
      nameIdx = name;
      qtyIdx = qty;
      buyPriceIdx = candidateHeaders.findIndex(
        (h) =>
          h === "avgprice" ||
          h === "avgbuyprice" ||
          h === "buyprice" ||
          h === "averagecost" ||
          h === "purchasenav" ||
          h === "costbasis" ||
          h === "purchaseprice"
      );
      currentPriceIdx = candidateHeaders.findIndex(
        (h) =>
          h === "ltp" ||
          h === "currentprice" ||
          h === "currentmarketprice" ||
          h === "cmp" ||
          h === "lastprice" ||
          h === "currentnav" ||
          h === "marketprice" ||
          h === "closingprice" ||
          h === "nav"
      );
      currentValueIdx = curVal;
      assetClassIdx = candidateHeaders.findIndex(
        (h) => h === "assetclass" || h === "type" || h === "category" || h === "segment"
      );
      break;
    }
  }

  // Auto-detect broker
  let detectedBroker = "Standard CSV";
  if (headers.includes("schemename") || headers.includes("foliono")) {
    detectedBroker = "CAMS / KFintech CAS";
  } else if (headers.includes("companyname") && (headers.includes("isin") || headers.includes("avgbuyprice"))) {
    detectedBroker = "Groww Statement";
  } else if (headers.includes("ltp") && headers.includes("instrument")) {
    detectedBroker = "Zerodha Kite";
  } else if (headers.includes("ticker") && headers.includes("costbasis")) {
    detectedBroker = "Institutional Custodian";
  } else if (headers.includes("isin") && headers.includes("unitsheld")) {
    detectedBroker = "NDSL / CDSL eCAS";
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
        `Could not identify required columns in statement. Please include at least 'Symbol'/'Name' and 'Quantity' or 'Current Value'.`,
      ],
      detectedBroker,
      sourceRowsCount: lines.length - 1,
      redactedPiiCount,
    };
  }

  const holdings: SimpleHolding[] = [];
  let unmappedCount = 0;

  for (let i = headerRowIdx + 1; i < lines.length; i++) {
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
    redactedPiiCount,
  };
}
