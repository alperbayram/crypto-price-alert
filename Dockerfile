# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built JavaScript files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Set environment variables
ENV NODE_ENV=production

# Expose API port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
