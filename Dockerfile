# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install -g typescript
RUN npm install --legacy-peer-deps
RUN cd server && npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the server with explicit error checking
RUN cd server && npm run build && ls -la dist/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port (Railway will set PORT environment variable)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/api/health || exit 1

# Start the application
CMD ["sh", "-c", "cd server && ls -la && npm run start:prod"] 