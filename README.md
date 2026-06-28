# 🎌 Cosplay Map — Client

Frontend for the **Helsinki / Vantaa cosplay map**: an interactive GIS map of
anime conventions **and** cosplay-friendly cafés, restaurants, malls and photo
spots (with pictures + themes). Playful, light/dark themed.

The backend lives in a **separate repo** (`cosplay-map-server`). This app is a
read-only consumer of its public HTTP APIs.

## Stack
Next.js (App Router) · TypeScript · Tailwind CSS · MapLibre GL JS (planned) · OpenFreeMap tiles

## Requirements
> ⚠️ **Node.js ≥ 20.9** (Next.js 16). If you're on Node 18, install Node 20 LTS
> (or 22) first — e.g. via [nvm-windows](https://github.com/coreybutler/nvm-windows).

## Run
```bash
pnpm install
pnpm dev          # → http://localhost:3000
```

Service URLs come from env vars (create `.env.local`):
```
NEXT_PUBLIC_EVENTS_API_URL=http://localhost:8787
NEXT_PUBLIC_PLACES_API_URL=http://localhost:8788
NEXT_PUBLIC_GIS_PROXY_URL=http://localhost:8789
```

## Structure
```
src/
├── app/          Next.js App Router pages
└── types.ts      Client-owned data contract (Event / Place / GeoJSON)
```

## Pages (planned)
Home · Map (+ mini-calendar) · Calendar · Events · Cosplay Spots · About · Donate ·
Admin (login-gated)

`src/types.ts` mirrors the server's `@anime-con/shared` contract by hand — keep
them in sync.
