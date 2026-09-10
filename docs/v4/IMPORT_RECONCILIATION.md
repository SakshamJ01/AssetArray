# ASSETARRAY 4.0 — DATA IMPORT & RECONCILIATION SUBSYSTEM
**Institutional Advisor Platform Product Blueprint**

---

## 1. Universal Ingestion Pipeline Architecture

AssetArray 4.0 does not bind advisors to any single proprietary broker. It provides a robust, multi-source ingestion pipeline capable of parsing complex real-world statements.

```
+-------------------------------------------------------------------------------+
| SOURCE ADAPTER LAYER                                                          |
| • CAMS & KFintech Consolidated Account Statements (CAS PDF / eCAS)           |
| • NSDL & CDSL e-CAS (Depository Statements)                                  |
| • Broker Trade Books & Holdings CSVs (Zerodha, Groww, ICICI Direct, Kotak)   |
| • Standardized CSV / Excel Import Templates                                  |
| • Manual Batch Entry via Grid UI                                              |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| NORMALIZATION & PARSING PIPELINE                                              |
| 1. Password-Protected PDF Decryption (Client PAN verification)                |
| 2. OCR / Text Extraction & Scheme Name Mapping                                |
| 3. ISIN & AMFI Code Master Resolution                                         |
| 4. Transaction Type Normalization (BUY, SELL, DIV_REINV, SIP, SWP, BONUS)     |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| PROVENANCE & VALIDATION STAGE                                                 |
| • Verifies mathematical consistency (Units x Price = Net Amount)             |
| • Assigns cryptographic source fingerprint & upload timestamp                 |
| • Flags unmapped securities for human back-office resolution                  |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| PORTFOLIO LEDGER COMMIT                                                       |
| Updates Holdings, Tax Lots (FIFO / Specific Lots), and Cash Balances          |
+-------------------------------------------------------------------------------+
```

---

## 2. Institutional Reconciliation Engine: Breaks & Discrepancies

In an institutional advisory practice, data discrepancies are inevitable (e.g., pending trade settlements, corporate actions, off-market transfers). AssetArray 4.0 introduces a first-class **Reconciliation Engine**.

```
+-------------------------------------------------------------------------------+
| THE THREE-WAY RECONCILIATION MATRIX                                           |
|                                                                               |
|   [Custodian / Broker Demat Feed] <=======> [Internal Transaction Ledger]     |
|                   \                                 /                         |
|                    \                               /                          |
|                     v                             v                           |
|                      [Tax Lot & Capital Gains Ledger]                         |
+-------------------------------------------------------------------------------+
```

### Types of Reconciliation Breaks Handled
1. **Quantity Break**: Custodian reports 1,000 units of HDFCBANK; internal ledger shows 900 units (Cause: Unrecorded stock split or corporate action).
2. **Price / Cost Basis Break**: Broker export missing original acquisition date for transferred stock (triggers manual lot acquisition date adjustment prompt).
3. **Cash Balance Break**: Bank feed shows unallocated ₹2,50,000 cash dividend credit not yet tagged to portfolio cash ledger.

### Advisor Reconciliation Workflow
```
[Break Flagged: "Quantity mismatch in RELIANCE.NS for Aditi Rao"]
                        |
                        v
[Ops Specialist Opens Reconciliation Drawer]
 Displays side-by-side ledger vs uploaded statement proof.
                        |
                        v
[Action Selected: "Apply Corporate Action Adjustment" OR "Insert Missing Buy Lot"]
                        |
                        v
[Ops Confirms Adjustment -> Ledger Updated -> Break Cleared with Full Audit Note]
```
