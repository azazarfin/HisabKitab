# ── Server Dockerfile ──
FROM node:22-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Expose the API port
EXPOSE 5000

CMD ["node", "index.js"]
