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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const rateLimitMap = new Map();
const mongo = new MongoClient(MONGO_URI);
const gemini = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

let usersCol;
let sessionsCol;
let syncCol;
let broadcastsCol;
let auditCol;
let aiResearchCol;

app.use(cors({ origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN }));
app.use(express.json({ limit: "5mb" }));

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

async function audit(action, meta) {
  await auditCol.insertOne({
    id: crypto.randomUUID(),
    action,
    date: new Date().toISOString(),
    ...meta,
  });
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
   const user = await usersCol.findOne({ username, active: true });


if (!user || !safeEqual(user.passwordHash, hashPassword(password))) {
      await audit("auth.login_failed", { username });
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }
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
    res.status(500).json({ error: "Login failed.", detail: error.message });
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
    res.status(500).json({ error: "Refresh failed.", detail: error.message });
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
    res.status(500).json({ error: "Logout failed.", detail: error.message });
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

  if (!query || query.length < 2 || query.length > 160) {
    res.status(400).json({ error: "query is required and must be 2-160 characters." });
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
  const campaign = {
    campaignId: `${Date.now()}`,
    ownerName: ownerName || "Asset Array Owner",
    channel: channel || "Preferred",
    message,
    clients,
    createdAt: createdAt || new Date().toISOString(),
    totalClients: clients.length,
    status: "processed",
    createdBy: req.user.username,
    createdById: req.user.id,
  };
  await broadcastsCol.insertOne(campaign);
  await audit("broadcast.sent", {
    campaignId: campaign.campaignId,
    totalClients: campaign.totalClients,
    channel: campaign.channel,
    userId: req.user.id,
    by: req.user.username,
  });
  res.json({
    ok: true,
    campaignId: campaign.campaignId,
    totalClients: campaign.totalClients,
    status: campaign.status,
  });
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
