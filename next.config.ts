import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output = compacte productie-build voor Docker/Coolify.
  output: "standalone",
  // PGlite (WASM/fs) en postgres.js server-only houden.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  eslint: { ignoreDuringBuilds: true },
  // Type-check draait apart (lokaal `tsc --noEmit` + CI). De ingebouwde
  // "Checking validity of types"-stap tijdens `next build` is de zwaarste
  // geheugenstap en OOM't op kleine servers → hier overslaan.
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
