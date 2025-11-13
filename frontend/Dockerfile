# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source
COPY . .

# Fix vite permission
RUN chmod +x node_modules/.bin/vite || true

# Build app
RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine

# Install envsubst for runtime templating
RUN apk add --no-cache bash gettext

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Add nginx template and entrypoint
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose container port
EXPOSE 80

# Environment variables
ENV BACKEND_URL="http://backend:8080"

# Use custom entrypoint
ENTRYPOINT ["/entrypoint.sh"]

