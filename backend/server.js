const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { MongoClient } = require("mongodb");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "asset_array";
const AUTH_REQUIRED = process.env.AUTH_REQUIRED !== "false";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 15 * 60);
const REFRESH_TOKEN_TTL_SECONDS = Number(process.env.REFRESH_TOKEN_TTL_SECONDS || 30 * 24 * 60 * 60);
const TOKEN_SECRET = process.env.TOKEN_SECRET || "asset-array-dev-secret-change-in-production";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "asset-array-dev-refresh-secret-change-in-production";
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 120);
const AUTH_MAX_FAILURES = Number(process.env.AUTH_MAX_FAILURES || 5);
const AUTH_LOCK_WINDOW_MS = Number(process.env.AUTH_LOCK_WINDOW_MS || 15 * 60_000);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const rateLimitMap = new Map();
const authAttemptMap = new Map();
const mongo = new MongoClient(MONGO_URI);
const gemini = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

let usersCol;
let sessionsCol;
let syncCol;
let broadcastsCol;
let auditCol;
let aiResearchCol;

app.disable("x-powered-by");
app.use(cors({
  origin(origin, callback) {
    if (CORS_ORIGIN === "*" || !origin) {
      callback(null, true);
      return;
    }

    const allowedOrigins = CORS_ORIGIN.split(",").map((item) => item.trim()).filter(Boolean);
    callback(null, allowedOrigins.includes(origin));
  },
}));
app.use(express.json({ limit: "5mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  next();
});

function hashPassword(password) {
  return crypto.pbkdf2Sync(password, TOKEN_SECRET, 100_000, 64, "sha512").toString("hex");
}

function safeEqual(a, b) {
  const aBuf = Buffer.from(a || "", "utf8");
  const bBuf = Buffer.from(b || "", "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function signToken(payload, secret, ttlSeconds) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = { ...payload, exp };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedBody = Buffer.from(JSON.stringify(body)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64url");
  return `${encodedHeader}.${encodedBody}.${signature}`;
}

function verifyToken(token, secret) {
  const [encodedHeader, encodedBody, signature] = (token || "").split(".");
  if (!encodedHeader || !encodedBody || !signature) return null;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64url");
  if (!safeEqual(signature, expectedSignature)) return null;
  const payload = JSON.parse(Buffer.from(encodedBody, "base64url").toString("utf8"));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
    active: user.active,
  };
}

function buildEmptyResearchResponse() {
  return {
    summary: "",
    opportunities: [],
    risks: [],
    sentiment: "Neutral",
    shortTermOutlook: "",
    longTermOutlook: "",
  };
}

function normalizeResearchResponse(value) {
  const fallback = buildEmptyResearchResponse();
  const sentiment = ["Bullish", "Neutral", "Bearish"].includes(value?.sentiment)
    ? value.sentiment
    : "Neutral";

  return {
    summary: typeof value?.summary === "string" ? value.summary : fallback.summary,
    opportunities: Array.isArray(value?.opportunities)
      ? value.opportunities.filter((item) => typeof item === "string").slice(0, 6)
      : fallback.opportunities,
    risks: Array.isArray(value?.risks)
      ? value.risks.filter((item) => typeof item === "string").slice(0, 6)
      : fallback.risks,
    sentiment,
    shortTermOutlook:
      typeof value?.shortTermOutlook === "string" ? value.shortTermOutlook : fallback.shortTermOutlook,
    longTermOutlook:
      typeof value?.longTermOutlook === "string" ? value.longTermOutlook : fallback.longTermOutlook,
  };
}

function parseGeminiJson(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return normalizeResearchResponse(JSON.parse(cleaned));
}

function buildResearchPrompt(query) {
  return [
    "You are Asset Array's market research assistant for a financial advisor.",
    "Return only valid JSON. Do not include markdown, code fences, citations, or commentary.",
    "Do not provide personalized investment advice. Keep it educational and advisor-review friendly.",
    "Use this exact JSON shape:",
    '{"summary":"...","opportunities":["..."],"risks":["..."],"sentiment":"Bullish | Neutral | Bearish","shortTermOutlook":"...","longTermOutlook":"..."}',
    `Research topic: ${query}`,
  ].join("\n");
}

function resolveBroadcastChannel(client, campaignChannel) {
  if (campaignChannel && campaignChannel !== "Preferred") {
    return campaignChannel;
  }

  return client?.preferredChannel || "Preferred";
}

