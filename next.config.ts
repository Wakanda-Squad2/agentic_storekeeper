import type { NextConfig } from "next";

/**
 * Allow HMR / dev overlay when opening the site from another device on the LAN
 * (e.g. http://192.168.x.x:3000). Comma-separated hostnames only, no protocol.
 * Set in `.env.local`: NEXT_DEV_ALLOWED_ORIGINS=192.168.0.104
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
 */
const allowedDevOrigins = (process.env.NEXT_DEV_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  // Tailwind v4 (@tailwindcss/oxide) loads platform `.node` binaries via optional deps.
  // Keeping these external avoids Turbopack bundling oxide in a context where
  // `require("@tailwindcss/oxide-darwin-arm64")` cannot be resolved (native binding errors).
  serverExternalPackages: [
    "@tailwindcss/postcss",
    "@tailwindcss/oxide",
    "tailwindcss",
  ],
};

export default nextConfig;