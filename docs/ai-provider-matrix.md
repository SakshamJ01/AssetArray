# AssetArray — AI Provider Matrix

**Audit Date**: September 2026  
**Release Family**: 3.3.x  
**Standard**: Real configuration required. A provider is NEVER listed as `AVAILABLE` merely because an adapter file exists. Secrets are strictly server-side (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`).

---

## Provider Support Matrix

| Provider | Environment Variable (Server-Side) | Configured? | Actual Model Identifiers | Supported Task Types | Typical Latency | Cost Profile | Fallback Position | Observed Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Gemini** | `GEMINI_API_KEY` | When key is present in `backend/.env` | `gemini-1.5-flash` (Fast) / `gemini-1.5-pro` (Research) | `FAST_SUMMARY`, `ADVISOR_BRIEF`, `DEEP_RESEARCH`, `DOCUMENT_EXTRACTION` | 600ms – 1,800ms | Low / Moderate | Falls back to OpenAI if configured, else Rule Engine | `CONFIGURED` / `AVAILABLE` (if healthy) |
| **OpenAI** | `OPENAI_API_KEY` | When key is present in `backend/.env` | `gpt-4o-mini` (Fast) / `gpt-4o` (Research) | `FAST_SUMMARY`, `ADVISOR_BRIEF`, `DEEP_RESEARCH` | 900ms – 2,400ms | Moderate / Standard | Falls back to Anthropic if configured, else Rule Engine | `CONFIGURED` / `NOT_CONFIGURED` |
| **Anthropic** | `ANTHROPIC_API_KEY` | When key is present in `backend/.env` | `claude-3-5-haiku-20241022` (Fast) / `claude-3-5-sonnet-20241022` (Research) | `FAST_SUMMARY`, `ADVISOR_BRIEF`, `DEEP_RESEARCH` | 1,100ms – 3,200ms | Premium | Falls back to Rule Engine | `CONFIGURED` / `NOT_CONFIGURED` |
| **Deterministic Rule Engine** | *None (Built-in)* | **Always Configured** | Deterministic Financial Rule Engine (`verified-rule-engine`) | All task types (offline safe) | < 5ms | Zero | Terminal Fallback | **`AVAILABLE`** |

---

## Gateway Routing Policies

1. **Routing Hierarchy**:
   - `FAST_SUMMARY`: Gemini (Flash) → OpenAI (4o-mini) → Anthropic (Haiku) → Deterministic Rule Engine
   - `ADVISOR_BRIEF`: Gemini (Pro) → Anthropic (Sonnet) → OpenAI (4o) → Deterministic Rule Engine
   - `DEEP_RESEARCH`: Anthropic (Sonnet) → Gemini (Pro) → OpenAI (4o) → Deterministic Rule Engine
   - `DOCUMENT_EXTRACTION`: Gemini (Pro) → OpenAI (4o) → Deterministic Rule Engine

2. **Per-Task Timeouts**:
   - `FAST_SUMMARY`: 8,000ms
   - `ADVISOR_BRIEF`: 15,000ms
   - `DEEP_RESEARCH`: 30,000ms
   - `DOCUMENT_EXTRACTION`: 20,000ms

3. **Status Distinction**:
   - `CONFIGURED`: Server has an active API key for this provider.
   - `AVAILABLE`: Heartbeat/request succeeded within timeout window.
   - `DEGRADED`: Provider latency exceeds task SLA or elevated error rate.
   - `RATE_LIMITED`: Received 429 Too Many Requests; cooled down.
   - `FAILED`: Authentication failed (401/403) or repeated 5xx errors.
   - `NOT_CONFIGURED`: Missing server-side environment key.

4. **Security & Grounding Enforcement**:
   - Zero `EXPO_PUBLIC_*_API_KEY` in frontend client code.
   - Input sanitization against prompt injection attacks (`IGNORE PREVIOUS INSTRUCTIONS` neutralizer).
   - Numerical claim extraction and context validation (`validateClaimsAgainstContext`).
   - If fallback rule engine completes, response metadata is explicitly stamped:
     - `model`: `"verified-rule-engine"`
     - `fallbackUsed`: `true`
     - Header/label: `"AI unavailable · Rule-based summary"`