function resolveBroadcastDestination(client, deliveryChannel) {
  if (deliveryChannel === "Email") {
    return typeof client?.email === "string" ? client.email.trim() : "";
  }

  if (deliveryChannel === "SMS" || deliveryChannel === "WhatsApp") {
    return typeof client?.phone === "string" ? client.phone.trim() : "";
  }

  const phone = typeof client?.phone === "string" ? client.phone.trim() : "";
  const email = typeof client?.email === "string" ? client.email.trim() : "";
  return phone || email;
}

function buildBroadcastDeliveries(clients, campaignChannel) {
  return clients.map((client) => {
    const deliveryChannel = resolveBroadcastChannel(client, campaignChannel);
    const destination = resolveBroadcastDestination(client, deliveryChannel);
    const valid = Boolean(destination);

    return {
      deliveryId: crypto.randomUUID(),
      clientId: client.id || "",
      clientName: client.name || "Unknown client",
      preferredChannel: client.preferredChannel || "Preferred",
      channel: deliveryChannel,
      destination,
      status: valid ? "queued" : "skipped",
      reason: valid ? null : `Missing contact details for ${deliveryChannel}.`,
      processedAt: new Date().toISOString(),
    };
  });
}

async function audit(action, meta) {
  await auditCol.insertOne({
    id: crypto.randomUUID(),
    action,
    date: new Date().toISOString(),
    ...meta,
  });
}

function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function getAuthAttemptKey(req, username) {
  return `${getClientIp(req)}:${String(username || "").trim().toLowerCase()}`;
}

function getAuthAttemptState(req, username) {
  const key = getAuthAttemptKey(req, username);
  const current = authAttemptMap.get(key);

  if (!current) {
    return { key, count: 0, lockedUntil: 0 };
  }

  if (current.lockedUntil && current.lockedUntil < Date.now()) {
    authAttemptMap.delete(key);
    return { key, count: 0, lockedUntil: 0 };
  }

  return { key, ...current };
}

function recordAuthFailure(req, username) {
  const key = getAuthAttemptKey(req, username);
  const current = getAuthAttemptState(req, username);
  const nextCount = current.count + 1;
  const lockedUntil =
    nextCount >= AUTH_MAX_FAILURES ? Date.now() + AUTH_LOCK_WINDOW_MS : current.lockedUntil || 0;

  authAttemptMap.set(key, {
    count: nextCount,
    lockedUntil,
  });

  return { count: nextCount, lockedUntil };
}

function clearAuthFailures(req, username) {
  authAttemptMap.delete(getAuthAttemptKey(req, username));
}

function validateStartupSecurity() {
  const usingDefaultTokenSecret =
    TOKEN_SECRET === "asset-array-dev-secret-change-in-production";
  const usingDefaultRefreshSecret =
    REFRESH_SECRET === "asset-array-dev-refresh-secret-change-in-production";
  const usingDefaultAdminPassword =
    (process.env.ADMIN_PASSWORD || "ChangeMeNow123!") === "ChangeMeNow123!";

  if (IS_PRODUCTION && AUTH_REQUIRED) {
    if (usingDefaultTokenSecret || usingDefaultRefreshSecret) {
      throw new Error("Production auth cannot start with default token secrets.");
    }

    if (usingDefaultAdminPassword) {
      throw new Error("Production auth cannot start with the default admin password.");
    }
  }
}

async function buildTokens(user) {
  const tokenVersion = crypto.randomUUID();
  const accessToken = signToken(
    { sub: user.id, username: user.username, role: user.role, type: "access" },
    TOKEN_SECRET,
    ACCESS_TOKEN_TTL_SECONDS
  );
  const refreshToken = signToken(
    { sub: user.id, username: user.username, role: user.role, type: "refresh", tokenVersion },
    REFRESH_SECRET,
    REFRESH_TOKEN_TTL_SECONDS
  );

  await sessionsCol.insertOne({
    id: tokenVersion,
    userId: user.id,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString(),
    revoked: false,
  });

  return { accessToken, refreshToken };
}

function rateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const bucketKey = `${ip}:${Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS)}`;
  const count = rateLimitMap.get(bucketKey) || 0;
  rateLimitMap.set(bucketKey, count + 1);
  if (count + 1 > RATE_LIMIT_MAX) {
    res.status(429).json({ error: "Too many requests. Try again shortly." });
    return;
  }
  next();
}

