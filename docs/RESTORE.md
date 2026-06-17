# Restore PostgreSQL Backup

This repo uses `scripts/pg-backup.sh` to produce PostgreSQL custom-format dumps
(`.dump`). Restore them with `pg_restore`.

## 1. Pick the backup file

```bash
ls -lah backups/
```

Example file:

```bash
backups/cynex-20260617-230000.dump
```

## 2. Create or reset the target database

Scratch/local example:

```bash
dropdb --if-exists cynex_restore
createdb cynex_restore
```

If you restore into an existing database, make sure the app is stopped first.

## 3. Restore the dump

```bash
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --dbname=postgresql://cynex:cynex@localhost:5432/cynex_restore \
  backups/cynex-20260617-230000.dump
```

## 4. Verify

```bash
psql postgresql://cynex:cynex@localhost:5432/cynex_restore -c '\dt'
psql postgresql://cynex:cynex@localhost:5432/cynex_restore -c 'select count(*) from orders;'
```

## Notes

- `--clean --if-exists` drops existing objects before recreating them.
- Use a scratch database first if you are validating a backup.
- Production restore should be done during a maintenance window with the API and worker stopped.
