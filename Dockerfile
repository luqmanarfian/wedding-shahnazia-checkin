FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Patch Alpine vulnerabilities
RUN apk update && apk upgrade --no-cache

# Install production dependencies
COPY package.json package-lock.json* ./

RUN npm ci --omit=dev && \
    rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm \
           /usr/local/bin/npx

# Copy application
COPY --chown=app:app --from=builder /app/dist ./dist
COPY --chown=app:app --from=builder /app/server ./server
COPY --chown=app:app --from=builder /app/cert ./cert
COPY --chown=app:app --from=builder /app/data ./data
COPY --chown=app:app --from=builder /app/index.html ./index.html
COPY --chown=app:app --from=builder /app/.env ./.env

EXPOSE 3000

USER app

CMD ["node", "server/index.js"]