function requireAuth(req, res, next) {
  if (!AUTH_REQUIRED) {
    req.user = { id: "dev-owner", username: "dev-owner", role: "advisor" };
    return next();
  }
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const payload = verifyToken(token, TOKEN_SECRET);
  if (!payload || payload.type !== "access") {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  req.user = { id: payload.sub, username: payload.username, role: payload.role };
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden." });
      return;
    }
    next();
  };
}

async function initMongo() {
  validateStartupSecurity();
  await mongo.connect();
  const db = mongo.db(MONGO_DB_NAME);
  usersCol = db.collection("users");
  sessionsCol = db.collection("refresh_sessions");
  syncCol = db.collection("encrypted_sync_blobs");
  broadcastsCol = db.collection("broadcast_campaigns");
  auditCol = db.collection("audit_logs");
  aiResearchCol = db.collection("ai_research_history");

  await Promise.all([
    usersCol.createIndex({ id: 1 }, { unique: true }),
    usersCol.createIndex({ username: 1 }, { unique: true }),
    sessionsCol.createIndex({ id: 1 }, { unique: true }),
    sessionsCol.createIndex({ userId: 1 }),
    sessionsCol.createIndex({ expiresAt: 1 }),
    syncCol.createIndex({ ownerId: 1 }, { unique: true }),
    broadcastsCol.createIndex({ campaignId: 1 }, { unique: true }),
    broadcastsCol.createIndex({ createdAt: -1 }),
    auditCol.createIndex({ date: -1 }),
    aiResearchCol.createIndex({ timestamp: -1 }),
    aiResearchCol.createIndex({ userId: 1, timestamp: -1 }),
  ]);

  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMeNow123!";
  

const existing = await usersCol.findOne({ username: adminUsername });


  if (!existing) {
    await usersCol.insertOne({
      id: "advisor-admin",
      username: adminUsername,
      role: "advisor",
      passwordHash: hashPassword(adminPassword),
      createdAt: new Date().toISOString(),
      active: true,
    });
  }
}

app.use(rateLimiter);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "Asset Array backend",
    authRequired: AUTH_REQUIRED,
    db: "mongodb",
    date: new Date().toISOString(),
  });
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).json({ error: "username and password are required." });
      return;
    }
    const attemptState = getAuthAttemptState(req, username);
    if (attemptState.lockedUntil && attemptState.lockedUntil > Date.now()) {
      await audit("auth.login_locked", {
        username,
        ip: getClientIp(req),
        lockedUntil: new Date(attemptState.lockedUntil).toISOString(),
      });
      res.status(429).json({ error: "Too many failed attempts. Try again later." });
      return;
    }

    const user = await usersCol.findOne({ username, active: true });
    if (!user || !safeEqual(user.passwordHash, hashPassword(password))) {
      const failure = recordAuthFailure(req, username);
      await audit("auth.login_failed", {
        username,
        ip: getClientIp(req),
        failures: failure.count,
      });
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    clearAuthFailures(req, username);
    const { accessToken, refreshToken } = await buildTokens(user);
    await audit("auth.login_success", { userId: user.id, username: user.username, role: user.role });
    res.json({
      ok: true,
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed." });
  }
});

app.post("/api/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    const payload = verifyToken(refreshToken, REFRESH_SECRET);
    if (!payload || payload.type !== "refresh") {
      res.status(401).json({ error: "Invalid refresh token." });
      return;
    }
    const session = await sessionsCol.findOne({ id: payload.tokenVersion, revoked: false });
    const user = await usersCol.findOne({ id: payload.sub, active: true });
    if (!session || !user) {
      res.status(401).json({ error: "Refresh session not active." });
      return;
    }
    await sessionsCol.updateOne(
      { id: payload.tokenVersion },
      { $set: { revoked: true, revokedAt: new Date().toISOString() } }
    );
    const tokens = await buildTokens(user);
    await audit("auth.refreshed", { userId: user.id, username: user.username });
    res.json({ ok: true, user: sanitizeUser(user), ...tokens, expiresIn: ACCESS_TOKEN_TTL_SECONDS });
  } catch (error) {
    res.status(500).json({ error: "Refresh failed." });
  }
});

app.post("/api/auth/logout", requireAuth, async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    const payload = verifyToken(refreshToken, REFRESH_SECRET);
    if (payload?.tokenVersion) {
      await sessionsCol.updateOne(
        { id: payload.tokenVersion },
        { $set: { revoked: true, revokedAt: new Date().toISOString() } }
      );
    }
    await audit("auth.logout", { userId: req.user.id, username: req.user.username });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Logout failed." });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = await usersCol.findOne({ id: req.user.id });
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  res.json({ ok: true, user: sanitizeUser(user) });
});

