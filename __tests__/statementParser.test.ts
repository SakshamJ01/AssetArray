import { parseStatement, sanitizePii, SAMPLE_STATEMENTS } from "../src/services/statementParser";

describe("Statement Parser & Zero-PII Ingestion Engine", () => {
  it("should parse Zerodha Kite CSV holdings correctly", () => {
    const result = parseStatement(SAMPLE_STATEMENTS.zerodha);

    expect(result.success).toBe(true);
    expect(result.holdings.length).toBe(6);
    expect(result.detectedBroker).toBe("Zerodha Kite");
    expect(result.totalValue).toBeGreaterThan(2500000);

    const reliance = result.holdings.find((h) => h.symbol === "RELIANCE");
    expect(reliance).toBeDefined();
    expect(reliance?.assetName).toBe("Reliance Industries Ltd");
    expect(reliance?.currentValue).toBe(722625);
    expect(reliance?.assetClass).toBe("Equity");

    const gold = result.holdings.find((h) => h.symbol === "GOLDBEES");
    expect(gold?.assetClass).toBe("Commodities");
  });

  it("should parse Groww CSV statements correctly", () => {
    const result = parseStatement(SAMPLE_STATEMENTS.groww);

    expect(result.success).toBe(true);
    expect(result.holdings.length).toBe(4);
    expect(result.detectedBroker).toBe("Groww Statement");
    expect(result.totalValue).toBeGreaterThan(2000000);

    const sbi = result.holdings.find((h) => h.assetName.includes("State Bank of India"));
    expect(sbi).toBeDefined();
    expect(sbi?.currentValue).toBe(648000);
  });

  it("should parse CAMS / KFintech CAS statements correctly", () => {
    const result = parseStatement(SAMPLE_STATEMENTS.camsCas);

    expect(result.success).toBe(true);
    expect(result.holdings.length).toBe(5);
    expect(result.detectedBroker).toBe("CAMS / KFintech CAS");
    expect(result.totalValue).toBeGreaterThan(5000000);

    const paragParikh = result.holdings.find((h) =>
      h.assetName.includes("Parag Parikh")
    );
    expect(paragParikh).toBeDefined();
    expect(paragParikh?.assetClass).toBe("Mutual Fund");
  });

  it("should parse Institutional Global Family Office statements correctly", () => {
    const result = parseStatement(SAMPLE_STATEMENTS.familyOffice);

    expect(result.success).toBe(true);
    expect(result.holdings.length).toBe(5);
    expect(result.detectedBroker).toBe("Institutional Custodian");

    const treasury = result.holdings.find((h) => h.symbol === "US10Y");
    expect(treasury?.assetClass).toBe("Fixed Income");
  });

  it("sanitizes PAN, Aadhaar, Email, and Phone numbers from imported statements (Zero-PII)", () => {
    const rawPiiStatement = `Client Statement for ABCDE1234F
Aadhaar: 1234 5678 9012, Contact: advisor@wealthcorp.in, Phone: 9876543210
Symbol,Instrument,Quantity,Avg Price,LTP,Current Value
RELIANCE,Reliance Industries Ltd,100,2400.00,2900.00,290000`;

    const { sanitized, redactedPiiCount } = sanitizePii(rawPiiStatement);

    expect(redactedPiiCount).toBe(4);
    expect(sanitized).not.toContain("ABCDE1234F");
    expect(sanitized).toContain("[REDACTED_PAN]");
    expect(sanitized).not.toContain("1234 5678 9012");
    expect(sanitized).toContain("[REDACTED_AADHAAR]");
    expect(sanitized).not.toContain("advisor@wealthcorp.in");
    expect(sanitized).toContain("[REDACTED_EMAIL]");
    expect(sanitized).not.toContain("9876543210");
    expect(sanitized).toContain("[REDACTED_PHONE]");

    // Verify parsing succeeds cleanly on sanitized text
    const result = parseStatement(rawPiiStatement);
    expect(result.success).toBe(true);
    expect(result.redactedPiiCount).toBe(4);
    expect(result.holdings.length).toBe(1);
    expect(result.holdings[0].symbol).toBe("RELIANCE");
  });

  it("should return failure for empty content or missing headers", () => {
    const emptyResult = parseStatement("");
    expect(emptyResult.success).toBe(false);
    expect(emptyResult.errors.length).toBeGreaterThan(0);

    const invalidResult = parseStatement("Random,Text,Only\n1,2,3");
    expect(invalidResult.success).toBe(false);
  });

  it("should correctly map parsed holdings to normalized client PortfolioHolding types", () => {
    const result = parseStatement(SAMPLE_STATEMENTS.zerodha);
    expect(result.success).toBe(true);

    const clientHoldings = result.holdings.map((h, i) => {
      let mappedClass = "Stocks";
      const ac = (h.assetClass || "").toLowerCase();
      if (ac.includes("debt") || ac.includes("bond") || ac.includes("fixed")) {
        mappedClass = "Bonds";
      } else if (ac.includes("fund") || ac.includes("mutual")) {
        mappedClass = "Mutual Funds";
      } else if (ac.includes("cash") || ac.includes("liquid")) {
        mappedClass = "Cash";
      } else if (ac.includes("alt") || ac.includes("comm") || ac.includes("gold")) {
        mappedClass = "Alternatives";
      }
      return {
        id: `holding-${i}`,
        assetName: h.assetName || h.symbol,
        assetClass: mappedClass,
        ticker: h.symbol || "N/A",
        currentValue: String(h.currentValue),
      };
    });

    expect(clientHoldings.length).toBe(6);
    expect(clientHoldings.find((h) => h.ticker === "GOLDBEES")?.assetClass).toBe("Alternatives");
    expect(clientHoldings.find((h) => h.ticker === "RELIANCE")?.assetClass).toBe("Stocks");
  });
});
