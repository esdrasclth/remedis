FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN pnpm build

# ── Production runner ─────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder /app/public                               ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static

# Prisma: migrations folder + generated client + necessary packages
COPY --from=builder --chown=nextjs:nodejs /app/prisma                    ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/app/generated             ./app/generated
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma      ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma      ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma       ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg           ./node_modules/pg
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-pool      ./node_modules/pg-pool
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-protocol  ./node_modules/pg-protocol
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-types     ./node_modules/pg-types

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run migrations then start the app
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
