# Stage 1: Base image with pnpm
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm using corepack (modern approach)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Stage 2: Dependencies
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 3: Development
FROM base AS dev
WORKDIR /app

# Accept build arguments for basePath (needed at build time for next.config.ts)
ARG NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}

# Set CI=true to prevent pnpm from asking for confirmation
ENV CI=true

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml* ./

# Copy source code (will be mounted as volume in docker-compose, but needed for initial setup)
COPY . .

# Development environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run dev server with hot reload
CMD ["pnpm", "dev"]

# Stage 4: Builder
FROM base AS builder
WORKDIR /app

# Accept build arguments for basePath (needed at build time for next.config.ts)
ARG NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}

# Set CI=true to prevent pnpm from asking for confirmation
ENV CI=true

# Copy package files first
COPY package.json pnpm-lock.yaml* ./

# Copy source code
COPY . .

# Install dependencies again in builder stage
# This ensures native binaries (like lightningcss) are built for the correct platform
# If you encounter "Cannot find module '../lightningcss.linux-arm-musl.node'" errors,
# this workaround ensures the build environment has the correct binaries
RUN pnpm install --frozen-lockfile

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN pnpm build

# Stage 5: Runner
FROM base AS runner
WORKDIR /app

# Accept build arguments and set as environment variables for runtime
ARG NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Create .next directory and set permissions for prerender cache
RUN mkdir -p .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]

