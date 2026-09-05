# AssetArray — Free-First & Zero-Subscription Setup Guide

This guide details how to configure, develop, test, and run AssetArray in a **100% Free-First / Zero-Subscription** environment without paying for AI models or commercial market feeds.

---

## Architecture Overview

```
                          ┌───────────────────────────┐
                          │   AssetArray Workstation  │
                          └─────────────┬─────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
     ┌──────────────────────┐                      ┌──────────────────────┐
     │  Deterministic Core  │                      │    Free AI Gateway   │
     │  (100% Free & Local) │                      └──────────┬───────────┘
     └──────────┬───────────┘                                 │
                │                               ┌─────────────┴─────────────┐
        ┌───────┴───────┐                       ▼                           ▼
        ▼               ▼            ┌────────────────────┐      ┌────────────────────┐
  AMFI Open NAV   CAS/CSV Import     │ Tier 1: Gemini Free│      │ Tier 2: Ollama Local│
  (Zero-Key MF)   (Local Parser)     │ (Google AI Studio) │      │ (localhost:11434)  │
                                     └──────────┬─────────┘      └──────────┬─────────┘
                                                │                           │
                                                └─────────────┬─────────────┘
                                                              ▼
                                                 ┌────────────────────────┐
                                                 │ Tier 3: Rule Engine    │
                                                 │ (Instant & Deterministic)
                                                 └────────────────────────┘
```

---

## 1. Free Cloud AI: Google Gemini Developer Tier

Google AI Studio provides a free API tier with generous rate limits and free input/output tokens on eligible models.

### Step 1: Obtain a Free Key
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with any Google account and click **Get API key**.
3. Create a key in a new or existing Google Cloud project.

### Step 2: Configure Server Environment
In `backend/.env`:
```env
GEMINI_API_KEY=AIzaSy...your_gemini_key_here
AI_GEMINI_FAST_MODEL=gemini-2.5-flash
AI_GEMINI_RESEARCH_MODEL=gemini-2.5-pro
```

### Free Quota Characteristics
- **Gemini 2.5 Flash**: Fast summaries, client insights, tax explanations, portfolio Q&A. Free input/output within daily quotas.
- **Gemini 2.5 Pro**: Deep research and institutional memo generation.
- **Zero Token Fees**: Free tier models incur $0.00 during development.

---

## 2. Local AI: Ollama Daemon (Zero-Cost & Offline)

Ollama runs open-weight LLMs directly on your workstation GPU/CPU with zero network latency, zero per-token cost, and absolute data privacy (zero PII leaves your machine).

### Step 1: Install Ollama
- **Windows**: Download the installer from [ollama.com/download/windows](https://ollama.com/download/windows).
- **macOS / Linux**:
  ```bash
  curl -fsSL https://ollama.com/install.sh | sh
  ```

### Step 2: Pull a Recommended Model
Open your terminal and run:
```bash
# Lightweight and high-performance (default)
ollama pull llama3.2

# Alternatively, for advanced instruction following:
ollama pull mistral
# or
ollama pull qwen2.5:7b
```

### Step 3: Configure Server Environment
In `backend/.env`:
```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

### Fallback Behavior
If the Gemini API key is omitted, rate-limited, or your workstation is offline, the gateway automatically routes requests to your local Ollama daemon. If Ollama is not running, the system transparently falls back to the deterministic rule engine (`verified-rule-engine`).

---

## 3. Free Financial & Market Data Layer

AssetArray does not require expensive Bloomberg or Refinitiv terminals.

### Official Indian Mutual Fund NAV (AMFI Open Data)
- **Status**: **Built-in & Always Active**. Zero API keys needed.
- **Coverage**: All Indian mutual fund schemes (SBI, HDFC, ICICI Prudential, Nippon India, Parag Parikh, Mirae Asset, Axis, etc.).
- **Identifier Support**: AMFI Scheme Codes (e.g. `122639`), ISINs (e.g. `INF879O01027`), or scheme names.
- **Provider**: [`AmfiNavProvider`](file:///c:/Users/Saksham/Documents/New%20project/src/services/market/amfiNavProvider.ts).

### Finnhub Free Developer Tier (US / Global Equities & FX)
- **Status**: Free developer account (60 requests/minute).
- **Sign-up**: [finnhub.io/register](https://finnhub.io/register).
- In `backend/.env`:
  ```env
  FINNHUB_API_KEY=your_finnhub_free_token
  ```

### Alpha Vantage Free Tier (EOD Equity Quotes)
- **Status**: Free tier (25 requests/day standard; open-source educational grants available).
- **Sign-up**: [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key).
- In `backend/.env`:
  ```env
  ALPHA_VANTAGE_API_KEY=your_alpha_vantage_free_key
  ```

### Client Portfolio Ingestion (CAS & CSV)
- Real clients can be imported directly using standard CAMS/KFintech Consolidated Account Statements (CAS) or custom broker CSVs via the **Import Statement** feature.

---

## 4. Complete `.env` Configuration Template

Save the following as `backend/.env`:

```env
# ==========================================
# AssetArray Backend Environment Config
# Free-First / Zero-Subscription Setup
# ==========================================

# Server & Security
PORT=4000
NODE_ENV=development
AUTH_REQUIRED=false
TOKEN_SECRET=asset-array-dev-secret-change-in-production
REFRESH_SECRET=asset-array-dev-refresh-secret-change-in-production

# Persistence (Local MongoDB or MongoDB Atlas Free Tier M0)
MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DB_NAME=asset_array

# ------------------------------------------
# Tier 1: Free Cloud AI (Google Gemini)
# Obtain free at https://aistudio.google.com/
# ------------------------------------------
GEMINI_API_KEY=
AI_GEMINI_FAST_MODEL=gemini-2.5-flash
AI_GEMINI_RESEARCH_MODEL=gemini-2.5-pro

# ------------------------------------------
# Tier 2: Free Local AI (Ollama)
# Install from https://ollama.com
# ------------------------------------------
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2

# ------------------------------------------
# Free Market Data Providers
# ------------------------------------------
# Finnhub free key (60 calls/min): https://finnhub.io/
FINNHUB_API_KEY=
# Alpha Vantage free key (25 calls/day): https://www.alphavantage.co/
ALPHA_VANTAGE_API_KEY=

# ------------------------------------------
# Optional Paid AI Providers (STRICTLY OPTIONAL)
# Defaults to NOT_CONFIGURED
# ------------------------------------------
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

---

## 5. Verification Commands

To verify your free-first setup, execute the following commands in the project root:

```bash
# 1. Run all unit and truth tests
npm test

# 2. Verify TypeScript types
npm run typecheck

# 3. Build the web production bundle
npm run build:web

# 4. Check backend syntax
node --check backend/server.js
```
