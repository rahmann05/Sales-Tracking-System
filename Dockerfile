# Production Dockerfile for Sinar Anugrah Backend (targeting Neon PostgreSQL)
FROM node:20-alpine AS runner

WORKDIR /app

# Install native dependencies required by Prisma engine on Alpine
RUN apk add --no-cache openssl libc6-compat

# Copy server package definitions and shared module
COPY server/package*.json ./server/
COPY server/prisma ./server/prisma/
COPY shared ./shared/

# Install server dependencies and generate Prisma Client
WORKDIR /app/server
RUN npm ci --omit=dev
RUN npx prisma generate

# Copy server source code
COPY server/src ./src
COPY server/index.js ./

# Copy production environment if available (fallback to environment injected by platform)
COPY server/.env.production ./.env

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Start server
CMD ["node", "index.js"]
