/**
 * LIVE Gemini Provider Configuration Verification
 *
 * Uses the exact same SDK and environment variables as backend/server.js to
 * perform a REAL authenticated provider check. Never prints or logs the API
 * key. Any SDK error string is redacted before output because Google's error
 * responses can echo back the supplied key.
 *
 * Usage:
 *   node scripts/verify-gemini.js
 *   (run from the backend/ directory so backend/.env is loaded)
 */
require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const key = process.env.GEMINI_API_KEY || "";
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const fastModel = process.env.AI_GEMINI_FAST_MODEL || model;
const researchModel = process.env.AI_GEMINI_RESEARCH_MODEL || "gemini-2.5-pro";

function redact(text, secret) {
  if (!secret) return text;
  return String(text).split(secret).join("<REDACTED>");
}

async function main() {
  console.log("GEMINI_PROVIDER_CHECK_START");
  console.log(`configured=${key.length > 0} keyLength=${key.length}`);
  console.log(`configuredFastModel=${fastModel} configuredResearchModel=${researchModel}`);

  if (!key) {
    console.log("GEMINI_PROVIDER_CHECK=FAIL");
    console.log("FAILURE=missing_key");
    process.exit(1);
  }

  // This is required by some network environments; not part of any secret.
  console.log(`sdk=@google/genai modelFlavor=${model}`);

  const gemini = new GoogleGenAI({ apiKey: key });

  const attempt = async (targetModel, probe) => {
    const started = Date.now();
    try {
      const resp = await gemini.models.generateContent({
        model: targetModel,
        contents: probe,
        config: { temperature: 0.1 },
      });
      const text = (resp && resp.text ? String(resp.text).trim() : "").slice(0, 60);
      return { ok: true, ms: Date.now() - started, text, error: null };
    } catch (err) {
      return {
        ok: false,
        ms: Date.now() - started,
        text: null,
        error: redact(err && err.message ? err.message : String(err), key).slice(0, 300),
      };
    }
  };

  const probe = "Reply with exactly: OK";

  const fast = await attempt(fastModel, probe);
  console.log(`CHECK fast model="${fastModel}" -> status=${fast.ok ? "SUCCESS" : "ERROR"} ms=${fast.ms}`);
  if (!fast.ok) {
    console.log("FAILURE_REASON fast=" + JSON.stringify(fast.error));
  } else {
    console.log(`FAST_RESPONSE=${JSON.stringify(fast.text)}`);
  }

  const research = await attempt(researchModel, probe);
  console.log(`CHECK research model="${researchModel}" -> status=${research.ok ? "SUCCESS" : "ERROR"} ms=${research.ms}`);
  if (!research.ok) {
    console.log("FAILURE_REASON research=" + JSON.stringify(research.error));
  } else {
    console.log(`RESEARCH_RESPONSE=${JSON.stringify(research.text)}`);
  }

  // Use a branding note in the response to prove a genuine model answered.
  const authProbe =
    "Respond with the single word VERIFIED_GEMINI if this is a live model generation.";
  const verifier = await attempt(fastModel, authProbe);
  const genuinelyAuthenticated = verifier.ok && /VERIFIED_GEMINI/.test(verifier.text || "");

  if (fast.ok && research.ok && genuinelyAuthenticated) {
    console.log("GEMINI_PROVIDER_CHECK=PASS");
  } else if (fast.ok || research.ok) {
    console.log("GEMINI_PROVIDER_CHECK=PASS_PARTIAL");
  } else {
    console.log("GEMINI_PROVIDER_CHECK=FAIL");
  }
  console.log("GEMINI_PROVIDER_CHECK_END");
}

main().catch((err) => {
  console.log("GEMINI_PROVIDER_CHECK=FAIL");
  console.log("FAILURE=unexpected " + redact(err && err.message ? err.message : String(err), key).slice(0, 300));
  process.exit(1);
});