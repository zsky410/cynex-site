# Deploy (Docker + Coolify)

## Services

`web`, `admin`, `api`, `worker`, `postgres`, `redis` (see `docker-compose.prod.yml`).

## Coolify setup

1. Create a new project, connect this git repo.
2. Add a **Docker Compose** resource pointing at `docker-compose.prod.yml`.
3. Set environment variables (copy from `.env.example`, fill real secrets):
   - `POSTGRES_PASSWORD`, `DATABASE_URL`, `REDIS_URL`
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`
   - `PAYOS_*`, `RESEND_API_KEY`, `EMAIL_FROM`, `R2_*`
   - `WEB_BASE_URL`, `ADMIN_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`
4. After first boot, run migrations: `docker compose exec api npx prisma migrate deploy`
   (or run `pnpm -F @cynex/db migrate:deploy` in a one-off job).
5. Optionally seed: `docker compose exec api node -e "require('@cynex/db')"` then run the seed.

## Local validation

```bash
docker compose -f docker-compose.prod.yml config   # validate compose
docker build -f apps/api/Dockerfile -t cynex-api .  # build api image
```

## Backups

See `scripts/pg-backup.sh` and `docs/RESTORE.md`.
