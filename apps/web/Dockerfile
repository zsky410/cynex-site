# Build context = monorepo root.
FROM node:24-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm install --frozen-lockfile=false
RUN pnpm -F @cynex/shared build
RUN pnpm -F @cynex/web build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app ./
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
