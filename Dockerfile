# Use official Node.js Slim runtime as base image (lightweight, includes essentials)
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user for security (Debian syntax)
RUN groupadd --gid 1001 nodejs && \
	useradd --uid 1001 --gid nodejs --shell /usr/sbin/nologin nodejs

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
	CMD node -e "console.log('healthy')" || exit 1

# Run the application
CMD ["npm", "start"]