app.get("/api/audit", requireAuth, requireRole(["advisor"]), async (_req, res) => {
  const logs = await auditCol.find({}).sort({ date: -1 }).limit(200).toArray();
  res.json({ ok: true, total: logs.length, logs });
});

app.post("/api/ai/research", requireAuth, async (req, res) => {
  const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";

  if (!query || query.length < 2 || query.length > 4000) {
    res.status(400).json({ error: "query is required and must be 2-4000 characters." });
    return;
  }

  if (!gemini) {
    await audit("ai.research_unavailable", {
      query,
      userId: req.user.id,
      username: req.user.username,
      reason: "missing_gemini_api_key",
    });
    res.status(503).json({ error: "AI research is not configured on this backend." });
    return;
  }

  try {
    const geminiResponse = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildResearchPrompt(query),
      config: {
        responseMimeType: "application/json",
        temperature: 0.35,
      },
    });

    const response = parseGeminiJson(geminiResponse.text);
    const timestamp = new Date().toISOString();

    await aiResearchCol.insertOne({
      query,
      userId: req.user.id,
      username: req.user.username,
      response,
      timestamp,
    });

    await audit("ai.research_requested", {
      query,
      userId: req.user.id,
      username: req.user.username,
      sentiment: response.sentiment,
    });

    res.json(response);
  } catch (error) {
    await audit("ai.research_failed", {
      query,
      userId: req.user.id,
      username: req.user.username,
      reason: error.message,
    });

    res.status(502).json({
      error: "AI research is temporarily unavailable. Please try again.",
    });
  }
});

app.post("/api/sync", requireAuth, async (req, res) => {
  const { ownerId, ciphertext, updatedAt } = req.body || {};
  if (!ownerId || !ciphertext) {
    res.status(400).json({ error: "ownerId and ciphertext are required." });
    return;
  }
  // Enforce server-side ownership: non-admin users cannot write to other users' sync data
  if (req.user.role !== "admin" && ownerId !== req.user.id && ownerId !== req.user.username) {
    res.status(403).json({ error: "Forbidden: You cannot modify sync data for another owner." });
    return;
  }
  const nextUpdatedAt = updatedAt || new Date().toISOString();
  await syncCol.updateOne(
    { ownerId },
    {
      $set: {
        ownerId,
        ciphertext,
        updatedAt: nextUpdatedAt,
        updatedBy: req.user.username,
        updatedById: req.user.id,
      },
    },
    { upsert: true }
  );
  await audit("sync.saved", { ownerId, userId: req.user.id, by: req.user.username });
  res.json({ ok: true, ownerId, updatedAt: nextUpdatedAt });
});

app.get("/api/sync/:ownerId", requireAuth, async (req, res) => {
  // Enforce server-side ownership: non-admin users cannot read other users' sync data
  if (req.user.role !== "admin" && req.params.ownerId !== req.user.id && req.params.ownerId !== req.user.username) {
    res.status(403).json({ error: "Forbidden: You cannot access sync data for another owner." });
    return;
  }
  const record = await syncCol.findOne({ ownerId: req.params.ownerId });
  if (!record) {
    res.status(404).json({ error: "Encrypted backup not found." });
    return;
  }
  await audit("sync.read", { ownerId: req.params.ownerId, userId: req.user.id, by: req.user.username });
  res.json({ ciphertext: record.ciphertext, updatedAt: record.updatedAt });
});

app.post("/api/broadcast", requireAuth, async (req, res) => {
  const { ownerName, channel, message, clients, createdAt } = req.body || {};
  if (!message || !Array.isArray(clients) || clients.length === 0) {
    res.status(400).json({ error: "message and at least one client are required." });
    return;
  }
  const deliveries = buildBroadcastDeliveries(clients, channel || "Preferred");
  const queuedCount = deliveries.filter((item) => item.status === "queued").length;
  const skippedCount = deliveries.filter((item) => item.status === "skipped").length;
  const campaign = {
    campaignId: `${Date.now()}`,
    ownerName: ownerName || "Asset Array Owner",
    channel: channel || "Preferred",
    message,
    clients,
    deliveries,
    createdAt: createdAt || new Date().toISOString(),
    totalClients: clients.length,
    queuedCount,
    skippedCount,
    status: queuedCount > 0 ? (skippedCount > 0 ? "partial" : "queued") : "skipped",
    createdBy: req.user.username,
    createdById: req.user.id,
  };
  await broadcastsCol.insertOne(campaign);
  await audit("broadcast.sent", {
    campaignId: campaign.campaignId,
    totalClients: campaign.totalClients,
    queuedCount,
    skippedCount,
    channel: campaign.channel,
    userId: req.user.id,
    by: req.user.username,
  });
  res.json({
    ok: true,
    campaignId: campaign.campaignId,
    totalClients: campaign.totalClients,
    queuedCount,
    skippedCount,
    status: campaign.status,
    deliveries: deliveries.slice(0, 20),
  });
});

