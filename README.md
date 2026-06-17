# Cynex — Premium digital goods MVP

Monorepo for a website that sells digital products (account upgrades, dedicated/shared
accounts, license keys) with manual admin fulfillment, wallet, payOS payments and email.

## Stack

- **pnpm + Turborepo** monorepo
- `apps/web` — Next.js (App Router) + Tailwind + shadcn/ui — customer site
- `apps/admin` — React Admin + MUI — operations dashboard
- `apps/api` — NestJS + Prisma — backend API
- `apps/worker` — BullMQ — email + background jobs
- `packages/db` — Prisma schema/client · `packages/shared` — enums/DTOs/crypto · `packages/config`
- PostgreSQL · Redis · payOS · Resend · Cloudflare R2

## Quickstart

```bash
# 0. Prereqs: Node 20+, pnpm 10+, Docker
cp .env.example .env            # fill secrets as needed

# 1. Infra
docker compose up -d postgres redis

# 2. Install
pnpm install

# 3. Database
pnpm db:generate
pnpm db:migrate                 # creates tables
pnpm db:seed                    # super-admin + sample product

# 4. Run everything
pnpm dev                        # turbo runs api, worker, web, admin
```

Local URLs:

- Web: http://localhost:3000
- Admin: http://localhost:5173
- API: http://localhost:3001 (health: `/health`)

## Useful scripts

```bash
pnpm typecheck      # type-check all packages
pnpm build          # build all
pnpm db:studio      # Prisma Studio
```

Deploy notes in [docs/DEPLOY.md](docs/DEPLOY.md).
