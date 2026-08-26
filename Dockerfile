# Multi-stage Dockerfile for wedding-qr-checkin-v2
# - Builder: installs dev deps and runs `npm run build` (Vite)
# - Runner: installs only production deps and runs the Node server

FROM node:20-alpine AS builder
WORKDIR /app

# Install build-time packages
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Allow passing Vite-style env content at build-time. Example:
# --build-arg VITE_ENV="VITE_API_URL=https://api.example.com"
ARG VITE_ENV
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# If build-time env provided, write to .env.production so Vite picks it up
RUN if [ -n "${VITE_ENV}" ]; then printf '%s\n' "${VITE_ENV}" > .env.production; fi

# Build frontend (produces ./dist)
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user for better security
RUN addgroup -S app && adduser -S app -G app

# Patch Alpine OS package vulnerabilities
RUN apk update && apk upgrade --no-cache

# Copy only production package files and install production deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# Copy built assets and server code from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/cert ./cert
COPY --from=builder /app/data ./data
COPY --from=builder /app/index.html ./index.html

# Expose default port used by server/index.js
EXPOSE 3000

# Run as non-root user
USER app

# Default command: start the Node server
CMD ["node", "server/index.js"]
