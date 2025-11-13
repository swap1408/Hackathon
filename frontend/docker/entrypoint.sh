#!/usr/bin/env bash
set -euo pipefail

# Generate runtime env.js for frontend (window.__ENV__)
: "${VITE_API_URL:=}"
cat > /usr/share/nginx/html/env.js <<EOF
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL}"
};
EOF

echo "Generated /usr/share/nginx/html/env.js with VITE_API_URL='${VITE_API_URL}'"

# Generate nginx config from template using BACKEND_URL
: "${BACKEND_URL:?BACKEND_URL must be set (e.g., http://host.docker.internal:8080)}"
mkdir -p /etc/nginx/conf.d
envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Using BACKEND_URL='${BACKEND_URL}'"

# Start nginx in foreground
exec nginx -g 'daemon off;'
