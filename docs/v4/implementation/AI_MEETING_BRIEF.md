# AssetArray V4.0 — Phase 4: Meeting Brief & Decision Support

## 1. Meeting Brief Service (`src/services/v4/ai/meetingBriefService.ts`)
Synthesizes a 4-section executive brief for client review meetings:
1. **Portfolio & Asset Allocation Changes** (AUM, top positions, drift score).
2. **Risk Exceptions & Stress Corridors** (Risk score, 95% Monthly VaR).
3. **Tax Optimization & Harvesting** (Section 70/74 harvesting opportunities).
4. **Strategic Goals & Workflow Mandates** (Open tasks, pending rebalance proposals).

## 2. Decision Challenge ("Challenge My Thinking") (`src/services/v4/ai/decisionChallengeService.ts`)
- Cognitive stress-testing for advisor investment theses.
- Surfaces counter-evidence, tax friction costs, and missing liquidity information.
- Provides probing fiduciary questions before orders are finalized.
