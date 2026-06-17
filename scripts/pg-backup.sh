#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

OUTPUT_FILE="$BACKUP_DIR/cynex-${TIMESTAMP}.dump"

echo "Creating PostgreSQL backup at $OUTPUT_FILE"
pg_dump "$DATABASE_URL" --format=custom --file="$OUTPUT_FILE"
echo "Backup completed: $OUTPUT_FILE"
