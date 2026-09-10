# ASSETARRAY 4.0 — INFORMATION ARCHITECTURE
**Institutional Advisor Platform Product Blueprint**

---

## 1. Domain-Driven Information Architecture

AssetArray 4.0 rejects flat, unstructured menu lists and cosmetic multi-tab dashboard sprawl. The platform is organized around clean, logically segregated **Core Business Domains**, structured strictly by advisor task frequency and cognitive context.

```
+---------------------------------------------------------------------------------------------------+
|                                  GLOBAL COMMAND LAYER (Cmd+K)                                     |
|           Universal Search (Clients, Households, Securities, Tasks, Reports, AI Copilot)          |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +--------------------+  +-------------------------------------+  +----------------------------+  |
|  | PRIMARY NAVIGATION |  | CONTEXTUAL WORKSPACES               |  | SYSTEM & GOVERNANCE        |  |
|  | (Daily Operating)  |  | (Deep Dive Workstations)            |  | (Firm Administration)      |  |
|  +--------------------+  +-------------------------------------+  +----------------------------+  |
|  | 1. Command Center  |  | 5. Research Workstation             |  | 10. Audit & Compliance    |  |
|  | 2. Clients & HH    |  | 6. Risk & Scenarios                 |  | 11. Data & Ingestion       |  |
|  | 3. Portfolios & Mod|  | 7. Tax Intelligence (Sec 70/74)     |  | 12. Firm Settings & RBAC   |  |
|  | 4. Tasks & Follow  |  | 8. Goal Planning & Monte Carlo      |  | 13. Billing & Fee Mgmt     |  |
|  |                    |  | 9. Reporting & Publishing           |  |                            |  |
|  +--------------------+  +-------------------------------------+  +----------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Navigation Hierarchy & Layout Matrix

### Tier 1: Primary Left Navigation Bar (Desktop & iPad)
Optimized for rapid one-click context switching throughout an advisor's workday.

| Domain | Primary Route | Core Function | Typical Interaction |
| :--- | :--- | :--- | :--- |
| **Command Center** | `/` | Morning exception triage, today's meetings, urgent alerts | Daily at 8:30 AM & 5:00 PM |
| **Clients & Households** | `/clients` | Client roster, family tree, AUM breakdown, relationship tags | Continuous (all day) |
| **Portfolios & Models** | `/portfolios` | Firm-wide portfolio list, model allocations, drift monitor | Multiple times daily |
| **Tasks & Decisions** | `/tasks` | Action items, review approvals, pending follow-ups | Throughout workday |
| **Research** | `/research` | Fundamental analysis, fund metrics, macro monitors, notes | During analytical deep-dives |
| **Reports** | `/reports` | Quarterly review packs, tax certificates, performance PDFs | End of month / quarter |

---

### Tier 2: The Client 360 Workspace Architecture
When an advisor clicks on any Client or Household, the platform transitions into the dedicated **Client 360 Workspace** with a clean, unified sub-navigation ribbon:

```
CLIENT 360 WORKSPACE (Vikram Malhotra Household — ₹18.5 Cr AUM)
├── [Overview]          -> Consolidated Net Worth, YTD Returns, Allocation Corridor, Next Action
├── [Portfolios]        -> Individual Account Breakdown (Self, Spouse, HUF, Holding Co)
├── [Holdings & Lots]   -> Granular Multi-Asset Ledger, Buy Dates, Cost Basis, Unrealized P&L
├── [Risk & Stress]     -> Concentration, VaR/CVaR, Factor Attribution, Crisis Simulations
├── [Tax Intelligence]  -> Sec 70/74 Loss Harvesting, Realized/Unrealized STCG/LTCG, FY Tax Pack
├── [Goals & Cashflow]  -> Goal Funding Gauges, Monte Carlo Probabilities, Glide-paths
├── [Meeting Mode]      -> Client Presentation Safe Mode, Agenda, Live Decision Logger
├── [Tasks & Comm]      -> Meeting Notes, WhatsApp/Email History, Assigned Ops Items
└── [Documents & Pdfs]  -> KYC, Signed Mandates, CAS Statements, Historical Quarterly Packs
```

---

## 3. Global Command & Search Layer (Cmd + K)

A hyper-responsive search and execution bar accessible anywhere via keyboard shortcut `Cmd + K` (Mac) / `Ctrl + K` (Windows).

```
+-------------------------------------------------------------------------------+
|  Search clients, tickers, tasks, or ask Copilot... [Cmd+K]                    |
+-------------------------------------------------------------------------------+
|  RECENT CONTEXT:                                                              |
|  • Vikram Malhotra (Client 360)                      [Enter -> Jump]          |
|  • Parag Parikh Flexi Cap Fund (Research)            [Enter -> Jump]          |
|                                                                               |
|  DIRECT ACTIONS:                                                              |
|  • "Prepare 11:00 AM Meeting Brief for Vikram"       [AI Workspace]           |
|  • "Find all portfolios with >10% Small Cap drift"   [Filter Portfolios]      |
|  • "Generate Q3 Performance Pack for Aditi Rao"      [Run Report]             |
|  • "Upload CAMS CAS PDF for Ingestion"               [Open Modal]             |
|                                                                               |
|  ENTITIES MATCHED:                                                            |
|  • RELIANCE.NS (Reliance Industries Ltd - Stock)                              |
|  • INFOSYS.NS (Infosys Ltd - Stock)                                           |
|  • Rameshwaram Family Trust (Household)                                       |
+-------------------------------------------------------------------------------+
```

---

## 4. Progressive Disclosure Rules

To maintain high visual elegance without overwhelming the advisor:
1. **Above the Fold Rule**: The top 300px of any domain screen displays only the 4 most critical numbers, the primary status badge, and the single most urgent Next Action.
2. **Contextual Drawer**: Clicking any holding, risk metric, or tax lot opens a slide-over right drawer (`380px` width) displaying granular provenance, calculation formulas, and source timestamps without navigating away from the current view.
3. **Client-Safe Mode Toggle**: A persistent header toggle button (`Cmd + Shift + P`) instantly masks all advisor fee margins, internal ops notes, and compliance risk flags, converting the screen into a pristine client-facing presentation canvas.
