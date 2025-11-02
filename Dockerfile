FROM node:20-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy built files and dependencies
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./
COPY --from=base /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Run migrations and start app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
