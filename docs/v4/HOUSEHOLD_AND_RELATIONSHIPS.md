# ASSETARRAY 4.0 — HOUSEHOLD & FAMILY RELATIONSHIP MODEL
**Institutional Advisor Platform Product Blueprint**

---

## 1. Why Household-Centric Wealth Architecture is Mandatory

In Indian and global wealth management, High-Net-Worth individuals rarely invest through a single isolated account. Wealth is structured across complex legal entities and family relationships to optimize taxation, succession planning, and liability protection.

```
+-------------------------------------------------------------------------------+
|                       THE MALHOTRA FAMILY OFFICE (₹42.5 Cr AUM)               |
+-------------------------------------------------------------------------------+
|                                                                               |
|  +-------------------------+     +-------------------------+                  |
|  | Vikram Malhotra (Self)  |     | Anita Malhotra (Spouse) |                  |
|  | PAN: ABCPM1234F         |     | PAN: DEFPA5678K         |                  |
|  | Accounts: Demat, MF, SGB|     | Accounts: Demat, MF, PPF|                  |
|  +-------------------------+     +-------------------------+                  |
|               \                               /                               |
|                \                             /                                |
|  +---------------------------------------------------------+                  |
|  | Vikram Malhotra HUF (Hindu Undivided Family Entity)     |                  |
|  | PAN: AABHV9012D | Karta: Vikram | Coparceners: Children |                  |
|  | Primary Focus: Long-Term Equity Compounding             |                  |
|  +---------------------------------------------------------+                  |
|               /                               \                               |
|              /                                 \                              |
|  +-------------------------+     +-------------------------+                  |
|  | V-Tech Holdings Pvt Ltd |     | Malhotra Family Trust   |                  |
|  | Corporate Holding Co.   |     | Private Family Trust    |                  |
|  | Primary Focus: Debt PMS |     | Primary Focus: Estate   |                  |
|  +-------------------------+     +-------------------------+                  |
+-------------------------------------------------------------------------------+
```

---

## 2. Household Entity Data Model

### Entity Hierarchy
1. **Household / Family Office (Root)**
   - Name, Aggregate Net Worth, Primary Advisor, Mandate Policy, Consolidated Billing Flag.
2. **Member (Individual / Entity)**
   - Member Type: `INDIVIDUAL`, `HUF`, `PRIVATE_LIMITED`, `TRUST`, `PARTNERSHIP`.
   - Identification: Legal Name, PAN, Tax Status (`RESIDENT`, `NRI`, `PIO`), KYC Status, Date of Birth.
   - Relationship to Primary: `SELF`, `SPOUSE`, `CHILD`, `PARENT`, `KARTA`, `BENEFICIARY`, `DIRECTOR`.
3. **Accounts & Portfolios (Leaf)**
   - Custodian/Broker Accounts linked directly to a specific Member entity.

---

## 3. Aggregation & Multi-Entity Capabilities

### Consolidated Balance Sheet
- **Total Family Wealth**: Instant aggregation across all members and entities with zero double-counting.
- **Inter-Entity Transfers & Loans**: Tracking internal family loans and capital infusions without distorting net wealth.
- **Entity-Level Tax Segmentation**: While wealth is reviewed collectively, tax liabilities (STCG, LTCG, Dividend TDS) remain strictly partitioned by PAN to ensure exact statutory tax filing readiness.

### Cross-Account Overlap & Concentration Detection
- Identifies whether multiple family members are inadvertently accumulating excessive concentration in the same stock across separate demat accounts (e.g., Husband holds ₹1 Cr HDFC Bank, HUF holds ₹1.5 Cr HDFC Bank, Private Trust holds ₹80L HDFC Bank -> Total Family Exposure: ₹3.3 Cr = 18% of Net Worth).

---

## 4. Permissions, Privacy & Access Control

```
+--------------------------+-----------------------+-----------------------------+
| Role                     | Household Level View  | Entity / Account Level View |
+--------------------------+-----------------------+-----------------------------+
| Lead Senior Advisor      | Full Access           | Full Access                 |
| Associate RM             | Full Access           | Full Access                 |
| Family Office Principal  | Full Consolidated View| All Family Accounts         |
| Individual Member (Son)  | Masked / Restricted   | Own Demat / MF Account Only |
| Family Chartered Acct    | Read-Only Tax Reports | Tax Lots & Realized P&L Only|
+--------------------------+-----------------------+-----------------------------+
```

---

## 5. Value Proposition for Boutique Advisors
- **True Institutional Differentiation**: Retail apps treat each user as an isolated login. AssetArray 4.0 empowers the advisor to manage the family's entire multi-generational estate seamlessly in one screen.
- **Succession & Estate Readiness**: Directly map family goals to specific entities (e.g., Grandchildren's Education Trust funded by HUF dividends).
