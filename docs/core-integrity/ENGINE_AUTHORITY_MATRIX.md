# Engine Authority Matrix (3.3.x core-integrity)

One authoritative implementation per domain. Facades are NOT duplicates — they are
listed as aliases that must delegate, never reimplement.

| Domain | Authoritative engine | Aliases / facades (must delegate) | Duplicates removed / deprecated | Callers | Tests | Migration |
|---|---|---|---|---|---|---|
| Market Data | `src/services/market/marketProvider.ts` `UnifiedMarketProvider` (Provider→Cache→Fallback) + `src/services/realTimeMarket.ts` as central stream | `src/services/marketData.ts` (legacy compat shim over realTimeMarket) | Hardcoded `DEFAULT_QUOTES` retained only as SIMULATED fallback; do not add new symbols there | `App.tsx`, `AiWealthCopilot`, `LiveMarketTicker`, `marketHealth` | `marketProvider.test`, `marketTruth` | Partial: new code uses UnifiedMarketProvider; marketData shim pending migration |
| Health | `src/services/health/index.ts` `calculateInstitutionalHealthScore` (factor engine) | `src/services/healthScore.ts` `calculateHealthScore` (thin facade, re-exports health) | None (facade confirmed, no second math) | `PortfoliosScreen`, `pdfReport`, `scenarioEngine`, `smartAlerts`, `advisor/client360` | health tests, goldenWorkflow | Complete: facade delegates |
| Data Quality | `src/services/dataQuality/dataQualityEngine.ts` `DataQualityEngine` (async, snapshot-aware) | `src/services/advisor/dataQuality.ts` (legacy sync, `@deprecated`, no hardcoded %) | Removed hardcoded 82/96; legacy computes target-weight coverage honestly | `App.tsx` (canonical), `AdvisorCommandCenter` (legacy, to migrate) | `dataQuality.test` | Partial: CommandCenter still on legacy |
| Tax | `src/services/tax/` statutory engine (`generateInstitutionalTaxReport`) | `src/services/taxIntelligence.ts` (thin facade) | None (facade confirmed) | `TaxHarvestStudioModal`, `pdfReport` | `statutoryTaxEngine.test` | Complete |
| Risk | `src/services/risk/` | — | UI must not duplicate Sharpe/Sortino/Beta/drawdown | Portfolios, smartAlerts | risk tests | Verify no UI-local formulas |
| Performance | `src/services/performance/` (TWR/XIRR) | — | UI consumes service output only | `PerformanceChart`, reports | performance tests | Verify |
| Goals | `src/services/goals/goalEngine.ts` | — | No ad-hoc `progress>=80→88%` in UI (audit pending) | `ToolsScreen`, `GoalTableWorkstation`, Client360 | goals tests | Pending UI audit |
| Monte Carlo | `src/services/monteCarlo.ts` (seeded PRNG) | — | Keep seed/iterations/assumptions exposed | `MonteCarloModal` | monte carlo tests | Verify determinism |
| Net Worth | `src/services/netWorth.ts` | — | Prevent holding/account double-count | Workspace aggregation | netWorth tests | Verify |
| Rebalancing | `src/services/rebalancer.ts` | — | No rebalance math in components | `RebalanceModal` | rebalancer tests | Verify |
| Statement Parsing | `src/services/statementParser.ts` (`StatementParser`) | — | Single parser interface | `StatementImportModal` | parser tests | Verify |
| Client Insights | `src/services/clientInsights/` (SnapshotStore→InsightEngine→Evidence→UI) | — | No inline insight calc in App (audit: `clientInsightList` in App.tsx is legacy, to migrate) | `ClientsScreen`, Client360 | clientInsightTruth | Partial |
| AI | `src/services/aiGateway/router.ts` + `backend/server.js` `/api/ai/*` | `src/services/ai/*`, `aiAdvisor`, `aiStream` must route via gateway | Deterministic fallback is `verified-rule-engine`, never invented prose | `AiWealthCopilot`, `AiResearchScreen` | aiGateway tests | Partial |

## Market data states (canonical)

`LIVE | DELAYED | STALE | HISTORICAL | SIMULATED | UNAVAILABLE` — see
`src/services/market/quoteValidator.ts` (`getQuoteFreshnessLabel`) and
`UnifiedMarketProvider` (empty = unavailable, never fabricated).

## Acquisition-date terminology

Canonical: `acquisitionDate` (ISO 8601). `acquiredAt` is a legacy read-alias
(types + tax lots + backend). New code writes `acquisitionDate` only.
