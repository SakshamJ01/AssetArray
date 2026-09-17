# AssetArray V4.0 — Phase 4: Provider Strategy & Free-First Routing

## 1. Provider Tiering & Routing Order
1. **Local Ollama**: Zero cost, on-premise execution for privacy-first operations where available.
2. **Gemini Free / Cloud API**: High-speed, high-context free tier execution.
3. **Optional BYOK Providers**: OpenAI & Anthropic available when configured by enterprise firms.
4. **Deterministic Fallback Engine**: When all model adapters are offline, the router immediately produces a labeled `RULE-BASED SUMMARY` without infinite spinners or fake simulated answers.

## 2. Stream Lifecycle States
```
IDLE ──→ CONNECTING ──→ THINKING ──→ STREAMING ──→ COMPLETED
                             │             │
                             └──→ FAILED ──┴──→ RETRYING
```
- Cancellation tokens (`AbortSignal`) supported across all stream requests to prevent dangling network resources.
