# AssetArray Desktop & Workstation UX Bug Backlog

**Release Family:** 3.3.x  
**Focus:** Removing Friction, Eliminating Card Clutter & Enhancing Data Density  

---

## 1. Workstation UX Defect & Resolution Register

| Bug ID | Screen | Severity | UX Friction Identified | Resolution Implemented | Status |
|:---|:---|:---:|:---|:---|:---:|
| **UX-01** | Global Theme Tokens | **P1** | Arbitrary radius values (14, 16, 18, 20, 22, 26, 28) created a bubbly "AI SaaS" feel. | Enforced canonical tokens `[0, 4, 8, 12]` across `src/theme/tokens.ts` and `appStyles.ts`. | **RESOLVED** |
| **UX-02** | Command Center | **P1** | Dashboard suffered from "card inside card" stacking, obscuring urgent advisor actions. | Extinguished nested cards into 3 primary action tiers: Critical Today, Opportunities, Priority Queue. | **RESOLVED** |
| **UX-03** | Command Center Actions | **P2** | Vague action buttons labeled simply "View" or "Action". | Replaced with specific, context-rich verbs: `[Review Portfolio]`, `[Run Rebalance]`, `[Offset Tax]`. | **RESOLVED** |
| **UX-04** | Client 360 Workspace | **P1** | Advisor lost track of client context when scrolling deep into risk and tax tabs. | Implemented persistent top context banner with Client Name, AUM, Health, and As-of date. | **RESOLVED** |
| **UX-05** | Holdings Data Table | **P1** | Numbers did not visually dominate labels; currency symbols hardcoded to Rupee on non-INR accounts. | Enforced tabular numerals (`fontVariant: ['tabular-nums']`) and multi-currency formatter `formatCurrency()`. | **RESOLVED** |
| **UX-06** | AI Copilot Drawer | **P2** | Chat interface felt like a generic LLM without showing what portfolio parameters were active. | Added persistent `Using: [Client Name] · As of [Date]` context badge at the top of the drawer. | **RESOLVED** |
| **UX-07** | AI Research Desk | **P2** | Citations presented as floating badges without clear institutional hierarchy. | Structured into 4-stage evidence flow: Search $\rightarrow$ Sources $\rightarrow$ Synthesis $\rightarrow$ Citations. | **RESOLVED** |
| **UX-08** | Monte Carlo Simulator | **P2** | Overwhelmed users with raw percentiles immediately on render. | Progressive disclosure: Hero success probability upfront; P10/P50/P90 in clean collapsible section. | **RESOLVED** |
| **UX-09** | Empty States | **P2** | Blank areas simply said "No data". | Replaced with institutional empty states: What is missing, Why it matters, and How to import/fix it. | **RESOLVED** |
