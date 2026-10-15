# Imagen de la app clínica (apps/web). La landing se despliega en Vercel.
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

# ── Dependencias y build ─────────────────────────────────────────────────────
# Se copian los package.json de todo el workspace para que el lockfile
# coincida, pero solo se instala lo que necesita apps/web.
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json     ./apps/web/
COPY apps/landing/package.json ./apps/landing/
RUN pnpm install --frozen-lockfile --filter @remedis/web

COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN DATABASE_URL=postgresql://placeholder:placeholder@localhost/placeholder npx prisma generate
RUN pnpm build

# ── Producción ───────────────────────────────────────────────────────────────
# En un monorepo, el build standalone replica la ruta apps/web dentro de
# .next/standalone, así que server.js queda en /app/apps/web.
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone   ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static       ./apps/web/.next/static
COPY --from=builder                       /app/apps/web/public             ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/prisma             ./apps/web/prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/app/generated      ./apps/web/app/generated
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/prisma.config.ts   ./apps/web/prisma.config.ts
# Dependencias completas: prisma migrate deploy necesita el CLI de Prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules                ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/node_modules       ./apps/web/node_modules

USER nextjs
WORKDIR /app/apps/web
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
