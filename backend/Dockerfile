# ── Stage 1: deps ──────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Production-only install — no devDeps, no test runners
RUN npm ci --omit=dev

# ── Stage 2: runner ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY server.js ./

# Cloud Run mandates PORT=8080
ENV PORT=8080
ENV NODE_ENV=production

USER appuser

EXPOSE 8080

# Graceful shutdown support
STOPSIGNAL SIGTERM

CMD ["node", "server.js"]
