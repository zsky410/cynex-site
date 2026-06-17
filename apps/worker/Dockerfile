# Build context = monorepo root.
FROM node:24-slim AS base
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages ./packages
COPY apps/worker ./apps/worker
RUN pnpm install --frozen-lockfile=false
RUN pnpm -F @cynex/db generate
RUN pnpm -F @cynex/shared build && pnpm -F @cynex/db build && pnpm -F @cynex/worker build
RUN pnpm deploy --filter=@cynex/worker --prod /app/deploy

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/deploy ./
COPY --from=build /app/apps/worker/dist ./dist
CMD ["node", "dist/main.js"]
