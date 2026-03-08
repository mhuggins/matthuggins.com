# Use Node.js LTS version (18 or 20 for compatibility)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy workspace manifest files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/website/package.json apps/website/
COPY packages/cargo-dispatch/package.json packages/cargo-dispatch/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/ui/package.json packages/ui/

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
