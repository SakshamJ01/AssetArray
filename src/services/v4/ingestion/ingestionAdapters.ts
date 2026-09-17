/**
 * AssetArray 4.0 — Ingestion Source Adapters
 * Multi-source adapters converting manual, CSV, or statement inputs into RawSourceRecord array.
 */

import { IngestionSourceAdapter } from "./ingestionContract";
import { RawSourceRecord } from "../../../types/v4/computation";
import { parseStatement } from "../../statementParser";

export class ManualGridAdapter implements IngestionSourceAdapter {
  sourceType = "MANUAL_GRID" as const;

  supports(rawInput: any): boolean {
    return Array.isArray(rawInput) && rawInput.every((r) => typeof r === "object");
  }

  parse(rawInput: any[]): RawSourceRecord[] {
    return rawInput.map((row, idx) => ({
      recordId: `raw-grid-${idx + 1}`,
      rawFields: row,
      sourceLineNumber: idx + 1,
    }));
  }
}

export class StatementTextAdapter implements IngestionSourceAdapter {
  sourceType = "STATEMENT_TEXT" as const;

  supports(rawInput: any): boolean {
    return typeof rawInput === "string" && rawInput.trim().length > 0;
  }

  parse(rawInput: string): RawSourceRecord[] {
    const parsed = parseStatement(rawInput);
    if (!parsed.success || !parsed.holdings) return [];

    return parsed.holdings.map((h, idx) => ({
      recordId: `raw-stmt-${idx + 1}`,
      rawFields: {
        symbol: h.symbol || h.ticker,
        securityName: h.assetName,
        quantity: h.quantity,
        currentValue: h.currentValue,
        investedAmount: h.investedValue,
        assetClass: h.assetClass,
      },
      sourceLineNumber: idx + 2,
    }));
  }
}

export class BrokerCsvAdapter implements IngestionSourceAdapter {
  sourceType = "BROKER_CSV" as const;

  supports(rawInput: any): boolean {
    return typeof rawInput === "string" && (rawInput.includes(",") || rawInput.includes("\t"));
  }

  parse(rawInput: string): RawSourceRecord[] {
    const lines = rawInput.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const records: RawSourceRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const fields: Record<string, any> = {};
      headers.forEach((h, colIdx) => {
        fields[h] = cols[colIdx] || "";
      });

      records.push({
        recordId: `raw-csv-${i}`,
        rawFields: fields,
        sourceLineNumber: i + 1,
      });
    }

    return records;
  }
}

export const REGISTERED_ADAPTERS: IngestionSourceAdapter[] = [
  new ManualGridAdapter(),
  new StatementTextAdapter(),
  new BrokerCsvAdapter(),
];
