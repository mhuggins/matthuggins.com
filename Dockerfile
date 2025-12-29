# Use Node.js LTS version (18 or 20 for compatibility)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Declare build-time variables (Railway injects these)
ARG VITE_REMARK42_HOST
ARG VITE_REMARK42_SITE_ID

# Make them available as env vars during build
ENV VITE_REMARK42_HOST=$VITE_REMARK42_HOST
ENV VITE_REMARK42_SITE_ID=$VITE_REMARK42_SITE_ID

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 3000

# Start the server
CMD ["pnpm", "start"]