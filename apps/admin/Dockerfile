# Build context = monorepo root. Produces static assets served by nginx.
FROM node:24-slim AS build
RUN corepack enable
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages ./packages
COPY apps/admin ./apps/admin
RUN pnpm install --frozen-lockfile=false
RUN pnpm -F @cynex/shared build
RUN pnpm -F @cynex/admin build

FROM nginx:alpine AS runtime
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
