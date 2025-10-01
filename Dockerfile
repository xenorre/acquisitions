# Multi-stage Dockerfile for Node.js application
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci
COPY . .

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http'); const req=http.get('http://localhost:3000/health', res=>{ process.exit(res.statusCode===200?0:1) }); req.on('error', ()=>process.exit(1));"

EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS build
RUN npm ci
COPY . .
RUN npm run db:generate

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy production files
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/package*.json ./
COPY --from=build /app/drizzle.config.js ./

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["npm", "start"]