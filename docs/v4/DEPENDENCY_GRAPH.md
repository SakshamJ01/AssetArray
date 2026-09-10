# ASSETARRAY 4.0 — DEPENDENCY GRAPH & ARCHITECTURAL DECISIONS
**Institutional Advisor Platform Product Blueprint**

---

## 1. Implementation Dependency Graph

```
+-------------------------------------------------------------------------------+
| FOUNDATION LAYER (Step 1)                                                     |
| • Multi-Tenant Schema Partitioning                                            |
| • RBAC User Session & Permissions Middleware                                 |
| • Core Domain Entity Data Models (Household, Client, Portfolio, Tax Lots)    |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| DETERMINISTIC COMPUTATIONAL LAYER (Step 2)                                    |
| • Ingestion Normalizer (CAS PDF, Broker CSV)                                  |
| • Valuation & Mandate Drift Corridors                                         |
| • Section 70/74 Tax Lot Calculation Engine                                   |
| • Risk Attribution & Monte Carlo Goal Feasibility                            |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| DECISION & WORKFLOW LAYER (Step 3)                                            |
| • Client 360 Workspace Navigation                                             |
| • Tax-Aware Rebalancing Sandbox & Order Stager                                |
| • Task & Immutable Decision Audit Ledger                                      |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| GROUNDED AI & SYNTHESIS LAYER (Step 4)                                        |
| • Deterministic Context Builder                                               |
| • AI Gateway & Multi-Provider Task Router (Gemini / Ollama)                   |
| • Meeting Brief Generator & Client Communication Drafter                      |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| PRESENTATION & PUBLISHING LAYER (Step 5)                                      |
| • Dedicated Client Meeting Mode (Client-Safe View)                            |
| • Pixel-Perfect PDF Report Batch Generator                                    |
| • Client Portal Document Vault                                                |
+-------------------------------------------------------------------------------+
```

---

## 2. Major Architecture Decision Records (ADRs)

### ADR 1: Deterministic Math Ownership vs AI
- **Decision**: All financial computations (valuations, returns, capital gains, VaR, goal odds) remain strictly in deterministic TypeScript/Node modules.
- **Options Evaluated**: (A) LLM function-calling math, (B) Pure deterministic modules.
- **Choice**: (B) Pure deterministic modules.
- **Why**: Financial numbers must be mathematically exact and provable. LLMs hallucinate calculations on floating-point data.
- **Revisit**: Never.

### ADR 2: Data Persistence Architecture
- **Decision**: Retain MongoDB Atlas with Tenant ID partitioning instead of migrating to PostgreSQL.
- **Options Evaluated**: (A) Full rewrite to PostgreSQL/Prisma, (B) Partitioned MongoDB with typed Mongoose schemas.
- **Choice**: (B) MongoDB Atlas.
- **Why**: Multi-asset holdings, diverse CAS statement formats, and varied custom tax lot schemas benefit immensely from flexible document structures without needing costly schema migration downtime.
- **Revisit**: V5.0 if relational ledger complexity necessitates ACID foreign key cascades.

### ADR 3: Multi-Provider AI Architecture
- **Decision**: Abstract all AI interactions behind an internal `AIGateway` with zero vendor lock-in.
- **Options Evaluated**: (A) Hardcode OpenAI API, (B) Multi-provider adapter (Gemini Flash + Local Ollama + Cloud BYOK).
- **Choice**: (B) Multi-provider adapter.
- **Why**: Protects unit economics (free/low-cost default) and provides privacy options for air-gapped institutional clients.
- **Revisit**: Annually as open-source LLM efficiency evolves.
