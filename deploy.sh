#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
# deploy.sh — Pull latest code from GitHub and redeploy
# ──────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuration ──
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="${REPO_DIR}/deploy.log"
COMPOSE_CMD=""
BRANCH="${DEPLOY_BRANCH:-main}"

# ── Detect container runtime (podman-compose > docker compose) ──
detect_compose() {
  if command -v podman-compose &>/dev/null; then
    COMPOSE_CMD="podman-compose"
  elif command -v docker &>/dev/null && docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
  elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
  else
    echo "❌ No container compose tool found (podman-compose / docker compose)" | tee -a "$LOG_FILE"
    exit 1
  fi
  echo "🔧 Using: $COMPOSE_CMD" | tee -a "$LOG_FILE"
}

# ── Logging helper ──
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# ── Main deploy sequence ──
main() {
  log "═══════════════════════════════════════"
  log "🚀 Deployment started"
  log "═══════════════════════════════════════"

  detect_compose
  cd "$REPO_DIR"

  # 1. Pull latest code
  log "📥 Pulling latest changes from origin/${BRANCH}..."
  git fetch origin "$BRANCH"
  git reset --hard "origin/${BRANCH}"
  log "✅ Code updated to $(git rev-parse --short HEAD)"

  # 2. Rebuild and restart containers
  log "🔨 Rebuilding containers..."
  $COMPOSE_CMD down --remove-orphans 2>&1 | tee -a "$LOG_FILE"
  $COMPOSE_CMD up --build -d 2>&1 | tee -a "$LOG_FILE"

  # 3. Cleanup old images
  log "🧹 Pruning dangling images..."
  if command -v podman &>/dev/null; then
    podman image prune -f 2>&1 | tee -a "$LOG_FILE" || true
  elif command -v docker &>/dev/null; then
    docker image prune -f 2>&1 | tee -a "$LOG_FILE" || true
  fi

  # 4. Health check (wait up to 30s)
  log "🏥 Waiting for health check..."
  local retries=10
  local wait=3
  for i in $(seq 1 $retries); do
    if curl -sf http://localhost:5000/api/health &>/dev/null; then
      log "✅ Health check passed!"
      break
    fi
    if [ "$i" -eq "$retries" ]; then
      log "⚠️  Health check failed after ${retries} attempts"
      exit 1
    fi
    sleep $wait
  done

  log "🎉 Deployment complete! Commit: $(git rev-parse --short HEAD)"
  log "═══════════════════════════════════════"
}

main "$@"
