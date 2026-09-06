# AssetArray — AI UX & Evidence-First Research Audit
**Release Family**: 3.3.x  
**Component Scope**: `AiWealthCopilot.tsx`, `AiResearchScreen.tsx`, `aiStream.ts`, `aiAdvisor.ts`, `clientInsights.ts`  
**Standard**: Institutional Fiduciary Standards & SEC/SEBI Investment Advice Trust Model

---

## 1. AI Integration Philosophy
In AssetArray 3.3.x, AI is strictly implemented as a **fiduciary tool integrated into advisor workflows**, rather than an isolated conversational novelty or generic chatbot.

Every AI output adheres to three immutable principles:
1. **Context Grounding**: AI is permanently anchored to verified portfolio records, cost bases, real-time market prices, and client risk mandates.
2. **Provenance & Source Transparency**: Clear distinction between verified real-time data, retrieved external sources, and model interpretation.
3. **Graceful Deterministic Fallback**: If an AI provider is unreachable or rate-limited, certified deterministic financial metrics (TWR, XIRR, Sharpe, Section 70/74 Tax) remain 100% available without interruption. Fake or fabricated responses are strictly prohibited.

---

## 2. AI Wealth Copilot Audit (`AiWealthCopilot.tsx`)

### 2.1. Trust & Context Provenance Banner
- **Implementation**: Persistent Context Strip rendered directly beneath the copilot modal header.
- **Visual Display**:
  ```text
  [CONTEXT] Using: Rahul Mehta (Family Office) · Balanced Wealth · As of 06 Sep 2026
  ```
- **Trust Impact**: Eliminates advisor ambiguity regarding what client assets and parameters the model is interpreting.

### 2.2. Deterministic State Progression & Streaming Transparency
The streaming engine (`src/services/aiStream.ts`) emits discrete lifecycle states displayed in real-time to the advisor:
1. **Connecting…**: Establishing HTTPS stream to backend provider (Gemini / Ollama / Local Rule Engine).
2. **Thinking…**: Ingestion and synthesis of client holdings and benchmark returns.
3. **Generating…**: Token-by-token streaming with live auto-scroll.
4. **Complete · [Model] · [Latency]s**: Explicit badge detailing model version (e.g., `gemini-1.5-flash`) and round-trip execution latency.

### 2.3. Zero-Hallucination Error Handling
When network or rate-limiting errors occur:
- **Display**: `AI temporarily unavailable. Verified portfolio metrics and ledger data remain fully accessible.`
- **Action**: Immediate single-click `[Retry]` action without losing conversational context.
- **Rule Enforcement**: The system never generates synthetic placeholder text masquerading as financial guidance.

---

## 3. AI Market Research Audit (`AiResearchScreen.tsx`)

### 3.1. Evidence-First Information Architecture
Rather than displaying an unverified AI paragraph with decorative citation pills, the research workflow follows a disciplined four-stage pipeline:
$$\text{SEARCH} \longrightarrow \text{SOURCES} \longrightarrow \text{ANSWER} \longrightarrow \text{EVIDENCE}$$

```
┌────────────────────────────────────────────────────────┐
│ 1. SEARCH INPUT                                        │
│ Query: "Reliance Industries H1 Energy Transition"      │
├────────────────────────────────────────────────────────┤
│ 2. SOURCES & DISCLOSURE                                │
│ [✓ VERIFIED WEB RESEARCH]                              │
│ • [FINANCIAL NEWS] Reuters — Oil-to-Chem Capex Update  │
│ • [EXCHANGE FILING] BSE India — Q2 Operational Report  │
├────────────────────────────────────────────────────────┤
│ 3. STRUCTURED ANSWER & SENTIMENT                       │
│ Sentiment: BULLISH | Summary: Strategic renewables...  │
├────────────────────────────────────────────────────────┤
│ 4. RISK & OPPORTUNITY EVIDENCE                         │
│ Opportunities: Solar gigafactory commissioning         │
│ Risks: Refining margin compression                     │
└────────────────────────────────────────────────────────┘
```

### 3.2. Mandatory Source Disclosures
- If verified live web sources were retrieved via Search/News APIs:
  - Header: `✓ VERIFIED WEB RESEARCH` (Emerald badge, 1px border).
  - Source list: Publisher, Title, Published Date, and clickable external URL.
- If web retrieval is offline or running in model-only mode:
  - Header: `ℹ️ RESEARCH SOURCES DISCLOSURE` (Amber badge, 1px border).
  - Explicit warning: *"Research sources unavailable. This answer is model synthesis and not current real-time web research."*

---

## 4. Meeting Preparation & Action Engine

### 4.1. Advisor Meeting Brief (`AdvisorCommandCenter.tsx`)
The meeting preparation engine synthesizes verified application state without fabricating historical interactions:
- **Verified Holdings**: Top assets, current value, overall unrealized gain/loss.
- **Active Risk Signals**: Concentration alerts exceeding $25\%$, allocation drift $> 3\%$.
- **Pending Follow-Ups**: Next review date and open client tasks.
- **Actionable Output**: One-click generation of personalized WhatsApp or Email drafts with exact client names and asset statistics pre-filled.

---

## 5. Free-First Provider Tiering

AssetArray adheres strictly to a free-first provider hierarchy:
1. **Google Gemini (Free tier)**: Primary high-intelligence reasoning.
2. **Ollama (Local Private)**: Zero-cloud, 100% on-device private-banking inference.
3. **Deterministic Rule Engine (Built-in)**: Zero-dependency algorithmic portfolio analysis guaranteeing 100% offline uptime.
*(No paid subscriptions or mandatory proprietary API keys required).*
