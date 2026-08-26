FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# .env.production harus sudah tersedia di build context
# dan akan digunakan oleh Vite ketika npm run build dijalankan.
# Verify .env.production
RUN test -f /app/.env.production || \
    (echo "ERROR: /app/.env.production NOT FOUND" && exit 1)

RUN echo "===== .env.production detected =====" && \
    echo "File:" && ls -lah /app/.env.production && \
    echo "Line count:" && wc -l /app/.env.production && \
    echo "Variables:" && \
    sed -E 's/^([[:space:]]*[A-Za-z_][A-Za-z0-9_]*)=.*/\1=***MASKED***/' \
    /app/.env.production && \
    echo "====================================="


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