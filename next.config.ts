import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Off so dev doesn't double-mount components — that double-mount creates the
  // MapLibre map, tears it down, and re-creates it mid-load, leaving it blank.
  reactStrictMode: false,
  // Pin the workspace root to this folder. Without this, Next can pick up a
  // stray lockfile elsewhere (e.g. C:\Users\preaw\package-lock.json) and guess
  // the wrong root, which breaks module resolution in dev.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
