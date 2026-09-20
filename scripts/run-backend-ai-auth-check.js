/**
 * LIVE Backend AI Authentication Matrix
 *
 * Verifies the full chain: session -> access token -> backend -> Bearer auth ->
 * AI route -> provider, against the DEPLOYED backend. Tests missing, invalid,
 * expired-tampered, and valid tokens. Never prints tokens or secrets. A single
 * login attempt is used (auth-failure lockout is server enforced, so we never
 * guess credentials).
 *
 * Usage (requires E2E_TEST_USERNAME / E2E_TEST_PASSWORD):
 *   node scripts/run-backend-ai-auth-check.js
 */

const results = [];
function check(name, passed, details = "") {
  results.push({ name, passed, details });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${details ? "  :: " + details : ""}`);
}

function redact(text, keepLen = 24) {
  if (text == null) return "null";
  const s = String(text);
  if (s.length <= keepLen) return s.slice(0, keepLen);
  return s.slice(0, keepLen) + `…(${s.length} chars)`;
}

// base64url decode/encode without leaking the raw value
function encode(section) {
  return Buffer.from(section, "utf8").toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function decode(section) {
  return Buffer.from(section.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function tamperExpired(token) {
  const [h, p, sig] = token.split(".");
  if (!h || !p || !sig) return "tampered";
  try {
    const payload = JSON.parse(decode(p));
    payload.exp = Math.floor(Date.now() / 1000) - 3600; // expired an hour ago
    payload.iat = Math.floor(Date.now() / 1000) - 7200;
    return `${encode(h)}.${encode(JSON.stringify(payload))}.${sig}`;
  } catch {
    return "tampered";
  }
}

async function sseCollect(resp, maxMs = 45000) {
  if (!resp.ok || !resp.body) return { ok: resp.ok, status: resp.status, tokens: "", error: null };
  const reader = resp.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let text = "";
  let model = "";
  let provider = "";
  let groundedAt = "";
  let notConfigured = null;
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      try {
        const parsed = JSON.parse(t.replace(/^data:\s*/, ""));
        if (parsed.token) text += parsed.token;
        if (parsed.model) model = parsed.model;
        if (parsed.provider) provider = parsed.provider;
        if (parsed.groundedAt) groundedAt = parsed.groundedAt;
        if (parsed.notConfigured !== undefined) notConfigured = parsed.notConfigured;
        if (parsed.error) return { ok: false, status: 200, tokens: text, error: parsed.error, model, provider, groundedAt, notConfigured };
        if (parsed.done) return { ok: true, status: resp.status, tokens: text, model, provider, groundedAt, notConfigured };
      } catch {}
    }
  }
  return { ok: true, status: resp.status, tokens: text, model, provider, groundedAt, notConfigured, timedOut: true };
}

async function get(path, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const resp = await fetch(`https://assetarray.onrender.com${path}`, { method: "GET", headers });
  return resp;
}

