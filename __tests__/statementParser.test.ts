import { parseStatement, SAMPLE_STATEMENTS } from "../src/services/statementParser";

describe("Statement Parser Engine", () => {
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

  it("should return failure for empty content or missing headers", () => {
    const emptyResult = parseStatement("");
    expect(emptyResult.success).toBe(false);
    expect(emptyResult.errors.length).toBeGreaterThan(0);

    const invalidResult = parseStatement("Random,Text,Only\n1,2,3");
    expect(invalidResult.success).toBe(false);
  });
});
