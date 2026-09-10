# ASSETARRAY 4.0 — AI ARCHITECTURE & SAFETY STRATEGY
**Institutional Advisor Platform Product Blueprint**

---

## 1. The Core AI Rule of Law

```
+-------------------------------------------------------------------------------+
|                      THE ASSETARRAY AI RULE OF LAW                            |
|                                                                               |
|  1. AI sits strictly ABOVE deterministic financial engines.                   |
|  2. AI NEVER computes portfolio valuations, returns (XIRR/TWR), risk VaR,    |
|     tax liabilities (Sec 70/74), or goal probabilities directly.              |
|  3. AI EXPLAINS, SYNTHESIZES, RESEARCHES, COMPARES, and DRAFTS.               |
|  4. Every AI assertion must be grounded in verified, cited evidence.         |
|  5. AI NEVER autonomously places live orders or changes client data.          |
+-------------------------------------------------------------------------------+
```

---

## 2. Nine Core AI Responsibilities

```
+----------------+-------------------------------------------------------------+
| Responsibility | Institutional Application                                   |
+----------------+-------------------------------------------------------------+
| A. EXPLAIN     | "Explain why this portfolio's downside risk increased."      |
| B. SUMMARIZE   | "Summarize the key portfolio deltas since the last review." |
| C. RESEARCH    | "Synthesize quarterly earnings and broker commentary."      |
| D. PREPARE     | "Generate the 3-minute executive brief for today's meeting."|
| E. DETECT      | "Scan 150 client accounts for unharvested tax losses."       |
| F. COMPARE     | "Compare client portfolio asset allocation vs firm model."  |
| G. DRAFT       | "Draft a post-meeting client follow-up email and WhatsApp." |
| H. QUESTION    | "Act as investment committee adversary: challenge my thesis"|
| I. MONITOR     | "Track regulatory circulars (SEBI/RBI) impacting client PMS"|
+----------------+-------------------------------------------------------------+
```

---

## 3. End-to-End AI Gateway & Execution Pipeline

```
[User Action: "Prepare meeting brief for Vikram Malhotra"]
                          |
                          v
[AI Gateway: Task Router & Budget Engine]
 ├── Step 1: Detect Task Intent (Meeting Preparation -> Structured Synthesis)
 ├── Step 2: Route to Cost-Optimal Model (Gemini 2.5 Flash / Local Ollama)
                          |
                          v
[Deterministic Context Builder (Strict PII Boundaries)]
 ├── Query 1: Deterministic Engine -> Live Net Worth, XIRR, Drift, Top Holdings
 ├── Query 2: Tax Engine -> Sec 70/74 Realized/Unrealized Gains & Loss Lots
 ├── Query 3: Goal Engine -> Monte Carlo Probability & Glide-path Status
 └── Query 4: CRM State -> Last 2 Meeting Notes & Logged Client Decisions
                          |
                          v
[System Prompt Assembler (Grounded Financial Truth)]
 "You are an institutional wealth assistant. Use ONLY the provided deterministic JSON.
  If data is missing, explicitly state insufficient evidence. Never invent numbers."
                          |
                          v
[LLM Inference (Streaming JSON / Markdown)]
                          |
                          v
[Grounding & Safety Validator]
 ├── Verifies all quoted numbers match the deterministic context payload.
 ├── Rejects hallucinations or ungrounded claims.
                          |
                          v
[Structured Response Rendered in UI with Clickable Provenance Citations]
                          |
                          v
[Immutable AI Audit Event Logged (Tokens, Latency, Prompt Hash, Evidence Map)]
```

---

## 4. Multi-Provider Strategy & Free-First Architecture

AssetArray 4.0 is engineered with a **Provider-Agnostic AI Adapter Interface**, allowing the platform to run seamlessly across free, local, and commercial AI backends without vendor lock-in.

```
+-------------------------------------------------------------------------------+
| PROVIDER TIER MATRIX                                                          |
+---------------------+-------------------+---------------------+---------------+
| Provider Backend    | Target Task Type  | Cost Profile        | Privacy Level |
+---------------------+-------------------+---------------------+---------------+
| Gemini 2.5 Flash    | Deep Synthesis &  | FREE Tier           | Standard Cloud|
| (Default Cloud)     | Meeting Briefs    | (Generous free RPM) | Enclave       |
| Ollama (Local LLM)  | Sensitive PII     | ZERO Marginal Cost  | 100% On-Prem /|
| (Llama 3.3 / Mistral| Offline Summaries | (Runs on local GPU) | Air-Gapped    |
| OpenAI (GPT-4o)     | Optional Pro Tier | Paid / BYOK         | Cloud API     |
| Anthropic (Claude)  | Optional Pro Tier | (User API Key)      | Cloud API     |
+---------------------+-------------------+---------------------+---------------+
```

### Cost Control & Token Optimization
- **Deterministic-First Bypassing**: If a user asks "What is my total equity exposure?", the gateway intercepts and responds directly from the deterministic valuation engine with **0 AI tokens spent**.
- **Context Pruning**: Never sends raw 5,000-line transaction logs to LLMs. Summarizes transactions deterministically into a 20-line structural matrix before prompt assembly.
- **Cache-Aware Invalidation**: Cache research synthesis by security ISIN for 24 hours. If 10 advisors research *RELIANCE.NS*, LLM inference runs only once.

---

## 5. Agentic AI: Strictly Guarded Human-in-the-Loop Boundaries

```
+-------------------------------------------------------------------------------+
| THE AGENTIC HUMAN-IN-THE-LOOP (HITL) CHAIN                                    |
|                                                                               |
| [1. SCAN]       AI scans client portfolios for mandate drift or tax losses.  |
|      |                                                                        |
| [2. PROPOSE]    AI drafts proposed rebalance or harvesting recommendation.    |
|      |                                                                        |
| [3. HUMAN GATE] Advisor reviews, edits, and explicitly clicks [APPROVE].      |
|      |                                                                        |
| [4. STAGE]      System stages order batch for client review or ops export.    |
|      |                                                                        |
| [5. AUDIT]      Action recorded with cryptographic timestamp and approver ID. |
+-------------------------------------------------------------------------------+
```
