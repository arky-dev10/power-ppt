# ─── Builder stage ─────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# System deps for any native modules + git
RUN apt-get update && apt-get install -y --no-install-recommends \
    git python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ─── Runtime stage ─────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runtime

WORKDIR /app

# Runtime deps: ripgrep (Claude Code's grep), git, tini for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    git ripgrep ca-certificates tini \
  && rm -rf /var/lib/apt/lists/*

# Claude Code (CLI) — global install for `claude login` and SDK detection
RUN npm install -g @anthropic-ai/claude-code

# App
COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=dev

COPY --from=builder /app/dist           ./dist
COPY --from=builder /app/src/lib        ./src/lib
COPY --from=builder /app/astro.config.mjs ./
# Static reference files (CLAUDE.md, FLUJO.md, templates) for Claude to read
COPY --from=builder /app/CLAUDE.md      ./
COPY --from=builder /app/FLUJO.md       ./
COPY --from=builder /app/README.md      ./
COPY --from=builder /app/templates      ./templates

# Data dirs — montadas como volúmenes en compose. Crear vacíos por si no hay volumen.
RUN mkdir -p candidates projects vetting diagnostics

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321 \
    # Claude Code credentials persisted via volume:
    CLAUDE_CONFIG_DIR=/root/.claude \
    # SDK uses the globally-installed claude CLI (not native bundled binary)
    CLAUDE_CODE_BIN=/usr/local/bin/claude

EXPOSE 4321

ENTRYPOINT ["/usr/bin/tini","--"]
CMD ["node","dist/server/entry.mjs"]
