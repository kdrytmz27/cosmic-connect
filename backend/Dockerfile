# Base image
FROM node:18-alpine AS builder

WORKDIR /app

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
FROM node:18-alpine

WORKDIR /app

# Create non-root user for security (prevents container escape privilege escalation)
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

# Copy built files and production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Directly generate the prisma client natively in production stage to guarantee matching binaries
RUN npx prisma generate

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]
