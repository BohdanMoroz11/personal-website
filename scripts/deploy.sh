#!/usr/bin/env bash
# Manual deploy — mirrors .github/workflows/deploy.yml when GitHub Actions is
# unavailable or you want to ship without merging through CI.
#
# What it does:
#   1. Builds the Docker image locally (linux/amd64 by default)
#   2. Pushes it to GHCR as ghcr.io/bohdanmoroz11/personal-website:latest
#   3. SSHs to the target host, pulls the new image, restarts the container
#
# Prereqs:
#   - Docker with buildx
#   - You're logged in to GHCR:  docker login ghcr.io -u <user>
#     (PAT needs write:packages — same as CI's GHCR_PAT)
#   - SSH access to the deploy host
#
# Usage:
#   DEPLOY_HOST=bro ./scripts/deploy.sh
#   ./scripts/deploy.sh --host bro
#   ./scripts/deploy.sh --host bro --platform linux/arm64
#
# Env vars:
#   DEPLOY_HOST     SSH host or ~/.ssh/config alias  (required if --host omitted)
#   DEPLOY_IMAGE    Image ref to build/push          (default: ghcr.io/bohdanmoroz11/personal-website:latest)
#   DEPLOY_PLATFORM Build platform                   (default: linux/amd64)
#   SKIP_BUILD=1    Reuse existing remote image (just `docker compose pull && up`)

set -euo pipefail

HOST="${DEPLOY_HOST:-}"
IMAGE="${DEPLOY_IMAGE:-ghcr.io/bohdanmoroz11/personal-website:latest}"
PLATFORM="${DEPLOY_PLATFORM:-linux/amd64}"
SKIP_BUILD="${SKIP_BUILD:-0}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)     HOST="$2"; shift 2 ;;
    --image)    IMAGE="$2"; shift 2 ;;
    --platform) PLATFORM="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    -h|--help)
      sed -n '2,/^set -/p' "$0" | sed 's/^# \{0,1\}//;$d'
      exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$HOST" ]]; then
  echo "error: no SSH host. Pass --host <alias> or set DEPLOY_HOST." >&2
  echo "example:  DEPLOY_HOST=bro $0" >&2
  exit 2
fi

log() { printf '\033[1;36m▶ %s\033[0m\n' "$*"; }

if [[ "$SKIP_BUILD" != "1" ]]; then
  log "Building & pushing $IMAGE ($PLATFORM)"
  docker buildx build \
    --platform "$PLATFORM" \
    --tag "$IMAGE" \
    --push \
    .
else
  log "Skipping build (SKIP_BUILD=1) — using whatever is already at $IMAGE"
fi

log "Deploying on $HOST"
ssh "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd ~/personal-website
git pull --ff-only
docker compose pull
docker compose up -d
docker image prune -f
REMOTE

log "Done. https://bohdanmoroz.com"
