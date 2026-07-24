import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output = compacte productie-build voor Docker/Coolify.
  output: "standalone",
  // PGlite (WASM/fs) en postgres.js server-only houden.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
