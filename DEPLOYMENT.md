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