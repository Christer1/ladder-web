import type { NextConfig } from "next";

// Server-only origin of ladder-backend (e.g. https://ladder-api.example.com). When set, the
// browser calls /api/v1/* on this app's own domain and Next.js proxies it to the backend, so the
// session cookie is first-party. iOS browsers (Safari, and Chrome on iOS) block cross-site
// cookies, which breaks sign-in when the web app and API live on different domains.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!BACKEND_ORIGIN) return [];
    return [{ source: "/api/v1/:path*", destination: `${BACKEND_ORIGIN}/api/v1/:path*` }];
  },
  cacheComponents: true,
  // Don't let `next dev` write AGENTS.md (instructions for AI coding tools) into the repo.
  agentRules: false,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