async function post(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const resp = await fetch(`https://assetarray.onrender.com${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return resp;
}

async function main() {
  console.log("BACKEND_AI_AUTH_MATRIX_START");

  const user = process.env.E2E_TEST_USERNAME;
  const pass = process.env.E2E_TEST_PASSWORD;
  if (!user || !pass) {
    check("credentials present", false, "E2E_TEST_USERNAME/E2E_TEST_PASSWORD env required");
    process.exit(1);
  }

  // 0. Backend health
  try {
    const h = await fetch("https://assetarray.onrender.com/api/health");
    const body = await h.json();
    check("backend health reachable", h.ok && body.status === "ok", `status=${h.status} authRequired=${body.authRequired}`);
  } catch (e) {
    check("backend health reachable", false, e.message);
    process.exit(1);
  }

  // 1. Login (single attempt) -> valid tokens
  const loginResp = await post("/api/auth/login", { username: user, password: pass });
  let accessToken = null;
  let refreshToken = null;
  if (loginResp.ok) {
    const body = await loginResp.json();
    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
    check("login with valid credentials", Boolean(accessToken && refreshToken), `expiresIn=${body.expiresIn}`);
  } else {
    const body = await loginResp.json().catch(() => ({}));
    check("login with valid credentials", false, `HTTP ${loginResp.status} ${redact(body.error)}`);
    console.log("BACKEND_AI_AUTH_MATRIX=BLOCKED_NO_LOGIN");
    process.exit(1);
  }

  // 2. Missing token -> rejected
  {
    const r = await post("/api/ai/stream", { provider: "gemini", query: "test", taskType: "briefing" });
    const body = await r.json().catch(() => ({}));
    check("missing token rejected", r.status === 401, `HTTP ${r.status} ${redact(body.error)}`);
  }

  // 3. Garbage token -> rejected
  {
    const r = await post("/api/ai/stream", { provider: "gemini", query: "test", taskType: "briefing" }, "not.a.jwt");
    const body = await r.json().catch(() => ({}));
    check("garbage token rejected", r.status === 401, `HTTP ${r.status} ${redact(body.error)}`);
  }

  // 4. Expired-tampered token -> rejected (signature also invalid; observable = 401)
  {
    const tampered = tamperExpired(accessToken);
    const r = await post("/api/ai/stream", { provider: "gemini", query: "test", taskType: "briefing" }, tampered);
    const body = await r.json().catch(() => ({}));
    check("expired/tampered token rejected", r.status === 401, `HTTP ${r.status} ${redact(body.error)}`);
  }

  // 5. Valid token -> /api/auth/me accepted
  {
    const r = await get("/api/auth/me", accessToken);
    const body = await r.json().catch(() => ({}));
    const username = (body.user && body.user.username) || (body.error || "");
    check("valid token /api/auth/me", r.ok && body.ok === true, `HTTP ${r.status} user=${redact(username)} role=${(body.user && body.user.role) || "?"}`);
  }

  // 6. Valid token -> /api/ai/status accepted
  {
    const r = await get("/api/ai/status", accessToken);
    const body = await r.json().catch(() => ({}));
    const gemini = body.gemini;
    check(
      "valid token /api/ai/status",
      r.ok && gemini,
      `HTTP ${r.status} gemini=${(gemini && gemini.status) || "?"} models=${(gemini && JSON.stringify(gemini.models)) || "?"}`
    );
  }

  // 7. Valid token -> real Gemini stream
  {
    const r = await post(
      "/api/ai/stream",
      {
        provider: "gemini",
        query: "Summarize portfolio health in one short sentence. Do not invent numbers.",
        taskType: "briefing",
        portfolioContext: { totalAum: 1000000, healthScore: 72, criticalAlertsCount: 0 },
        clientContext: { name: "Verification Client", riskProfile: "Growth" },
      },
      accessToken
    );
    const out = await sseCollect(r);
    const cleanText = out.tokens.split("<REDACTED>").join("").trim();
    const leakedCred =
      out.tokens.includes(accessToken) || /AIza[0-9A-Za-z-_]{33}/.test(out.tokens) || /sk-[A-Za-z0-9]{20,}/.test(out.tokens);
    const nonAuthError = !/401|unauthor|invalid token|access denied/i.test(cleanText);
    check("valid token -> live Gemini stream", out.ok && out.provider === "gemini" && out.tokens.length > 5, `provider=${out.provider}/${out.model} bytes=${out.tokens.length} groundedAt=${out.groundedAt ? "yes" : "no"} timedOut=${out.timedOut ? "yes" : "no"}`);
    check("stream response is not an auth error", nonAuthError, `snippet="${redact(cleanText, 60)}"`);
    check("no credential leakage in stream", !leakedCred, leakedCred ? "CREDENTIAL LEAK DETECTED" : "clean");
  }

  // 8. Unconfigured provider (openai) -> explicit honest error, no secrets, no fabrication
  {
    const r = await post(
      "/api/ai/stream",
      { provider: "openai", query: "Test fallback path.", taskType: "briefing", portfolioContext: { totalAum: 500000, healthScore: 70, criticalAlertsCount: 1 } },
      accessToken
    );
    const out = await sseCollect(r);
    const cleanText = (out.error || out.tokens || "").split("<REDACTED>").join("").trim();
    const explicit = out.notConfigured === true && /not configured/i.test(cleanText);
    const leaked = out.tokens.includes(accessToken) || /AIza[0-9A-Za-z-_]{33}/.test(out.tokens);
    check("unconfigured provider explicit error (no silent fabrication)", explicit, `notConfigured=${out.notConfigured === true ? "explicit" : "none"} error="${redact(cleanText, 60)}"`);
    check("unconfigured provider leaks no credentials", !leaked, "clean");
  }

  const passed = results.filter((r) => r.passed).length;
  console.log(`BACKEND_AI_AUTH_MATRIX=${passed === results.length ? "PASS" : "FAIL"}  (${passed}/${results.length})`);
}

main().catch((e) => {
  console.log("BACKEND_AI_AUTH_MATRIX=FAIL");
  console.log("FATAL:", redact(e.message, 120));
  process.exit(1);
});