# Railway.com Deployment Guide

This project is configured for easy deployment to Railway.com as a Single Page Application (SPA).

## 🚀 Quick Deploy to Railway

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for Railway deployment"
   git push origin main
   ```

2. **Deploy to Railway**:
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect the configuration

## 📁 Key Files for Railway

- **`src/server.ts`** - TypeScript Express server that serves the SPA with client-side routing
- **`package.json`** - Contains the `start` script Railway will use (`tsx src/server.ts`)
- **`railway.toml`** - Railway-specific configuration
- **`Dockerfile`** - Optional Docker configuration for more control

## 🛠 How It Works

1. **Build Process**: 
   - Railway runs `pnpm install` to install dependencies
   - Railway runs `pnpm run build` which:
     - Generates blog metadata (`prebuild`)
     - Builds the Vite project
     - Creates optimized static files in `dist/`

2. **Server**:
   - TypeScript Express.js server (compiled with `tsx`) serves static files from `dist/`
   - All routes fallback to `index.html` for client-side routing
   - Supports direct navigation to any route (e.g., `/`, `/blog/posts/slug`)
   - Full TypeScript type safety and development experience

## 🔧 Environment Variables

Railway automatically sets:
- `PORT` - The port your app runs on (defaults to 3000 locally)

## 📋 Scripts Available

- `pnpm run dev` - Development server with hot reload
- `pnpm run build` - Build for production (includes blog metadata generation)
- `pnpm start` - Start production server (used by Railway)
- `pnpm run preview` - Preview production build locally

## 🚦 Testing Locally

Test the production setup locally:

```bash
# Build the project
pnpm run build

# Start the production server
pnpm start

# Visit http://localhost:3000
```

## 🌐 Railway Features Used

- **Automatic builds** from GitHub pushes
- **Custom domains** (configure in Railway dashboard)
- **Environment variables** (if needed)
- **Automatic SSL/HTTPS**
- **CDN and edge caching**

## 🎯 SPA Benefits

- **Fast initial load** - Static assets served efficiently
- **Client-side routing** - Instant navigation between pages
- **Direct URL access** - All routes work with direct navigation
- **SEO friendly** - Proper fallbacks and meta tags
- **Automatic blog updates** - Content changes trigger rebuilds

Your blog will be live and ready to handle direct navigation to any route!

---

## 💬 Remark42 Comments Setup

Blog comments are powered by [Remark42](https://remark42.com/), a self-hosted commenting system running as a separate Railway service.

### Deploy Remark42 Service

1. **Add a new service** in your Railway project:
   - Click "New" → "Docker Image"
   - Enter image: `umputun/remark42:latest`

2. **Attach a volume** for persistent storage:
   - In the Remark42 service settings, add a Volume
   - Mount path: `/srv/var`

3. **Configure environment variables** for Remark42:

   | Variable | Description |
   |----------|-------------|
   | `REMARK_URL` | Full URL where Remark42 is hosted (e.g., `https://comments.matthuggins.com`) |
   | `SECRET` | Random string for JWT signing (generate with `openssl rand -base64 32`) |
   | `SITE` | Site identifier: `matthuggins` |
   | `AUTH_ANON` | `true` to allow anonymous comments |
   | `AUTH_GITHUB_CID` | GitHub OAuth App Client ID |
   | `AUTH_GITHUB_CSEC` | GitHub OAuth App Client Secret |
   | `AUTH_GOOGLE_CID` | Google OAuth Client ID |
   | `AUTH_GOOGLE_CSEC` | Google OAuth Client Secret |

4. **Set up a custom domain** (optional but recommended):
   - Add domain like `comments.matthuggins.com` in Railway
   - Or use the Railway-provided domain

### Create OAuth Applications

**GitHub OAuth App:**
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set callback URL: `https://comments.matthuggins.com/auth/github/callback`
4. Copy Client ID and Client Secret to Railway env vars

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://comments.matthuggins.com/auth/google/callback`
4. Copy Client ID and Client Secret to Railway env vars

### Configure Main Site

Add these environment variables to your **main site's** Railway service:

| Variable | Value |
|----------|-------|
| `VITE_REMARK42_HOST` | Remark42 URL (e.g., `https://comments.matthuggins.com`) |
| `VITE_REMARK42_SITE_ID` | `matthuggins` |

### Verify Installation

After deploying Remark42:
1. Visit [https://comments.matthuggins.com/web] to see the demo page
2. Test authentication with each OAuth provider
3. Leave a test comment on a blog post

### Remark42 Admin Access

To become an admin, find your user ID by:
1. Log in to Remark42 on any blog post
2. Check browser dev tools → Network → look for your user ID in API responses
3. Add `ADMIN_SHARED_ID=<your-user-id>` to Remark42 env vars

### Updating Remark42

To update to a newer version of Remark42:

1. Check for new releases at [Remark42 Releases](https://github.com/umputun/remark42/releases)
2. In Railway, go to the Remark42 service settings
3. Update the Docker image tag (e.g., `umputun/remark42:v1.13.0`)
4. Redeploy the service

**Tip:** Using a specific version tag (e.g., `v1.13.0`) instead of `latest` gives you more control over when updates happen and avoids unexpected changes.

### Useful Links

- [Remark42 Documentation](https://remark42.com/docs/)
- [Remark42 Docker Hub](https://hub.docker.com/r/umputun/remark42)
- [Remark42 Releases](https://github.com/umputun/remark42/releases)