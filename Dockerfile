FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# .env.production harus sudah tersedia di build context
# dan akan digunakan oleh Vite ketika npm run build dijalankan.

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
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/cert ./cert
COPY --from=builder /app/data ./data
COPY --from=builder /app/index.html ./index.html

EXPOSE 3000

USER app

CMD ["node", "server/index.js"]