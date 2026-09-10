# ASSETARRAY 4.0 — TARGET TECHNICAL ARCHITECTURE & EVOLUTION
**Institutional Advisor Platform Product Blueprint**

---

## 1. Stack Evaluation: Pragmatic Evolution over Total Rewrite

AssetArray 4.0 retains the battle-tested, high-performance foundation of V3.3.x while refactoring the internal organization into clear domain modules.

```
+-------------------------------------------------------------------------------+
| ASSETARRAY 4.0 TECH STACK VERDICT                                             |
+-------------------------------------------------------------------------------+
| LAYER          | TECHNOLOGY                    | RATIONALE / VERDICT          |
+----------------+-------------------------------+------------------------------+
| Frontend Web   | React 19 / Vite / TypeScript  | Instant HMR, ultra-fast load,|
|                | Vanilla CSS Design System     | zero heavy CSS runtime bloat |
| Frontend Mobile| React Native / Expo Web       | Shared domain logic, native  |
|                |                               | mobile performance on iOS/And|
| Backend API    | Node.js 20+ / Express         | Low latency, huge ecosystem, |
|                | Modular Domain Routers        | seamless TypeScript parity   |
| Primary DB     | MongoDB Atlas                 | Flexible JSON schemas for    |
|                | (Multi-Tenant Partitioned)    | multi-asset tax lots & CAS   |
| Caching        | In-Memory Cache / Redis       | Fast market quote & NAV read |
| Background Jobs| BullMQ / Mongo Worker         | Statement parsing & PDF runs |
| AI Integration | Google Gemini 2.5 Flash API   | Low-cost, fast token latency,|
|                | + Local Ollama Fallback       | provider-agnostic adapter    |
| Hosting        | Render Web Services + Firebase| High uptime, automated CI/CD |
+----------------+-------------------------------+------------------------------+
```

---

## 2. Backend Architecture: Domain Modular Monolith

Instead of building a premature, complex microservices mesh, the V4 backend evolves into a clean **Domain Modular Monolith**:

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/            # JWT sessions, Multi-Tenancy, RBAC middleware
│   │   ├── clients/         # Client & Household CRUD, PAN KYC validation
│   │   ├── portfolios/      # Valuation, Holdings, Tax Lots, Models, Drift
│   │   ├── risk/            # VaR, CVaR, Stress Testing, Factor Attribution
│   │   ├── tax/             # Section 70/74 Harvesting, Realized Gain Engine
│   │   ├── goals/           # Monte Carlo Feasibility, Glide-paths
│   │   ├── research/        # Multi-source scraper, Filings, Synthesis
│   │   ├── ai/              # AI Gateway, Context Builder, Prompt Assembly
│   │   ├── ingestion/       # CAS PDF Decryptor, Broker CSV Normalizer
│   │   ├── reconciliation/  # Discrepancy Break Detector, Ledger Sync
│   │   ├── reports/         # PDF Generation Worker, Branded Layouts
│   │   └── audit/           # Cryptographic SHA-256 Event Logger
│   ├── shared/
│   │   ├── database/        # Tenant-partitioned Mongo connection
│   │   ├── events/          # Domain Event Bus (EventEmitter / BullMQ)
│   │   └── errors/          # Standardized Financial Error Handler
│   └── server.ts
```

---

## 3. Frontend Architecture: Feature Modules & State Boundaries

```
src/
├── features/
│   ├── command-center/      # Morning Briefing, Exception Triage, Urgent Alerts
│   ├── clients/             # Client 360 Workspace, Family Tree, Demographics
│   ├── portfolios/          # Allocation Matrix, Holdings Grid, Rebalance Sandbox
│   ├── risk/                # Stress Scenarios, Factor Heatmaps, Drawdowns
│   ├── tax/                 # Sec 70/74 Tax Lot Matrix, Harvesting Optimizer
│   ├── goals/               # Monte Carlo Sliders, Glide-path Visualizers
│   ├── research/            # Security Screener, Corporate Filings, News
│   ├── meeting-mode/        # Client-Safe Presentation Canvas, Decision Log
│   ├── reports/             # Report Customizer, PDF Previewer
│   └── settings/            # Firm Branding, Team RBAC, Ingestion Center
├── components/              # Design System Atoms (Buttons, Cards, Data Grids, Drawers)
├── hooks/                   # Domain Query Hooks (useClient360, useRebalance)
└── state/                   # Normalized Local Cache & Active Filter Stores
```

---

## 4. Performance Targets for Institutional Workloads

```
+-------------------------------------------------------------------------------+
| PERFORMANCE BENCHMARK TARGETS                                                 |
+------------------------------------+--------------------+---------------------+
| Interaction                        | 3.3.x Baseline     | V4 Institutional Tgt|
+------------------------------------+--------------------+---------------------+
| Initial Web App Cold Load          | 1.8 seconds        | < 1.2 seconds       |
| Client 360 Context Switch (100 pos)| 350 ms             | < 80 ms (Virtual)   |
| Global Search Query (Cmd+K)        | N/A (New)          | < 40 ms             |
| Rebalance Calculation (500 lots)   | 450 ms             | < 100 ms            |
| AI Copilot First Streaming Token   | 1.2 seconds        | < 600 ms            |
| 100-Page PDF Quarterly Pack Batch  | 12 seconds         | < 4 seconds         |
+------------------------------------+--------------------+---------------------+
```

---

## 5. Observability & Graceful Error Philosophy

Every error in AssetArray 4.0 adheres to the **Three-Question Financial Error Protocol**:
1. **WHAT HAPPENED?** ("Unable to retrieve real-time quotes from market provider.")
2. **WHAT STILL WORKS?** ("Portfolio valuation is calculated using yesterday's verified closing prices as of 15:30 IST.")
3. **WHAT SHOULD I DO?** ("You may continue rebalance planning; live quotes will resume automatically upon market feed reconnection.")
