# Build stage
FROM node:20-alpine AS builder

# Install python/make/g++ for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN apk add --no-cache python3 make g++ && \
    npm install --omit=dev && \
    apk del python3 make g++

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
# Copy migrations if needed (usually handled by code, but good to have source if using CLI)
COPY --from=builder /app/migrations ./migrations

# Create data directory
RUN mkdir -p /app/data

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL=file:/app/data/pulse.db

EXPOSE 5000

CMD ["npm", "start"]
