# AssetArray Claims & Regulatory Terminology Policy

**Version:** 3.3.1  
**Effective Date:** September 2026  
**Applies to:** All Product Copy, UI Labels, Marketing, API Documentation, PDF Reports, AI Prompts, and Source Comments

---

## Core Principle

> **AssetArray is advisor operating and decision-support software.**  
> It provides deterministic analytics, portfolio intelligence, workflow orchestration, and privacy controls. **AssetArray does not create regulatory status, provide investment advisory services, guarantee returns, or confer legal compliance merely through software features.** Registered entities and advisors using AssetArray remain solely responsible for their own policies, regulatory registrations, client suitability, tax filings, and compliance adherence.

---

## Terminology Matrix

| Category | Allowed / Standardized Terminology | Prohibited / Restricted Terminology | Rationale & Policy |
| :--- | :--- | :--- | :--- |
| **Performance (GIPS®)** | `GIPS-aligned performance methodology`<br>`GIPS-informed performance methodology`<br>`Daily subperiod TWR methodology` | `GIPS-compliant`<br>`GIPS certified`<br>`GIPS compliance`<br>`Partial GIPS compliance` | Official GIPS guidance dictates that software vendors and service providers cannot claim GIPS compliance. Only investment management firms can claim compliance for composites. |
| **Advisor Positioning** | `Advisor Command Center`<br>`Advisor Governance & Decision Support`<br>`Advisor Decision OS`<br>`Advisor Decision Journal` | `Fiduciary OS`<br>`Fiduciary compliance`<br>`Fiduciary certified`<br>`Legally fiduciary`<br>`Automatically fiduciary-compliant` | AssetArray does not legally confer fiduciary status. It provides records and evidence tools for advisors to document their governance and rationale. |
| **Tax Intelligence** | `Estimated Tax Impact`<br>`Potential Tax Effect`<br>`Illustrative Tax Impact`<br>`Potential Harvest Opportunity` | `Tax Shield`<br>`Guaranteed Tax Saving`<br>`Guaranteed Tax Shield`<br>`Guaranteed Savings`<br>`Tax Compliant`<br>`Optimal Tax` | Tax loss harvesting and capital gains offsets depend on client-specific filings, external income, and statutory assessments. Software estimates cannot guarantee cash tax savings. |
| **Privacy & Data Protection** | `DPDP-aligned privacy controls`<br>`Privacy-focused AI sanitization`<br>`PII minimization`<br>`Zero-knowledge local encryption` | `DPDP compliant`<br>`DPDP-compliant`<br>`Fully DPDP compliant`<br>`Guaranteed DPDP compliance` | Technical controls align with data minimization principles of India's DPDP Act 2023, but organizational compliance requires entity-level data fiduciary protocols. |
| **Regulatory (SEBI / RIA)** | `SEBI-aware workflow`<br>`Suitability-support tooling`<br>`Advisor governance support`<br>`Compliance-support workflow` | `SEBI compliant`<br>`SEBI-compliant`<br>`SEBI certified`<br>`SEBI approved`<br>`Registered advisor` (unless verified entity) | Software cannot certify or make an advisor compliant. Tooling aids advisors in meeting documentation and risk profiling guidelines. |
| **Design & Analytical Standards** | `Institutional-style analytics`<br>`Institutional workflow design`<br>`Professional wealth analytics` | `Institutionally certified`<br>`Institutional regulatory compliance`<br>`Guaranteed institutional standard` | "Institutional" may describe analytical sophistication (e.g. Brinson attribution, GIPS-informed TWR), not regulatory certification. |
| **AI Assistants & Prompts** | `Advisor-support assistant`<br>`Model indicates`<br>`Based on available data`<br>`Suggested review` | `You are a fiduciary advisor`<br>`Generate compliant advice`<br>`Best investment`<br>`Guaranteed return` | AI must strictly ground itself in deterministic engine outputs and assist the advisor, never issuing automated investment advice. |

---

## Mandatory Disclosures

### GIPS® Performance Methodology Disclosure
Wherever GIPS or Time-Weighted Return (TWR) methodologies are prominently presented:
> *AssetArray provides performance analytics using methodologies informed by the Global Investment Performance Standards (GIPS®). AssetArray is not itself claiming GIPS compliance, certification, or verification. Firms using AssetArray remain responsible for their own policies, data, calculations, disclosures, and applicable GIPS requirements.*

### Tax & Rebalancing Estimation Disclosure
Wherever tax harvesting, capital gains offsets, or rebalancing impacts are calculated:
> *Estimated Tax Impact calculations are illustrative scenario simulations based on applicable statutory rules (including India Finance Act 2024 / Section 112A/111A). They do not constitute formal tax, legal, or investment advice. Actual tax liability depends on complete assessment by qualified tax professionals.*

---

## Contextual Exceptions

The prohibited terms listed above are strictly forbidden in product-facing copy, UI labels, marketing materials, and default system prompts. However, they may appear in:
1. **This policy document (`docs/claims-policy.md`)** and related governance specifications for the explicit purpose of defining restricted terms.
2. **Automated regression tests (`__tests__/claimsAndTerminology.test.ts`)** asserting the absence of prohibited terms in active source files.
3. **Quoted third-party regulatory texts or audit test assertions** where required for regression prevention.
