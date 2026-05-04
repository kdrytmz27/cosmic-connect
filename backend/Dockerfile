# Base image
FROM node:18-slim AS builder

WORKDIR /app

# Install openssl for Prisma engine detection
RUN apt-get update -y && apt-get install -y openssl

# Install build dependencies completely
COPY package*.json ./
COPY tsconfig.json ./

# Sadece dependencies kur (devDependencies dahil)
RUN npm install

# Copy source and Prisma schema
COPY src ./src
COPY prisma ./prisma

# Generate Prisma Client & Build
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:18-slim

WORKDIR /app

# Install openssl for Prisma engine detection
RUN apt-get update -y && apt-get install -y openssl

# Create non-root user for security (Debian way instead of Alpine)
RUN groupadd -g 1001 appgroup && useradd -u 1001 -g appgroup -s /bin/sh -m appuser

# Copy built files and production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]
