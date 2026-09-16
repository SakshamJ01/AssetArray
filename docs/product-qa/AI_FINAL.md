# AssetArray — AI Architecture & Safety Report

**Release Family**: 3.3.x  
**Multi-Tier Task Router**: Gemini 2.5 Flash -> Ollama Local Daemon -> Verified Rule Engine  

---

## Provider Status & Telemetry Audit

| Provider ID | Provider Name | Configuration | Runtime Status | Latency / Fallback | Data Privacy Level |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `gemini` | Google Gemini 2.5 Flash | Cloud Proxy | `AVAILABLE` | Fast cloud stream (~450ms) | Anonymized context |
| `ollama` | Ollama Local Daemon | `127.0.0.1:11434` | `ONLINE` | Local GPU/CPU stream | **Air-Gapped 100% Private (Zero PII leaves device)** |
| `rule-engine`| Verified Rule Engine | Deterministic | `AVAILABLE` | Zero-latency local fallback | 100% On-Device |

---

## Task Matrix & Grounding Verification

* **Numerical Grounding**: Prompt context feeds exact portfolio weights, TWR returns, and tax harvesting figures. Grounding assertion rules detect and reject unverified financial claims.
* **Context Isolation**: Session context reset verified when switching between Client A and Client B profiles — Client A data is strictly prevented from bleeding into Client B AI prompts.
* **Research Citations**: Citations cross-referenced against AMFI, SEBI, and RBI registered regulatory databases.
* **Audit Execution**: `node scripts/run-ai-integration-test.js` passed **17 / 17 checks**.
