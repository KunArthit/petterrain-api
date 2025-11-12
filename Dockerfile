# Base Bun image
FROM oven/bun:1 AS base

# ========== Dependencies Stage ==========
FROM base AS deps

WORKDIR /app

COPY package.json .
COPY bun.lockb .
COPY prisma ./prisma

RUN bun install --production
RUN bun prisma generate

# ========== Builder Stage ==========
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

COPY src ./src
COPY package.json .
COPY tsconfig.json .
COPY .env .
COPY images ./images
COPY videos ./videos

ENV NODE_ENV=production

RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile server \
    ./src/index.ts

# ========== Runner Stage (Ubuntu LTS) ==========
FROM ubuntu:22.04

# Install required libraries for Prisma and clean up
RUN apt-get update && apt-get install -y \
    libgcc-s1 \
    libstdc++6 \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser -s /bin/false appuser

WORKDIR /app

COPY --from=builder /app/server ./server
COPY --from=builder /app/.env ./.env
COPY --from=builder /app/images ./images
COPY --from=builder /app/videos ./videos
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set proper ownership and permissions
RUN chown -R appuser:appuser /app && \
    chmod +x ./server

# Switch to non-root user
USER appuser

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

EXPOSE 8080
CMD ["./server"]