# 🚀 HisabKitab — Auto-Deploy Setup Guide

A complete guide to setting up automatic deployment from GitHub pushes using a self-hosted webhook listener.

## Architecture

```
┌──────────┐    push     ┌──────────┐   POST /webhook   ┌─────────────────┐
│  You/Dev │ ─────────▶  │  GitHub  │ ─────────────────▶ │  Your Server    │
└──────────┘             └──────────┘                    │                 │
                                                         │  webhook.js     │
                                                         │    ↓            │
                                                         │  deploy.sh      │
                                                         │    ↓            │
                                                         │  git pull       │
                                                         │  podman-compose │
                                                         │  up --build -d  │
                                                         └─────────────────┘
```

---

## Step 1: Server Prerequisites

Make sure your server has these installed:

```bash
# Node.js (for the webhook listener)
node --version   # v18+ required

# Git
git --version

# Podman + podman-compose
podman --version
podman-compose version

# curl (for health checks)
curl --version
```

---

## Step 2: Clone the Repo on Your Server

```bash
# Clone to /opt/hisabkitab (or wherever you prefer)
sudo mkdir -p /opt/hisabkitab
sudo chown $USER:$USER /opt/hisabkitab
git clone https://github.com/YOUR_USERNAME/HisabKitab.git /opt/hisabkitab
cd /opt/hisabkitab
```

> **Important:** Set up your `.env` files on the server:
> ```bash
> # Server env (copy and edit with your production values)
> cp server/.envexample server/.env
> nano server/.env
>
> # Root env (for Vite build args)
> cp .env.example .env  # or create it with VITE_GOOGLE_CLIENT_ID=...
> nano .env
> ```

---

## Step 3: Generate a Webhook Secret

```bash
# Generate a secure random secret
openssl rand -hex 32
```

**Copy this value** — you'll need it in both Step 4 and Step 5.

---

## Step 4: Configure GitHub Webhook

1. Go to your repo on GitHub → **Settings** → **Webhooks** → **Add webhook**
2. Fill in:

| Field             | Value                                          |
|-------------------|------------------------------------------------|
| **Payload URL**   | `http://YOUR_SERVER_IP:9000/webhook`           |
| **Content type**  | `application/json`                             |
| **Secret**        | The secret from Step 3                         |
| **Events**        | Select **"Just the push event"**               |
| **Active**        | ✅ Checked                                     |

3. Click **Add webhook**

> **Note:** If your server is behind a firewall, make sure port `9000` is open for incoming connections from GitHub's IP ranges.

---

## Step 5: Set Up the Systemd Service

```bash
# 1. Edit the service file with your webhook secret
nano /opt/hisabkitab/hisabkitab-webhook@.service
# → Change WEBHOOK_SECRET=your-webhook-secret-here to your actual secret from Step 3
# → Update WorkingDirectory if you cloned elsewhere

# 2. Copy the service file to systemd
sudo cp /opt/hisabkitab/hisabkitab-webhook@.service /etc/systemd/system/

# 3. Reload systemd and enable the service
sudo systemctl daemon-reload
sudo systemctl enable hisabkitab-webhook@$USER.service
sudo systemctl start hisabkitab-webhook@$USER.service

# 4. Check status
sudo systemctl status hisabkitab-webhook@$USER.service
```

---

## Step 6: First Deploy (Manual)

Run the deploy script manually to verify everything works:

```bash
cd /opt/hisabkitab
./deploy.sh
```

This will:
1. Pull the latest code from `origin/main`
2. Build and start all containers with `podman-compose`
3. Run a health check on the API
4. Log everything to `deploy.log`

---

## Step 7: Test the Webhook

Push a commit to your `main` branch and watch the logs:

```bash
# Watch webhook logs in real-time
sudo journalctl -u hisabkitab-webhook@$USER.service -f

# Or check the log file
tail -f /opt/hisabkitab/webhook.log

# Check deploy logs
tail -f /opt/hisabkitab/deploy.log
```

You can also test with curl:

```bash
# Ping test (no signature needed)
curl http://localhost:9000/health

# Simulate a push event (for testing without signature verification)
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{"ref":"refs/heads/main","pusher":{"name":"test"},"head_commit":{"message":"test deploy"}}'
```

---

## File Overview

| File | Purpose |
|------|---------|
| `webhook.js` | Listens on port 9000 for GitHub push events |
| `deploy.sh` | Pulls latest code, rebuilds & restarts containers |
| `hisabkitab-webhook@.service` | Systemd unit to keep the webhook running |
| `deploy.log` | Deployment output log (auto-created) |
| `webhook.log` | Webhook event log (auto-created) |

---

## Configuration Reference

All settings are via environment variables (set in the systemd service file):

| Variable | Default | Description |
|----------|---------|-------------|
| `WEBHOOK_PORT` | `9000` | Port the webhook listener runs on |
| `WEBHOOK_SECRET` | *(empty)* | GitHub webhook secret for HMAC verification |
| `DEPLOY_BRANCH` | `main` | Branch to watch for pushes |

---

## Troubleshooting

### Webhook returns 401 Unauthorized
- Your `WEBHOOK_SECRET` doesn't match the secret configured in GitHub
- Fix: update the secret in the systemd service and restart

### Deploy script fails at `git pull`
- SSH keys or HTTPS credentials not configured on the server
- Fix: set up a deploy key or personal access token

### Containers fail to build
- Check `deploy.log` for the full error output
- Run `podman-compose up --build` manually to debug

### Port 9000 not reachable
- Open the port in your firewall:
  ```bash
  sudo ufw allow 9000/tcp        # Ubuntu/Debian
  sudo firewall-cmd --add-port=9000/tcp --permanent && sudo firewall-cmd --reload  # CentOS/Fedora
  ```

---

## Security Tips

1. **Always set a webhook secret** — without it, anyone can trigger deploys
2. **Use HTTPS** — put the webhook behind a reverse proxy (nginx/caddy) with TLS
3. **Restrict firewall** — only allow GitHub's webhook IPs on port 9000 ([GitHub IP ranges](https://api.github.com/meta))
4. **Don't run as root** — the systemd service uses your user account via `@$USER`
