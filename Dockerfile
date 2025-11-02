# -------- Base (builder) --------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Install deps first for better caching
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

# Add source and build
COPY . .
RUN npm run build

# -------- Runner (production) --------
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy only what's needed at runtime
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/prisma ./prisma

EXPOSE 3090
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