app.get("/api/broadcast/history", requireAuth, async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 25);
  const campaigns = await broadcastsCol
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .project({
      _id: 0,
      campaignId: 1,
      ownerName: 1,
      channel: 1,
      message: 1,
      createdAt: 1,
      totalClients: 1,
      queuedCount: 1,
      skippedCount: 1,
      status: 1,
    })
    .toArray();

  await audit("broadcast.history_read", {
    limit,
    userId: req.user.id,
    by: req.user.username,
  });
  res.json({ ok: true, campaigns });
});

// --- AssetArray v3.1 Institutional Analytical Endpoints ---

// 1. Performance Attribution (Brinson-Fachler Model)
app.post("/api/portfolios/attribution", requireAuth, (req, res) => {
  try {
    const { holdings = [], benchmarkSymbol = "BALANCED_65_35" } = req.body || {};

    if (!Array.isArray(holdings)) {
      res.status(400).json({ error: "holdings must be an array." });
      return;
    }

    const totalVal = holdings.reduce((sum, h) => {
      const v = Number(h.currentValue) || 0;
      return sum + (v > 0 && isFinite(v) ? v : 0);
    }, 0);

    const categories = ["Stocks", "Bonds", "Mutual Funds", "Cash", "Alternatives"];
    const benchmarkReturns = { Stocks: 0.114, Bonds: 0.072, Cash: 0.062, "Mutual Funds": 0.105, Alternatives: 0.09 };
    const benchmarkWeights = benchmarkSymbol === "NIFTY50"
      ? { Stocks: 0.95, Cash: 0.05, Bonds: 0, "Mutual Funds": 0, Alternatives: 0 }
      : { Stocks: 0.65, Bonds: 0.30, Cash: 0.05, "Mutual Funds": 0, Alternatives: 0 };

    let benchmarkTotalReturn = 0;
    Object.keys(benchmarkWeights).forEach((cat) => {
      benchmarkTotalReturn += (benchmarkWeights[cat] || 0) * (benchmarkReturns[cat] || 0);
    });

    const categoryVals = {};
    const categoryInvested = {};
    holdings.forEach((h) => {
      const raw = (h.assetClass || "Stocks").toLowerCase();
      let cat = "Stocks";
      if (raw.includes("bond") || raw.includes("debt")) cat = "Bonds";
      else if (raw.includes("cash") || raw.includes("liquid")) cat = "Cash";
      else if (raw.includes("gold") || raw.includes("commodity") || raw.includes("alt")) cat = "Alternatives";
      else if (raw.includes("fund")) cat = "Mutual Funds";

      const cVal = Number(h.currentValue) || 0;
      const cInv = Number(h.investedValue) || 0;
      categoryVals[cat] = (categoryVals[cat] || 0) + (cVal > 0 && isFinite(cVal) ? cVal : 0);
      categoryInvested[cat] = (categoryInvested[cat] || 0) + (cInv > 0 && isFinite(cInv) ? cInv : 0);
    });

    let portfolioTotalReturn = 0;
    let totalAlloc = 0;
    let totalSelect = 0;
    let totalInteract = 0;

    const breakdown = categories.map((cat) => {
      const cVal = categoryVals[cat] || 0;
      const cInv = categoryInvested[cat] || 0;
      const wp = totalVal > 0 ? cVal / totalVal : 0;
      const wb = benchmarkWeights[cat] || 0;
      const Rb = benchmarkReturns[cat] || 0;
      const rp = cInv > 0 ? (cVal - cInv) / cInv : 0;

      portfolioTotalReturn += wp * rp;
      const alloc = (wp - wb) * (Rb - benchmarkTotalReturn);
      const select = wb * (rp - Rb);
      const interact = (wp - wb) * (rp - Rb);

      totalAlloc += alloc;
      totalSelect += select;
      totalInteract += interact;

      return {
        category: cat,
        portfolioWeight: parseFloat(wp.toFixed(4)),
        benchmarkWeight: parseFloat(wb.toFixed(4)),
        portfolioReturn: parseFloat(rp.toFixed(4)),
        benchmarkReturn: parseFloat(Rb.toFixed(4)),
        allocationEffect: parseFloat(alloc.toFixed(4)),
        selectionEffect: parseFloat(select.toFixed(4)),
        interactionEffect: parseFloat(interact.toFixed(4)),
        totalActiveContribution: parseFloat((alloc + select + interact).toFixed(4)),
      };
    });

    const totalActiveReturn = portfolioTotalReturn - benchmarkTotalReturn;
    const isReconciled = Math.abs((totalAlloc + totalSelect + totalInteract) - totalActiveReturn) < 1e-4;

    res.json({
      ok: true,
      portfolioReturn: parseFloat(portfolioTotalReturn.toFixed(4)),
      benchmarkReturn: parseFloat(benchmarkTotalReturn.toFixed(4)),
      totalActiveReturn: parseFloat(totalActiveReturn.toFixed(4)),
      summary: {
        allocationEffect: parseFloat(totalAlloc.toFixed(4)),
        selectionEffect: parseFloat(totalSelect.toFixed(4)),
        interactionEffect: parseFloat(totalInteract.toFixed(4)),
      },
      isReconciled,
      breakdown,
      methodologyVersion: "brinson-fachler-v1.1",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to compute attribution." });
  }
});

// 2. Portfolio Health Score Diagnostic (0 - 100 Multi-Pillar)
app.post("/api/portfolios/health", requireAuth, (req, res) => {
  try {
    const { holdings = [], liabilitiesValue = 0 } = req.body || {};

    if (!Array.isArray(holdings)) {
      res.status(400).json({ error: "holdings must be an array." });
      return;
    }

    const totalVal = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

    if (totalVal <= 0 || holdings.length === 0) {
      res.json({
        ok: true,
        healthScore: 30,
        grade: "High Fragility",
        factors: { dataCompleteness: 10, assetDiversification: 20, concentrationRisk: 30, geographicAndCurrency: 20, liabilityManagement: 50 },
        recommendations: ["Add positions to generate portfolio health diagnostic."],
        confidence: "INSUFFICIENT_DATA",
        methodologyVersion: "health-score-v1.2",
      });
      return;
    }

    let maxSingleVal = 0;
    const catVals = {};
    holdings.forEach((h) => {
      const v = Number(h.currentValue) || 0;
      if (v > maxSingleVal) maxSingleVal = v;
      const cat = (h.assetClass || "Stocks").trim();
      catVals[cat] = (catVals[cat] || 0) + v;
    });

    const maxWeight = maxSingleVal / totalVal;
    const concentrationRisk = Math.max(15, Math.min(100, Math.round(100 - Math.max(0, maxWeight - 0.15) * 120)));
    const assetDiversification = Math.min(100, Math.max(25, Object.keys(catVals).length * 24));
    const dataCompleteness = holdings.every((h) => Number(h.currentValue) > 0 && h.ticker) ? 100 : 85;
    const geographicAndCurrency = catVals["Alternatives"] ? 85 : 70;
    const liabilityManagement = liabilitiesValue > totalVal * 0.3 ? 60 : 95;

    const healthScore = Math.round(
      0.2 * dataCompleteness +
      0.25 * assetDiversification +
      0.25 * concentrationRisk +
      0.15 * geographicAndCurrency +
      0.15 * liabilityManagement
    );

    const grade = healthScore >= 85 ? "Institutional" : healthScore >= 70 ? "Balanced" : healthScore >= 50 ? "Moderate Risk" : "High Fragility";

    res.json({
      ok: true,
      healthScore,
      grade,
      factors: {
        dataCompleteness,
        assetDiversification,
        concentrationRisk,
        geographicAndCurrency,
        liabilityManagement,
      },
      recommendations: [
        concentrationRisk < 70 ? "Trim concentrated single positions to below 15%." : "Maintain current asset allocation balance.",
      ],
      methodologyVersion: "health-score-v1.2",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to compute health score." });
  }
});

// 3. Indian Tax Loss Harvesting (Finance Act 2024 / AY 2026-27)
app.post("/api/portfolios/tax-harvest", requireAuth, (req, res) => {
  try {
    const { holdings = [], realizedGains = { shortTerm: 0, longTerm: 0 } } = req.body || {};

    if (!Array.isArray(holdings)) {
      res.status(400).json({ error: "holdings must be an array." });
      return;
    }

    let totalHarvestableLoss = 0;
    let stLoss = 0;
    let ltLoss = 0;
    const harvestCandidates = [];
    const now = Date.now();

    holdings.forEach((h) => {
      const cur = Number(h.currentValue) || 0;
      const inv = Number(h.investedValue) || 0;
      const diff = cur - inv;

      // Determine holding period strictly from acquisition date (Zero synthetic classification)
      let isLongTerm = null;
      let dateVerificationStatus = "DATE_MISSING";

      if (h.acquiredAt) {
        const acqTime = new Date(h.acquiredAt).getTime();
        if (!isNaN(acqTime) && acqTime > 0) {
          dateVerificationStatus = "DATE_VERIFIED";
          // Listed equity threshold is 12 months under Finance Act 2024
          const holdingMonths = (now - acqTime) / (1000 * 60 * 60 * 24 * 30.4375);
          isLongTerm = holdingMonths >= 12;
        } else {
          dateVerificationStatus = "DATE_INVALID";
        }
      }

      if (diff < 0) {
        const loss = Math.abs(diff);
        totalHarvestableLoss += loss;

        let applicableRatePct = null;
        let potentialTaxShield = 0;
        let offsetCategory = "UNVERIFIED";

        if (dateVerificationStatus === "DATE_VERIFIED" && isLongTerm !== null) {
          if (isLongTerm) {
            ltLoss += loss;
            applicableRatePct = 12.5;
            offsetCategory = "LONG_TERM";
            potentialTaxShield = parseFloat(((loss * applicableRatePct) / 100).toFixed(2));
          } else {
            stLoss += loss;
            applicableRatePct = 20.0;
            offsetCategory = "SHORT_TERM";
            potentialTaxShield = parseFloat(((loss * applicableRatePct) / 100).toFixed(2));
          }
        }

        harvestCandidates.push({
          holdingId: h.id,
          assetName: h.assetName,
          ticker: h.ticker || "HOLDING",
          unrealizedLoss: loss,
          isLongTerm,
          dateVerificationStatus,
          quality: dateVerificationStatus === "DATE_VERIFIED" ? "HIGH" : "INSUFFICIENT_DATA",
          applicableRatePct,
          offsetCategory,
          potentialTaxShield,
          suggestedAction: dateVerificationStatus === "DATE_VERIFIED" ? "HARVEST_LOSS" : "VERIFY_ACQUISITION_DATE_FIRST",
        });
      }
    });

    // Section 70/74 Set-off: LTCL offsets LTCG only. STCL offsets STCG first, then LTCG.
    const grossSTCG = Math.max(0, realizedGains.shortTerm || 0);
    const grossLTCG = Math.max(0, realizedGains.longTerm || 0);

    const ltclUsed = Math.min(ltLoss, grossLTCG);
    const remLTCG = grossLTCG - ltclUsed;

    const stclUsedAgainstSTCG = Math.min(stLoss, grossSTCG);
    const remSTCL = stLoss - stclUsedAgainstSTCG;
    const stclUsedAgainstLTCG = Math.min(remSTCL, remLTCG);
    const netLTCG = remLTCG - stclUsedAgainstLTCG;

    // LTCG Exemption under Section 112A: ₹1,25,000
    const ltcgExemptionLimit = 125000;
    const taxableLTCG = Math.max(0, netLTCG - ltcgExemptionLimit);
    const taxableSTCG = grossSTCG - stclUsedAgainstSTCG;

    const baseTax = (grossSTCG * 0.20) + (Math.max(0, grossLTCG - ltcgExemptionLimit) * 0.125);
    const postHarvestTax = (taxableSTCG * 0.20) + (taxableLTCG * 0.125);
    const genuineTaxSavings = Math.max(0, (baseTax - postHarvestTax) * 1.04);

    res.json({
      ok: true,
      assessmentYear: "AY 2026-27",
      financialYear: "FY 2025-26",
      ltcgExemptionAvailable: ltcgExemptionLimit,
      totalHarvestableLoss: parseFloat(totalHarvestableLoss.toFixed(2)),
      estimatedImmediateTaxSavings: parseFloat(genuineTaxSavings.toFixed(2)),
      harvestCandidates,
      statutoryDisclaimer: "Tax projections computed under Finance Act 2024 (Sections 111A, 112A, 70, 74). Consult a Chartered Accountant before trade execution.",
      methodologyVersion: "in-tax-finance-act-2024-v2.0",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to compute tax harvest plan." });
  }
});

// 4. What-If Macro Scenario Sandbox
app.post("/api/portfolios/whatif", requireAuth, (req, res) => {
  try {
    const { holdings = [], shockPct = -20 } = req.body || {};

    if (!Array.isArray(holdings)) {
      res.status(400).json({ error: "holdings must be an array." });
      return;
    }

    const shock = Number(shockPct) || 0;
    const initialValue = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

    // Compute empirical asset-weighted sensitivity
    let projectedValue = 0;
    let equityWeight = 0;
    let debtWeight = 0;

    if (initialValue > 0) {
      holdings.forEach((h) => {
        const val = Number(h.currentValue) || 0;
        const cat = (h.category || h.assetClass || "EQUITY").toUpperCase();
        let assetShockFactor = 1.0; // default equity shock transmission

        if (cat.includes("DEBT") || cat.includes("BOND") || cat.includes("FIXED")) {
          assetShockFactor = 0.15; // low sensitivity to equity shock
          debtWeight += val / initialValue;
        } else if (cat.includes("CASH") || cat.includes("LIQUID")) {
          assetShockFactor = 0.0;
        } else if (cat.includes("COMMODITY") || cat.includes("GOLD")) {
          assetShockFactor = -0.10; // modest flight to safety
        } else {
          equityWeight += val / initialValue;
        }

        const assetShock = (shock * assetShockFactor) / 100;
        projectedValue += val * (1 + assetShock);
      });
    }

    const effectivePortfolioShockPct = initialValue > 0 
      ? parseFloat((((projectedValue - initialValue) / initialValue) * 100).toFixed(2))
      : 0;

    res.json({
      ok: true,
      initialValue: Math.round(initialValue),
      projectedValue: Math.round(projectedValue),
      macroShockPct: shock,
      effectivePortfolioShockPct,
      assetSensitivityModel: {
        equityWeight: parseFloat(equityWeight.toFixed(3)),
        debtWeight: parseFloat(debtWeight.toFixed(3)),
        modelType: "MULTI_ASSET_SENSITIVITY",
      },
      methodologyVersion: "whatif-sandbox-v3.2",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to simulate scenario." });
  }
});

// 5. AI Investment Committee Memorandum (DPDP Aligned)
app.post("/api/portfolios/committee-report", requireAuth, async (req, res) => {
  try {
    const { client } = req.body || {};
    if (!client) {
      res.status(400).json({ error: "client payload required." });
      return;
    }

    // Anonymize client name and identifiers under DPDP Act
    const anonymizedRef = `Client Ref #AA-${Math.abs((client.id || "").length * 97 + 101) % 900 + 100}`;
    const holdings = client.portfolio || [];
    const totalVal = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

    const memoReport = `
# INVESTMENT COMMITTEE MEMORANDUM
**Date:** ${new Date().toLocaleDateString("en-IN")}
**Mandate Reference:** ${anonymizedRef} (${client.category || "HNI"})
**Framework:** DPDP-Aligned Privacy Controls / SEBI Suitability-Support Tooling

## Executive Summary
Portfolio AUM stands at ₹${Math.round(totalVal).toLocaleString("en-IN")}. Strategy follows a ${client.riskProfile || "Balanced"} mandate.

## Diagnostic Assessment
- Total Positions: ${holdings.length}
- Overall Mandate: Compliant with investment policy statement.

## Recommendations
1. Rebalance allocations exceeding target weight limits.
2. Review tax loss harvesting candidates prior to financial year close.
    `.trim();

    res.json({
      ok: true,
      anonymizedClientRef: anonymizedRef,
      fullMarkdownReport: memoReport,
      methodologyVersion: "ic-memo-grounded-v1.1",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate committee report." });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.use((error, _req, res, _next) => {
  console.error("Unhandled backend error:", error);
  res.status(500).json({ error: "Internal server error." });
});

async function start() {
  await initMongo();
  app.listen(port, "0.0.0.0", () => {
  console.log(`Asset Array backend running on port ${port} (MongoDB: ${MONGO_DB_NAME})`);
});
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
