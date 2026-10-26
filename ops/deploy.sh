#!/usr/bin/env bash
# wasikahmed-portfolio's deploy. Runs on the Advergo VPS as root, for every deploy (called by
# .github/workflows/deploy.yml). Copied from advergo-frontend's ops/deploy.sh; only this header,
# the pre-deploy backup and the backup file names differ.
#
#   bash deploy.sh <project dir> <new docker-compose.yml> <image tag> <health-check URL>
#
# The project folder (/docker/<project>) belongs to Hostinger's Docker Manager: the panel owns its
# .env (the Environment box). This script only replaces docker-compose.yml, so settings edited in
# the panel survive every deploy. Compose takes the project name from the folder name, which is
# also the name the panel shows, so the containers and volumes stay the same from deploy to deploy.
set -euo pipefail

DIR="$1"
NEW_COMPOSE="$2"
TAG="$3"
HEALTH_URL="$4"
PROJECT="$(basename "$DIR")"

log() { echo "[deploy $(date -u +%H:%M:%S)] $*"; }

if [ ! -f "$DIR/.env" ]; then
  echo "No $DIR/.env: the project's settings must be in place before the first deploy" \
    "(AGENTS.md §10)." >&2
  exit 1
fi
cd "$DIR"

# Back up the database before touching anything, if it is running. Found by Compose's labels
# rather than through a compose file, so it also works on the first deploy into a new folder. The
# credentials come from the mongo container's own environment, expanded inside it, so this script
# never reads .env. A failed dump stops the deploy.
mongo="$(docker ps -q --filter "label=com.docker.compose.project=$PROJECT" \
  --filter "label=com.docker.compose.service=mongo" --filter status=running)"
if [ -n "$mongo" ]; then
  mkdir -p backups/prod
  file="backups/prod/wasikahmed-portfolio-predeploy-$(date -u +%Y-%m-%dT%H-%M-%SZ).archive.gz"
  docker exec "$mongo" sh -c 'mongodump -u "$MONGO_INITDB_ROOT_USERNAME" \
    -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive --gzip' > "$file.partial"
  mv "$file.partial" "$file"
  log "database backed up to $DIR/$file ($(du -h "$file" | cut -f1))"
fi

# Keep the compose file being replaced, for reference or a manual rollback.
mkdir -p backups
[ -f docker-compose.yml ] && cp docker-compose.yml backups/docker-compose.previous.yml
install -m 644 "$NEW_COMPOSE" docker-compose.yml
rm -f "$NEW_COMPOSE"

if [ -z "${DEPLOY_SKIP_PULL:-}" ]; then # set only by local tests
  log "pulling images ($TAG)"
  docker compose pull --quiet
fi
log "starting"
docker compose up -d --remove-orphans --wait --wait-timeout 300

# Every container built from our own image must now run the tag this deploy was for.
for c in $(docker compose ps -q); do
  image="$(docker inspect --format '{{.Config.Image}}' "$c")"
  case "$image" in
    itzwasik/*)
      if [ "${image##*:}" != "$TAG" ]; then
        echo "$(docker inspect --format '{{.Name}}' "$c") runs $image, expected tag $TAG" >&2
        exit 1
      fi
      ;;
  esac
done

for i in $(seq 1 30); do
  if curl -fs -o /dev/null "$HEALTH_URL"; then
    log "healthy: $HEALTH_URL"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "$HEALTH_URL did not answer after the deploy" >&2
    docker compose logs --tail 80 >&2 || true
    exit 1
  fi
  sleep 4
done

docker image prune -f > /dev/null
docker compose ps --format 'table {{.Service}}\t{{.Image}}\t{{.Status}}'
