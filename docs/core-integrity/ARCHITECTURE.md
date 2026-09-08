# Architecture (3.3.x core-integrity)

```
Frontend (Expo RN + Web)
  App.tsx (shell: providers, auth gate, routing via src/navigation/tabs)
  ├─ screens/ (route-mounted only when activeTab matches — lazy mount)
  ├─ features/advisor/ (CommandCenter incl. CommandPalette)
  ├─ components/ (modals mount only when open)
  └─ Domain services (one home per domain)
       auth → platform/auth + secureSync
       market → market/marketProvider (canonical) + realTimeMarket (stream) + marketData (deprecated shim)
       performance/risk/tax/goals/health/dataQuality/insights/ai/reports
            ↓  authorizedFetch (Bearer header only, 401 refresh retry)
API (backend/server.js + backend/config/env.js)
  auth/login|refresh|logout|me → sync → broadcast → ai/research|stream|status
            ↓  Mongo driver ( single DB: asset_array )
Persistence (Mongo: users, refresh_sessions, encrypted_sync_blobs, campaigns, audit, research, advisor_*)
            ↓  External providers (Gemini/OpenAI/Anthropic/Ollama, Finnhub/AMFI — all optional, timeouts, honest status)
```

Persistence roles: Mongo = server truth; AsyncStorage = local cache (plaintext, debounced 800ms);
SecureStore = secrets (explicit fallback, never silent); snapshots capped 2000 with bulk reads.
Realtime: one central `realTimeMarket` subscription; App tick handler throttled 5s, skips hidden
tabs and untouched symbols. DataQuality runs off bulk snapshot counts, not N+1 reads.
