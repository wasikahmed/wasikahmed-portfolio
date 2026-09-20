#!/usr/bin/env bash
# Runs ON THE VPS ONLY, via a cron entry installed by the deploy workflow's
# "Install the backup cron job" step (see .github/workflows/deploy.yml) — it
# is not part of the Docker image and is never invoked from CI directly.
#
# Local retention only (PLAN.md W4, decided 2026-08-30): dumps mongo into a
# dated file under $DEPLOY_PATH/backups, rotating anything older than
# $RETENTION_DAYS. This protects against a bad migration, a fat-fingered
# admin-CMS delete, or database corruption — NOT against losing the VPS
# itself, since nothing here leaves the box. Revisit shipping this off-box
# (e.g. via rclone to an S3-compatible bucket) as its own task if that risk
# becomes worth carrying (PLAN.md housekeeping item 4 — media no longer
# needs this: it moved to Cloudinary, PLAN.md W15 item 1, which is already
# off-box and versioned on its own).
#
# Requires the same .env this compose project already runs with — reads
# MONGO_ROOT_USER/MONGO_ROOT_PASSWORD from it rather than duplicating them.
set -euo pipefail

# Deployed at $DEPLOY_PATH/scripts/vps-backup.sh (scp preserves the
# scripts/ prefix — see the "Copy the compose file and backup script"
# workflow step), so .env and docker-compose.prod.yml are one level up.
DEPLOY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DEPLOY_PATH"

# shellcheck disable=SC1091
source ./.env

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
STAMP="$(date +%Y-%m-%d)"
BACKUP_DIR="$DEPLOY_PATH/backups"
mkdir -p "$BACKUP_DIR"

# --- Mongo: dump inside the container, stream out compressed -----------------
docker compose -p portfolio -f docker-compose.prod.yml exec -T mongo \
  mongodump \
  --username "$MONGO_ROOT_USER" \
  --password "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --archive --gzip \
  > "$BACKUP_DIR/mongo-$STAMP.archive.gz"

# --- Rotate --------------------------------------------------------------
find "$BACKUP_DIR" -type f -mtime "+$RETENTION_DAYS" -delete

echo "Backup complete: $BACKUP_DIR/mongo-$STAMP.archive.gz"
