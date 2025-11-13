# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a20ffe12-b39b-486c-89d0-19b5862f3e28

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a20ffe12-b39b-486c-89d0-19b5862f3e28) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a20ffe12-b39b-486c-89d0-19b5862f3e28) and click on Share -> Publish.

### Docker deployment (frontend with API proxy)

This repo now includes a production Docker image that serves the built app with NGINX and proxies API calls on the same origin to avoid CORS.

- API requests are made to same-origin `/api/...` by default (runtime `VITE_API_URL` can override if needed).
- NGINX proxies `/api` to `BACKEND_URL` (environment variable) so the browser doesn’t hit cross-origin endpoints.

Build and run:

```sh
# Build the image
docker build -t citizen-flow:latest .

# Run (Windows/macOS Docker Desktop): proxies to backend on host:8080
# Change BACKEND_URL if your backend runs elsewhere
docker run --rm -p 8081:80 \
  -e BACKEND_URL=http://host.docker.internal:8080 \
  -e VITE_API_URL= \
  citizen-flow:latest

# Open http://localhost:8081
```

Notes:
- Set `BACKEND_URL` to your backend base (no trailing slash). The container proxies `/api/*` to `${BACKEND_URL}/api/*`.
- Optionally set `VITE_API_URL` to a full URL if you prefer the frontend to call the backend directly (bypassing the proxy). Leave it empty to use the proxy.
- Ensure your backend is exposed on the host and reachable from the container or in the same Docker network.

### docker-compose

Two profiles are provided:
- `host-backend`: runs only the frontend; proxies to a backend running on the host (default `http://host.docker.internal:8080`).
- `with-backend`: runs frontend and a placeholder backend service named `backend` (replace the image/build as needed).

Examples:

```bash
# Frontend only, host-proxied backend
# On Linux, set BACKEND_URL to your host IP (e.g., http://172.17.0.1:8080)
docker compose --profile host-backend up --build frontend-only

# Frontend + backend (replace backend image or build in docker-compose.yml first)
docker compose --profile with-backend up --build frontend backend
```

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
