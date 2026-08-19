#!/usr/bin/env node
// ──────────────────────────────────────────────────────────
// webhook.js — Lightweight GitHub webhook listener
// Triggers deploy.sh when a push event is received
// ──────────────────────────────────────────────────────────

const http = require('http');
const crypto = require('crypto');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

// ── Configuration ──
const PORT = parseInt(process.env.WEBHOOK_PORT, 10) || 9000;
const SECRET = process.env.WEBHOOK_SECRET || '';
const DEPLOY_BRANCH = process.env.DEPLOY_BRANCH || 'main';
const DEPLOY_SCRIPT = path.join(__dirname, 'deploy.sh');
const LOG_FILE = path.join(__dirname, 'webhook.log');
const MAX_BODY_BYTES = 1024 * 1024; // 1MB body limit

// ── Logging ──
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (err) {
    console.error('Failed to write to log file:', err.message);
  }
}

// ── Verify GitHub signature (HMAC-SHA256) ──
function verifySignature(payload, signature) {
  if (!SECRET) {
    log('❌ WEBHOOK_SECRET is not configured — rejecting request for security');
    return false;
  }
  if (!signature || typeof signature !== 'string') return false;

  try {
    const sig = Buffer.from(signature, 'utf8');
    const hmac = crypto.createHmac('sha256', SECRET);
    const digest = Buffer.from('sha256=' + hmac.update(payload).digest('hex'), 'utf8');

    if (sig.length !== digest.length) return false;
    return crypto.timingSafeEqual(digest, sig);
  } catch (err) {
    log(`❌ Signature verification error: ${err.message}`);
    return false;
  }
}

// ── Run deploy script ──
let deploying = false;
let pendingDeploy = false;

function runDeploy() {
  if (deploying) {
    log('⏳ Deploy already in progress — queuing next deploy');
    pendingDeploy = true;
    return;
  }

  deploying = true;
  pendingDeploy = false;
  log('🚀 Running deploy script...');

  execFile('bash', [DEPLOY_SCRIPT], {
    cwd: __dirname,
    env: { ...process.env, DEPLOY_BRANCH },
    timeout: 300000, // 5 minute timeout
  }, (error, stdout, stderr) => {
    deploying = false;

    if (error) {
      log(`❌ Deploy failed: ${error.message}`);
      if (stderr) log(`STDERR: ${stderr}`);
    } else {
      log('✅ Deploy completed successfully');
    }

    if (stdout) log(`STDOUT: ${stdout}`);

    // If another push came in while deploying, run again
    if (pendingDeploy) {
      log('🔄 Running queued deploy...');
      runDeploy();
    }
  });
}

// ── HTTP Server ──
const server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', deploying }));
    return;
  }

  // Only accept POST to /webhook
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  let body = '';
  let byteCount = 0;
  let tooLarge = false;

  req.on('error', (err) => {
    log(`⚠️ Request stream error: ${err.message}`);
  });

  req.on('data', (chunk) => {
    byteCount += chunk.length;
    if (byteCount > MAX_BODY_BYTES) {
      tooLarge = true;
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Payload too large' }));
      req.destroy(); // Terminate incoming stream after responding
      return;
    }
    body += chunk;
  });

  req.on('end', () => {
    if (tooLarge) return;

    // Verify signature
    const signature = req.headers['x-hub-signature-256'];
    if (!verifySignature(body, signature)) {
      log('🚫 Invalid or missing signature — rejecting request');
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    // Parse payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (e) {
      log('🚫 Invalid JSON payload');
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad request' }));
      return;
    }

    // Check event type
    const event = req.headers['x-github-event'];
    log(`📨 Received event: ${event}`);

    if (event === 'ping') {
      log('🏓 Ping received — webhook is configured correctly');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'pong' }));
      return;
    }

    if (event !== 'push') {
      log(`⏭️  Ignoring event: ${event}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Ignored' }));
      return;
    }

    // Check branch
    const ref = payload.ref || '';
    const branch = ref.replace('refs/heads/', '');
    if (branch !== DEPLOY_BRANCH) {
      log(`⏭️  Ignoring push to branch: ${branch} (watching: ${DEPLOY_BRANCH})`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Ignored — wrong branch' }));
      return;
    }

    // Trigger deploy
    const pusher = payload.pusher?.name || 'unknown';
    const commitMsg = payload.head_commit?.message || 'no message';
    log(`📦 Push to ${branch} by ${pusher}: "${commitMsg}"`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Deploy triggered' }));
    runDeploy();
  });
});

server.on('error', (err) => {
  log(`❌ Webhook server error: ${err.message}`);
});

server.listen(PORT, () => {
  log('═══════════════════════════════════════');
  log(`🎯 Webhook listener running on port ${PORT}`);
  log(`📌 Watching branch: ${DEPLOY_BRANCH}`);
  log(`🔐 Signature verification: ${SECRET ? 'ENABLED' : 'DISABLED (REQUIRES SECRET)'}`);
  log(`📂 Deploy script: ${DEPLOY_SCRIPT}`);
  log('═══════════════════════════════════════');
});
