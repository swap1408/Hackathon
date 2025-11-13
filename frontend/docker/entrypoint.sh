#!/usr/bin/env bash
set -euo pipefail

# Build frontend runtime env.js
: "${VITE_API_URL:=/api}"
: "${CITYASSIST_API_URL:=http://python:8000}"

cat > /usr/share/nginx/html/env.js <<EOF
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL}",
  CITYASSIST_API_URL: "${CITYASSIST_API_URL}"
};
EOF

echo "Generated env.js:"
cat /usr/share/nginx/html/env.js

# Generate NGINX config
envsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Starting NGINX..."
exec nginx -g 'daemon off;'
