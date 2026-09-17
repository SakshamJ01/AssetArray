/**
 * AssetArray 4.0 — Universal Ingestion Contract & Interfaces
 */

import { IngestionJob, RawSourceRecord } from "../../../types/v4/computation";

export interface IngestionSourceAdapter {
  sourceType: IngestionJob["sourceType"];
  supports(rawInput: any): boolean;
  parse(rawInput: any): RawSourceRecord[];
}
